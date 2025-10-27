import React, { useRef, useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  suggestion: string | null;
  onAcceptSuggestion: () => void;
  onRejectSuggestion: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
    code, 
    setCode, 
    language, 
    suggestion,
    onAcceptSuggestion,
    onRejectSuggestion
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Sync scroll positions
    const editor = editorRef.current;
    const highlighter = highlighterRef.current;
    if (editor && highlighter) {
      const handleScroll = () => {
        highlighter.scrollTop = editor.scrollTop;
        highlighter.scrollLeft = editor.scrollLeft;
      };
      editor.addEventListener('scroll', handleScroll);
      return () => editor.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      onAcceptSuggestion();
    }
     if (e.key === 'Escape' && suggestion) {
      e.preventDefault();
      onRejectSuggestion();
    }
  };
  
  const fullCode = code + (suggestion || '');

  return (
    <div className={`relative w-full h-full font-code text-sm rounded-lg border transition-all duration-300
                    ${isFocused ? 'border-[var(--accent-purple)] shadow-[0_0_20px_var(--glow-color-1)]' : 'border-[var(--border-color)]'}`}>
      
      {/* Syntax Highlighting Layer (Bottom) */}
      <div 
        ref={highlighterRef} 
        className="absolute inset-0 w-full h-full overflow-hidden rounded-lg bg-black/50"
        aria-hidden="true"
      >
        <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
                margin: 0,
                padding: '1rem',
                backgroundColor: 'transparent',
                fontSize: '0.875rem',
                lineHeight: '1.5rem',
                height: '100%',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
            }}
            codeTagProps={{
                style: { fontFamily: "inherit", display: 'block' }
            }}
        >
            {fullCode}
        </SyntaxHighlighter>
        {/* Render suggestion with a different color */}
        {suggestion && (
            <div className="absolute inset-0 w-full h-full overflow-hidden -z-10" style={{pointerEvents: 'none'}}>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        backgroundColor: 'transparent',
                        fontSize: '0.875rem',
                        lineHeight: '1.5rem',
                        height: '100%',
                        boxSizing: 'border-box',
                        color: '#6b7280', // Gray color for suggestion
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                    }}
                    codeTagProps={{ style: { fontFamily: "inherit", display: 'block' } }}
                >
                    {/* Invisible user code + visible suggestion */}
                    {code.replace(/[^\s]/g, ' ') + suggestion}
                </SyntaxHighlighter>
            </div>
        )}
      </div>

      {/* Textarea Input Layer (Top) */}
      <textarea
        ref={editorRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent 
                   caret-white resize-none outline-none border-none
                   font-code text-sm leading-6 whitespace-pre-wrap"
      />
    </div>
  );
};

export default CodeEditor;