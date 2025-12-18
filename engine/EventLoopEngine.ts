import { Frame, QueueTask, SimulationState, TaskType, WebApiTask } from '../types';

export type EventLoopStatus = 'idle' | 'checking' | 'transferring_micro' | 'transferring_macro';

export interface Snapshot {
    id: number;
    callStack: Frame[];
    webApis: WebApiTask[];
    microTaskQueue: QueueTask[];
    macroTaskQueue: QueueTask[];
    consoleOutput: string[];
    highlightLine: number | null;
    description: string;
    eventLoopStatus: EventLoopStatus;
}

export class TimelineGenerator {
    private snapshots: Snapshot[] = [];
    private currentId = 0;
    private codeLines: string[] = [];
    private occurrenceMap: Map<string, number> = new Map();
    
    generate(code: string): Snapshot[] {
        this.snapshots = [];
        this.currentId = 0;
        this.codeLines = code.split('\n');
        this.occurrenceMap.clear();
        
        // Initial Empty State
        this.addSnapshot([], [], [], [], [], null, "Idle", 'idle');

        const mainStackFrame: Frame = { id: 'main', name: 'main()', type: TaskType.MAIN, lineNumber: 1 };
        let stack: Frame[] = [mainStackFrame];
        let consoleOut: string[] = [];
        let webApis: WebApiTask[] = [];
        let microQueue: QueueTask[] = [];
        let macroQueue: QueueTask[] = [];

        this.addSnapshot(stack, webApis, microQueue, macroQueue, consoleOut, 1, "Start script execution", 'idle');

        try {
            this.runWithMock(code);
        } catch (e) {
            console.error("Parse error", e);
            this.addSnapshot([], [], [], [], ["Error parsing code. Please use supported syntax."], null, "Error", 'idle');
        }

        // Final State cleanup
        if (this.snapshots.length > 0) {
             const last = this.snapshots[this.snapshots.length - 1];
             if (last.callStack.length > 0) {
                 this.addSnapshot([], last.webApis, last.microTaskQueue, last.macroTaskQueue, last.consoleOutput, null, "Main script finished", 'idle');
             }
        }
        
        return this.snapshots;
    }

    private addSnapshot(
        stack: Frame[], 
        web: WebApiTask[], 
        micro: QueueTask[], 
        macro: QueueTask[], 
        logs: string[], 
        line: number | null,
        desc: string,
        evStatus: EventLoopStatus
    ) {
        this.snapshots.push({
            id: this.currentId++,
            callStack: JSON.parse(JSON.stringify(stack)),
            webApis: JSON.parse(JSON.stringify(web)),
            microTaskQueue: JSON.parse(JSON.stringify(micro)),
            macroTaskQueue: JSON.parse(JSON.stringify(macro)),
            consoleOutput: [...logs],
            highlightLine: line,
            description: desc,
            eventLoopStatus: evStatus
        });
    }

    // Improved heuristic: tracks nth occurrence of a snippet
    private findLineNumber(snippet: string, nth: number = 0): number | undefined {
        const cleanSnippet = snippet.trim();
        let currentCount = 0;
        
        for (let i = 0; i < this.codeLines.length; i++) {
            if (this.codeLines[i].includes(cleanSnippet)) {
                if (currentCount === nth) {
                    return i + 1; // 1-based index
                }
                currentCount++;
            }
        }
        return undefined;
    }

    private getOccurrenceCount(key: string): number {
        const val = this.occurrenceMap.get(key) || 0;
        this.occurrenceMap.set(key, val + 1);
        return val;
    }

