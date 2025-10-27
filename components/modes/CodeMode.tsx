import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import { useCodeSuggestions } from '../../hooks/useCodeSuggestions';

interface CodeModeProps {
  onSendForAnalysis: (prompt: string, code: string) => void;
}

const CodeMode: React.FC<CodeModeProps> = ({ onSendForAnalysis }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const { 
    suggestion, 
    isLoading, 
    triggerSuggestion, 
    acceptSuggestion, 
    rejectSuggestion,
    clearSuggestion
  } = useCodeSuggestions();

  useEffect(() => {
    if (code) {
      triggerSuggestion(code, language);
    } else {
      clearSuggestion();
    }
  }, [code, language, triggerSuggestion, clearSuggestion]);

  const handleAccept = () => {
    const accepted = acceptSuggestion();
    if (accepted) {
      setCode(prev => prev + accepted);
    }
  };
  
  const handleReject = () => {
    rejectSuggestion();
  }

  const handleAnalysis = (type: 'explain' | 'optimize') => {
    const prompt = type === 'explain' 
      ? "Please explain the following code snippet:" 
      : "Please optimize the following code snippet:";
    onSendForAnalysis(prompt, code);
  };

  const buttonClass = `px-4 py-2 rounded-md font-title text-sm transition-all duration-300 transform 
                     hover:scale-105 hover:shadow-[0_0_15px_var(--glow-color-1)] disabled:opacity-50 
                     disabled:cursor-not-allowed disabled:transform-none`;

  return (
    <div className="flex flex-col h-full p-2 sm:p-4 gap-4">
      <div className="flex-shrink-0 flex justify-between items-center gap-4 bg-black/30 p-2 rounded-lg border border-[var(--border-color)]">
         <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-sm font-semibold text-gray-300">Language:</label>
            <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent border border-[var(--border-color)] rounded-md p-1 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-purple)]"
            >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
            {suggestion && !isLoading && (
                 <div className="flex items-center gap-1 animate-fade-in">
                    <button onClick={handleAccept} title="Accept (Tab)" className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        Accept
                    </button>
                    <button onClick={handleReject} title="Reject (Esc)" className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        Reject
                    </button>
                </div>
            )}
             {isLoading && <div className="text-sm text-gray-400 italic">Thinking...</div>}
        </div>
      </div>
      <div className="flex-grow relative min-h-0">
         <CodeEditor 
            code={code} 
            setCode={setCode} 
            language={language}
            suggestion={suggestion}
            onAcceptSuggestion={handleAccept}
            onRejectSuggestion={handleReject}
        />
      </div>
      <div className="flex-shrink-0 flex items-center justify-end gap-4">
        <button onClick={() => handleAnalysis('explain')} disabled={!code || isLoading} className={`${buttonClass} bg-transparent border border-[var(--accent-purple)] text-[var(--accent-purple)] hover:bg-[var(--accent-purple)] hover:text-white`}>
          Explain Code
        </button>
        <button onClick={() => handleAnalysis('optimize')} disabled={!code || isLoading} className={`${buttonClass} bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white`}>
          Optimize Code
        </button>
      </div>
    </div>
  );
};

export default CodeMode;