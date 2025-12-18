import React, { useRef, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  disabled: boolean;
  highlightLine: number | null;
}

const simpleHighlight = (code: string) => {
  if (!code) return '';
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="text-amber-300">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-slate-500 italic">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|await|async|new|try|catch)\b/g, '<span class="text-purple-400 font-bold">$1</span>')
    .replace(/\b(console|setTimeout|setInterval|clearTimeout|clearInterval|Promise|queueMicrotask)\b/g, '<span class="text-cyan-300">$1</span>')
    .replace(/\b(log|then|resolve|reject)\b/g, '<span class="text-blue-300">$1</span>')
    .replace(/(\(|\)|{|}|\[|\])/g, '<span class="text-slate-400">$1</span>');
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, disabled, highlightLine }) => {
  const lines = code.split('\n');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  
  const LINE_HEIGHT = 24;
  const PADDING_TOP = 16;

  useEffect(() => {
    if (highlightLine && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const lineTop = PADDING_TOP + (highlightLine - 1) * LINE_HEIGHT;
        const lineBottom = lineTop + LINE_HEIGHT;
        
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (lineTop < containerTop || lineBottom > containerBottom) {
            container.scrollTo({
                top: lineTop - container.clientHeight / 2 + LINE_HEIGHT / 2,
                behavior: 'smooth'
            });
        }
    }
  }, [highlightLine]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current && scrollContainerRef.current) {
      gutterRef.current.style.transform = `translateY(-${scrollContainerRef.current.scrollTop}px)`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden group ring-1 ring-slate-800/50 hover:ring-slate-700/50 transition-all">
      <div className="bg-[#0f172a] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none z-20 relative flex-shrink-0">
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5 opacity-75">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <h2 className="ml-3 text-xs font-semibold text-slate-400 font-mono">script.js</h2>
        </div>
        <div className="flex items-center gap-3">
             <span className="text-[10px] text-slate-500 font-mono">JS</span>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden bg-[#0f172a] min-h-0">
        <div className="absolute inset-0 flex">
            
            <div className="w-14 bg-[#0f172a] border-r border-slate-800 flex-shrink-0 relative overflow-hidden">
                <div 
                    ref={gutterRef}
                    className="absolute top-0 left-0 right-0 pt-4 pr-3 flex flex-col items-end select-none will-change-transform"
                >
                    {lines.map((_, i) => (
                        <div 
                            key={i} 
                            style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
                            className={`text-xs font-mono transition-colors duration-150 ${highlightLine === i + 1 ? 'text-blue-400 font-bold' : 'text-slate-600'}`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#475569 transparent'
                }}
            >
                <div className="relative min-h-full">
                    {highlightLine && (
                        <div 
                            className="absolute left-0 right-0 bg-blue-500/10 border-l-[3px] border-blue-500 pointer-events-none transition-all duration-150 z-0"
                            style={{ 
                                top: `${PADDING_TOP + (highlightLine - 1) * LINE_HEIGHT}px`,
                                height: `${LINE_HEIGHT}px`
                            }} 
                        />
                    )}

                    <pre
                        className="relative p-4 m-0 font-mono text-sm whitespace-pre text-slate-300 pointer-events-none z-10"
                        style={{ lineHeight: `${LINE_HEIGHT}px` }}
                        dangerouslySetInnerHTML={{ __html: simpleHighlight(code) + '<br/>' }} 
                    />

                    <textarea
                        className="absolute inset-0 p-4 m-0 font-mono text-sm bg-transparent text-transparent caret-white resize-none focus:outline-none selection:bg-blue-500/30 whitespace-pre disabled:cursor-not-allowed z-20"
                        style={{ lineHeight: `${LINE_HEIGHT}px` }}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        disabled={disabled}
                        placeholder="// Write your code here..."
                    />
                </div>
            </div>
        </div>
      </div>
      
      <div className="bg-[#0f172a] border-t border-slate-700 px-4 py-1.5 text-[10px] text-slate-500 flex justify-between font-mono z-20 relative flex-shrink-0">
         <span className={`transition-colors ${disabled ? 'text-amber-500' : 'text-emerald-500'}`}>
            {disabled ? '● RUNNING' : '● READY'}
         </span>
         <span>UTF-8</span>
      </div>
    </div>
  );
};

export default CodeEditor;
