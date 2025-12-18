import React, { useState, useEffect, useCallback, useRef } from 'react';
import CodeEditor from './components/CodeEditor';
import { CallStack, WebApis, MicrotaskQueue, MacrotaskQueue, ConsoleOutput, EventLoopIndicator } from './components/VisualizerComponents';
import { EXAMPLES } from './constants';
import { TimelineGenerator, Snapshot } from './engine/EventLoopEngine';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Zap, ChevronDown, Check } from 'lucide-react';

const generator = new TimelineGenerator();

export default function App() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [selectedExample, setSelectedExample] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runAnalysis = useCallback(() => {
    const generatedSnapshots = generator.generate(code);
    setSnapshots(generatedSnapshots);
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsReady(true);
  }, [code]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentIndex < snapshots.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else if (currentIndex >= snapshots.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, snapshots.length, speed]);

  const currentSnapshot = snapshots[currentIndex] || {
    callStack: [],
    webApis: [],
    microTaskQueue: [],
    macroTaskQueue: [],
    consoleOutput: [],
    description: "Ready",
    highlightLine: null,
    eventLoopStatus: 'idle'
  };

  const handleExampleChange = (index: number) => {
      setSelectedExample(index);
      setCode(EXAMPLES[index].code);
      setIsReady(false);
      setSnapshots([]);
      setCurrentIndex(0);
      setIsDropdownOpen(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
      
      <header className="border-b border-slate-800 bg-[#0f172a] sticky top-0 z-50 shadow-md">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                    <Zap className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                    <h1 className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">Event Loop Visualizer</h1>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span>v1.0.0</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>Interactive Runtime</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4" ref={dropdownRef}>
                 <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-[#1e293b] hover:bg-[#283548] text-slate-200 px-3 sm:px-4 py-2 rounded-md border border-slate-700 transition-all hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <span className="truncate max-w-[120px] sm:max-w-none">{EXAMPLES[selectedExample].name}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-[#1e293b] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/50">
                                Load Example
                            </div>
                            {EXAMPLES.map((ex, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleExampleChange(i)}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between border-b border-slate-800 last:border-0 hover:bg-slate-800/80 transition-colors ${selectedExample === i ? 'bg-blue-900/20 text-blue-400' : 'text-slate-300'}`}
                                >
                                    <span className="truncate">{ex.name}</span>
                                    {selectedExample === i && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden">
        
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 sm:gap-4 max-h-[calc(100vh-5rem)]">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CodeEditor 
                code={code} 
                setCode={setCode} 
                disabled={isReady && isPlaying} 
                highlightLine={currentSnapshot.highlightLine}
            />
          </div>
          
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 sm:p-5 shadow-lg flex-shrink-0">
             <div className="mb-4 sm:mb-6">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 font-mono uppercase tracking-wide">
                    <span>Execution Step</span>
                    <span>{snapshots.length > 0 ? currentIndex + 1 : 0} / {snapshots.length || 0}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner border border-slate-800/50">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                        style={{ width: `${snapshots.length > 0 ? ((currentIndex + 1) / snapshots.length) * 100 : 0}%` }}
                    />
                </div>
             </div>

             <div className="grid grid-cols-4 gap-2 mb-4">
                {!isReady ? (
                    <button 
                        onClick={runAnalysis}
                        className="col-span-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <Play className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" /> 
                        Run Code
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={handleReset} 
                            className="col-span-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-lg flex items-center justify-center transition-all border border-slate-700 h-10 sm:h-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                            title="Reset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="col-span-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 transition-all border border-slate-700 h-10 sm:h-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            title="Step Back"
                        >
                            <SkipBack className="w-4 h-4" fill="currentColor" />
                        </button>
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)} 
                            disabled={currentIndex >= snapshots.length - 1}
                            className={`col-span-1 rounded-lg text-white font-medium flex items-center justify-center transition-all border border-transparent shadow-lg h-10 sm:h-11 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-900/20 focus:ring-amber-500/50' : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-900/20 focus:ring-emerald-500/50'} ${currentIndex >= snapshots.length - 1 ? 'disabled:bg-slate-700' : ''}`}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                        </button>
                        <button 
                            onClick={() => setCurrentIndex(prev => Math.min(snapshots.length - 1, prev + 1))}
                            disabled={currentIndex === snapshots.length - 1}
                            className="col-span-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 transition-all border border-slate-700 h-10 sm:h-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            title="Step Forward"
                        >
                            <SkipForward className="w-4 h-4" fill="currentColor" />
                        </button>
                    </>
                )}
             </div>

             {isReady && (
                <div className="flex items-center gap-3 pt-3 sm:pt-4 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[40px]">Speed</span>
                    <input 
                        type="range" 
                        min="100" 
                        max="2000" 
                        step="100" 
                        value={speed} 
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        title={`${speed}ms per step`}
                    />
                    <span className="text-[10px] font-mono text-slate-500 min-w-[45px]">{speed}ms</span>
                     <button 
                        onClick={() => { setIsReady(false); setSnapshots([]); setCurrentIndex(0); setIsPlaying(false); }}
                        className="text-[10px] font-medium text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800"
                    >
                        Edit
                    </button>
                </div>
             )}
          </div>
          
          <ConsoleOutput logs={currentSnapshot.consoleOutput} />
        </div>

        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 lg:gap-6 max-h-[calc(100vh-5rem)] overflow-hidden">
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md flex-shrink-0">
                <div className="flex items-center gap-3">
                     <div className="bg-slate-800 p-2 rounded-lg flex-shrink-0">
                        <Zap className="w-5 h-5 text-yellow-500" />
                     </div>
                     <div>
                        <h2 className="text-sm font-bold text-slate-200">System Status</h2>
                        <p className="text-xs text-slate-500 line-clamp-1">{currentSnapshot.description}</p>
                     </div>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 border flex-shrink-0 ${
                    currentSnapshot.description === 'Idle' 
                    ? 'bg-slate-800 border-slate-700 text-slate-400' 
                    : 'bg-blue-900/30 border-blue-500/30 text-blue-300'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${currentSnapshot.description === 'Idle' ? 'bg-slate-500' : 'bg-blue-400 animate-pulse'}`}></div>
                    {currentSnapshot.description === 'Idle' ? 'IDLE' : 'RUNNING'}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 min-h-0 flex-shrink-0" style={{ height: 'clamp(200px, 35%, 400px)' }}>
                <CallStack stack={currentSnapshot.callStack} />
                <WebApis tasks={currentSnapshot.webApis} />
            </div>

            <div className="min-h-0 flex-shrink-0" style={{ height: 'clamp(60px, 8%, 100px)' }}>
                 <EventLoopIndicator status={currentSnapshot.eventLoopStatus} />
            </div>

            <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0">
                    <MicrotaskQueue tasks={currentSnapshot.microTaskQueue} />
                </div>
                <div className="flex-1 min-h-0">
                    <MacrotaskQueue tasks={currentSnapshot.macroTaskQueue} />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