    private runWithMock(code: string) {
        let stack: Frame[] = [{ id: 'main', name: 'main()', type: TaskType.MAIN, lineNumber: 1 }];
        let webApis: WebApiTask[] = [];
        let microQueue: QueueTask[] = [];
        let macroQueue: QueueTask[] = [];
        let consoleOut: string[] = [];
        
        const update = (desc: string, line?: number, evStatus: EventLoopStatus = 'idle') => {
            this.addSnapshot(stack, webApis, microQueue, macroQueue, consoleOut, line || null, desc, evStatus);
        };

        const mockLog = (msg: string) => {
             const key = `console.log('${msg}')`;
             const altKey = `console.log("${msg}")`;
             const count = this.getOccurrenceCount(`log-${msg}`);
             
             // Try single quotes first, then double
             let line = this.findLineNumber(key, count);
             if (!line) line = this.findLineNumber(altKey, count);
             
             stack.push({ id: 'log', name: 'console.log', type: TaskType.CONSOLE_LOG, lineNumber: line });
             update(`console.log('${msg}')`, line);
             
             consoleOut.push(msg);
             update(`Output: ${msg}`, line);
             
             stack.pop();
             update('Pop console.log', line);
        };

        const mockSetTimeout = (cb: Function, delay: number) => {
             const count = this.getOccurrenceCount('setTimeout');
             const line = this.findLineNumber(`setTimeout`, count);

             stack.push({ id: 'st', name: 'setTimeout', type: TaskType.FUNCTION, lineNumber: line });
             update(`setTimeout(..., ${delay})`, line);
             
             const taskId = crypto.randomUUID();
             const apiTask: WebApiTask = {
                 id: taskId,
                 name: 'timer',
                 delay,
                 remainingTime: delay,
                 callbackId: 'cb-' + taskId,
                 createdAt: Date.now() + Math.random() // Add random to avoid strict collision if called too fast in mock
             };
             webApis.push(apiTask);
             update('Add to Web APIs', line);

             stack.pop();
             update('Pop setTimeout', line);

             this.pendingMacrotasks.push({ cb, task: apiTask });
        };

        const mockQueueMicrotask = (cb: Function) => {
             const count = this.getOccurrenceCount('queueMicrotask');
             const line = this.findLineNumber(`queueMicrotask`, count);
             
             stack.push({ id: 'qm', name: 'queueMicrotask', type: TaskType.FUNCTION, lineNumber: line });
             update('queueMicrotask(...)', line);

             const taskId = crypto.randomUUID();
             microQueue.push({
                 id: taskId,
                 name: 'microtask',
                 type: TaskType.FUNCTION,
                 callbackCode: []
             });
             update('Add to Microtask Queue', line);
             
             stack.pop();
             update('Pop queueMicrotask', line);

             this.pendingMicrotasks.push({ cb, id: taskId });
        };
        
        const mockPromise = {
            resolve: () => ({
                then: (cb: Function) => {
                    const count = this.getOccurrenceCount('then');
                    const line = this.findLineNumber(`.then`, count);

                    stack.push({ id: 'pr', name: 'Promise.then', type: TaskType.FUNCTION, lineNumber: line });
                    update('Promise.resolve().then(...)', line);
                    
                    const taskId = crypto.randomUUID();
                    microQueue.push({
                        id: taskId,
                        name: 'promise.then',
                        type: TaskType.PROMISE_CALLBACK,
                        callbackCode: []
                    });
                    update('Add to Microtask Queue', line);
                    
                    stack.pop();
                    update('Pop Promise.then', line);
                    
                    this.pendingMicrotasks.push({ cb, id: taskId });
                }
            })
        };

        this.pendingMicrotasks = [];
        this.pendingMacrotasks = [];

        try {
            // Re-initialize map for the run
            this.occurrenceMap.clear();
            
            const safeRunner = new Function('console', 'setTimeout', 'Promise', 'queueMicrotask', code);
            safeRunner({ log: mockLog }, mockSetTimeout, mockPromise, mockQueueMicrotask);
            
            stack.pop(); 
            update('Main script finished');

            const maxLoops = 50;
            let loopCount = 0;

            while ((this.pendingMicrotasks.length > 0 || this.pendingMacrotasks.length > 0 || webApis.length > 0) && loopCount < maxLoops) {
                loopCount++;
                
                // EVENT LOOP CHECKING
                update('Event Loop: Checking Call Stack...', undefined, 'checking');
                if (stack.length > 0) {
                     continue; 
                }

                // 1. Flush Microtasks
                if (this.pendingMicrotasks.length > 0) {
                    update('Event Loop: Microtasks found!', undefined, 'checking'); 
                }

                while (this.pendingMicrotasks.length > 0) {
                    const task = this.pendingMicrotasks.shift()!;
                    const qIdx = microQueue.findIndex(t => t.id === task.id);
                    if (qIdx > -1) microQueue.splice(qIdx, 1);
                    
                    update('Event Loop: Moving Microtask to Call Stack', undefined, 'transferring_micro');

                    stack.push({ id: 'micro', name: 'Microtask Callback', type: TaskType.PROMISE_CALLBACK });
                    update('Run Microtask', undefined); 
                    
                    task.cb(); 

                    stack.pop();
                    update('Microtask finished');
                    
                    if (this.pendingMicrotasks.length > 0) {
                         update('Event Loop: Checking next Microtask...', undefined, 'checking');
                    }
                }

                // 2. Run ONE Macrotask (if Microtasks are empty)
                if (this.pendingMacrotasks.length > 0) {
                    update('Event Loop: Microtasks empty. Checking Macrotasks...', undefined, 'checking');
                    
                    // Sort by Delay first, then by Creation Time (FIFO)
                    this.pendingMacrotasks.sort((a, b) => {
                        if (a.task.delay === b.task.delay) {
                            return a.task.createdAt - b.task.createdAt;
                        }
                        return a.task.delay - b.task.delay;
                    });

                    const nextMacro = this.pendingMacrotasks.shift()!;
                    
                    const wIdx = webApis.findIndex(t => t.id === nextMacro.task.id);
                    if (wIdx > -1) webApis.splice(wIdx, 1);
                    
                    macroQueue.push({
                        id: nextMacro.task.id,
                        name: 'Macrotask',
                        type: TaskType.TIMEOUT_CALLBACK,
                        callbackCode: []
                    });
                    update('Timer finished -> Macrotask Queue', undefined, 'idle');
                    
                    update('Event Loop: Moving Macrotask to Call Stack', undefined, 'transferring_macro');

                    const macroTask = macroQueue.shift()!;
                    stack.push({ id: 'macro', name: 'Timeout Callback', type: TaskType.TIMEOUT_CALLBACK });
                    update('Run Macrotask');
                    
                    nextMacro.cb();

                    stack.pop();
                    update('Macrotask finished');
                } else {
                     if (this.pendingMicrotasks.length === 0 && loopCount === 1) {
                         update('Event Loop: No tasks in queues', undefined, 'checking');
                     }
                }
            }

        } catch (e) {
            console.error(e);
            update('Error executing code');
        }
    }
    
    private pendingMicrotasks: { cb: Function, id: string }[] = [];
    private pendingMacrotasks: { cb: Function, task: WebApiTask }[] = [];
}
