import React from 'react';
import { Frame, QueueTask, WebApiTask } from '../types';
import { Layers, Clock, Zap, Coffee, Terminal, RotateCw, ArrowUp, ArrowRight } from 'lucide-react';
import { EventLoopStatus } from '../engine/EventLoopEngine';

export const CallStack: React.FC<{ stack: Frame[] }> = ({ stack }) => {
  return (
    <div className="flex flex-col h-full bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg overflow-hidden group hover:border-blue-500/30 transition-all">
      <div className="bg-[#0f172a] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <h3 className="text-sm font-bold text-slate-200 tracking-wide">Call Stack</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 flex-shrink-0">LIFO</span>
      </div>
      <div className="flex-1 p-4 flex flex-col-reverse justify-start gap-2 bg-[#0B1120] relative overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
        {stack.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700/50 pointer-events-none">
            <Layers className="w-12 h-12 opacity-20 mb-3" />
            <span className="text-xs font-medium">Stack Empty</span>
          </div>
        )}
        {stack.map((frame, i) => (
          <div
            key={frame.id || i}
            className="w-full bg-[#1e293b] border-l-4 border-blue-500 shadow-md rounded-r px-3 py-3 text-sm font-mono flex items-center justify-between animate-in slide-in-from-top-4 duration-300 border-y border-r border-slate-700/50"
          >
            <span className="truncate text-blue-100 font-medium flex-1 mr-2">{frame.name}</span>
            {frame.lineNumber && (
                <span className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold tracking-tight flex-shrink-0">
                Ln {frame.lineNumber}
                </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const WebApis: React.FC<{ tasks: WebApiTask[] }> = ({ tasks }) => {
  return (
    <div className="flex flex-col h-full bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg overflow-hidden hover:border-emerald-500/30 transition-all">
      <div className="bg-[#0f172a] border-b border-slate-700 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <h3 className="text-sm font-bold text-slate-200 tracking-wide">Web APIs</h3>
      </div>
      <div className="flex-1 p-4 flex flex-wrap content-start gap-2 bg-[#0B1120] relative overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
        {tasks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700/50 pointer-events-none">
             <Clock className="w-12 h-12 opacity-20 mb-3" />
            <span className="text-xs font-medium">No Active Timers</span>
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="relative overflow-hidden bg-emerald-950/30 border border-emerald-500/30 text-emerald-100 rounded-lg px-3 py-2 text-xs font-mono w-full animate-in zoom-in-95 duration-300 shadow-sm"
          >
            <div className="flex justify-between font-bold mb-1.5 items-center">
              <span className="text-emerald-300 truncate flex-1 mr-2">{task.name}</span>
              <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 border border-emerald-500/20 flex-shrink-0">{task.delay}ms</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-1/2 animate-[pulse_1s_ease-in-out_infinite]"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EventLoopIndicator: React.FC<{ status: EventLoopStatus }> = ({ status }) => {
    const isSpinning = status !== 'idle';
    const isMicro = status === 'transferring_micro';
    const isMacro = status === 'transferring_macro';
    const isChecking = status === 'checking';

    let statusText = "Idle";
    let statusColor = "text-slate-500";
    let statusBg = "bg-slate-800/50";
    let borderColor = "border-slate-700";

    if (isChecking) {
        statusText = "Checking Queues...";
        statusColor = "text-yellow-400";
        statusBg = "bg-yellow-900/20";
        borderColor = "border-yellow-600/50";
    } else if (isMicro) {
        statusText = "Pushing Microtask";
        statusColor = "text-violet-400";
        statusBg = "bg-violet-900/20";
        borderColor = "border-violet-600/50";
    } else if (isMacro) {
        statusText = "Pushing Macrotask";
        statusColor = "text-orange-400";
        statusBg = "bg-orange-900/20";
        borderColor = "border-orange-600/50";
    }

    return (
        <div className={`relative flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 rounded-xl border ${borderColor} ${statusBg} transition-all duration-300 overflow-hidden gap-3 sm:gap-0 h-full`}>
             <div className="flex items-center gap-3 relative z-10">
                 <div className={`p-2 rounded-full border border-slate-600/50 bg-[#0B1120] transition-transform ${isSpinning ? 'animate-spin' : ''}`}>
                    <RotateCw className={`w-5 h-5 ${statusColor}`} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Event Loop</span>
                    <span className={`text-sm font-bold ${statusColor} font-mono`}>{statusText}</span>
                 </div>
             </div>

             <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                  <div className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${isMicro ? 'opacity-100' : 'opacity-20'}`}>
                      <span className="text-[9px] font-bold text-violet-400">MICRO</span>
                      <div className="h-4 sm:h-6 w-0.5 bg-violet-500/50 relative">
                         <div className={`absolute bottom-0 w-full bg-violet-400 transition-all ${isMicro ? 'h-full animate-ping' : 'h-0'}`}></div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  </div>

                  <div className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${isMacro ? 'opacity-100' : 'opacity-20'}`}>
                      <span className="text-[9px] font-bold text-orange-400">MACRO</span>
                      <div className="h-4 sm:h-6 w-0.5 bg-orange-500/50 relative">
                        <div className={`absolute bottom-0 w-full bg-orange-400 transition-all ${isMacro ? 'h-full animate-ping' : 'h-0'}`}></div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  </div>
                  
                  <ArrowRight className={`w-5 h-5 text-slate-600 transition-colors ${isSpinning ? 'text-slate-300' : ''}`} />
                  
                  <div className="flex items-center gap-2">
                       <div className="flex flex-col items-center">
                            <ArrowUp className={`w-4 h-4 mb-1 transition-all ${isSpinning ? 'text-blue-400 animate-bounce' : 'text-slate-700'}`} />
                            <div className="px-2 py-1 bg-[#0B1120] border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
                                STACK
                            </div>
                       </div>
                  </div>
             </div>
        </div>
    );
}

export const MicrotaskQueue: React.FC<{ tasks: QueueTask[] }> = ({ tasks }) => {
  return (
    <div className="flex flex-col bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg overflow-hidden h-full hover:border-violet-500/30 transition-all">
      <div className="bg-[#0f172a] border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <h3 className="text-sm font-bold text-slate-200 tracking-wide">Microtasks</h3>
        </div>
        <span className="text-[10px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20 font-bold uppercase tracking-wider flex-shrink-0">
          High Priority
        </span>
      </div>
      <div className="flex-1 p-3 flex items-center gap-3 overflow-x-auto bg-[#0B1120] min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
        {tasks.length === 0 && (
          <span className="text-xs text-slate-600 mx-auto flex items-center gap-2 font-mono">
             Queue Empty
          </span>
        )}
        {tasks.map((task, i) => (
          <div
            key={task.id + i}
            className="flex-shrink-0 bg-violet-950/40 border border-violet-500/40 text-violet-200 px-4 py-3 rounded-lg text-xs font-mono shadow-md flex items-center gap-2 min-w-[140px] justify-center animate-in slide-in-from-right-8 duration-300"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse flex-shrink-0"></div>
            <span className="truncate">{task.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MacrotaskQueue: React.FC<{ tasks: QueueTask[] }> = ({ tasks }) => {
  return (
    <div className="flex flex-col bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg overflow-hidden h-full hover:border-orange-500/30 transition-all">
      <div className="bg-[#0f172a] border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
         <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <h3 className="text-sm font-bold text-slate-200 tracking-wide">Macrotasks</h3>
         </div>
         <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 flex-shrink-0">Standard Priority</span>
      </div>
      <div className="flex-1 p-3 flex items-center gap-3 overflow-x-auto bg-[#0B1120] min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
        {tasks.length === 0 && (
          <span className="text-xs text-slate-600 mx-auto flex items-center gap-2 font-mono">
             Queue Empty
          </span>
        )}
        {tasks.map((task, i) => (
          <div
            key={task.id + i}
            className="flex-shrink-0 bg-orange-950/40 border border-orange-500/40 text-orange-200 px-4 py-3 rounded-lg text-xs font-mono shadow-md flex items-center gap-2 min-w-[140px] justify-center animate-in slide-in-from-right-8 duration-300"
          >
             <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
            <span className="truncate">{task.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ConsoleOutput: React.FC<{ logs: string[] }> = ({ logs }) => {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (bottomRef.current && containerRef.current) {
      const container = containerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom || logs.length === 1) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-48 bg-black rounded-xl shadow-lg overflow-hidden border border-slate-700 ring-1 ring-white/5 flex-shrink-0">
      <div className="bg-[#0f172a] px-4 py-2 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Console Output</h3>
        </div>
        <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
        {logs.length === 0 && (
          <div className="text-slate-700 italic flex items-center gap-2">
            <div className="w-1 h-3 bg-slate-700 animate-pulse"></div>
            <span>Waiting for logs...</span>
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 animate-in fade-in duration-200 group">
            <span className="text-slate-600 select-none w-4 text-right flex-shrink-0">{i + 1}</span>
            <span className="text-blue-500 select-none flex-shrink-0">➜</span>
            <span className="text-slate-300 font-medium group-hover:text-white transition-colors break-all">{log}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
