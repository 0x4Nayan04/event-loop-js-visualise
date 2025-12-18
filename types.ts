
export enum TaskType {
  MAIN = 'MAIN',
  FUNCTION = 'FUNCTION',
  TIMEOUT_CALLBACK = 'TIMEOUT',
  PROMISE_CALLBACK = 'PROMISE',
  CONSOLE_LOG = 'LOG',
  ASYNC_OP = 'ASYNC'
}

export interface CodeLine {
  id: string;
  code: string;
  lineNumber: number;
}

export interface Frame {
  id: string;
  name: string;
  type: TaskType;
  lineNumber?: number;
}

export interface WebApiTask {
  id: string;
  name: string;
  delay: number;
  callbackId: string; // ID of the code block to run
  remainingTime: number;
  createdAt: number; // For stable sort on equal delays
}

export interface QueueTask {
  id: string;
  name: string;
  type: TaskType;
  callbackCode: string[]; // Lines of code to execute
}

export interface SimulationState {
  codeLines: string[];
  callStack: Frame[];
  webApis: WebApiTask[];
  microTaskQueue: QueueTask[];
  macroTaskQueue: QueueTask[];
  consoleOutput: string[];
  isPaused: boolean;
  highlightLine: number | null;
  activeComponent: 'stack' | 'webapi' | 'micro' | 'macro' | 'none';
}
