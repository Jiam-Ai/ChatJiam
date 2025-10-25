import React, { useRef, useMemo, useState } from 'react';
import type { VoiceSettings } from '../types';

interface FooterProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    isLoading: boolean;
    startNewChat: () => void;
    onHistoryOpen: () => void;
    onSettingsOpen: () => void;
    isDuringCall: boolean;
    isMemoryConfirmationPending: boolean;
    isListening: boolean;
    isTtsSpeaking: boolean;
    voiceSettings: VoiceSettings;
    micError: string | null;
    toggleMic: () => void;
    toggleTts: () => void;
    isCommandMode: boolean;
    stagedImage: File | null;
    onStageImage: (file: File | null) => void;
    stagedFile: File | null;
    onStageFile: (file: File | null) => void;
    isLive: boolean;
    isConnectingLive: boolean;
    isSpeaking: 'user' | 'ai' | 'none';
    onToggleLive: () => void;
    isThinkingMode: boolean;
    onToggleThinkingMode: () => void;
}

const AudioVisualizer: React.FC<{ status: 'idle' | 'user' | 'ai' | 'connecting' }> = ({ status }) => {
    const getAnimation = () => {
        switch (status) {
            case 'user': return 'orb-pulse-user 1s ease-in-out infinite';
            case 'ai': return 'orb-swirl-ai 4s linear infinite';
            case 'connecting': return 'orb-breath 2s ease-in-out infinite, spin 2s linear infinite';
            default: return 'orb-breath 2s ease-in-out infinite';
        }
    };
    const getStatusText = () => {
        switch (status) {
            case 'user': return "Listening...";
            case 'ai': return "Jiam is speaking...";
            case 'connecting': return "Connecting...";
            default: return "Live Conversation Active";
        }
    }
    return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 mb-1">
                <div className="w-full h-full rounded-full border-2 border-cyan-300" style={{ animation: getAnimation() }}></div>
            </div>
            <p className="text-xs text-cyan-200">{getStatusText()}</p>
        </div>
    );
};

const Footer: React.FC<FooterProps> = (props) => {
    const { 
        inputValue, onInputChange, onSendMessage, isLoading, startNewChat, onHistoryOpen, onSettingsOpen,
        isDuringCall, isMemoryConfirmationPending, isListening, isTtsSpeaking, voiceSettings, micError, toggleMic, toggleTts, isCommandMode,
        stagedImage, onStageImage, stagedFile, onStageFile, isLive, isConnectingLive, isSpeaking, onToggleLive,
        isThinkingMode, onToggleThinkingMode
    } = props;

    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileAnalysisInputRef = useRef<HTMLInputElement>(null);
    const [isMenuOpen, setMenuOpen] = useState(false);
    
    const stagedImageUrl = useMemo(() => stagedImage ? URL.createObjectURL(stagedImage) : null, [stagedImage]);

    const handleSend = () => {
        if (inputValue.trim() || stagedImage || stagedFile) {
            onSendMessage();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onStageImage(null);
            onStageFile(null);
            onStageImage(file);
        }
        if(e.target) e.target.value = '';
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             onStageImage(null);
             onStageFile(file);
        }
        if(e.target) e.target.value = '';
    };
    
    const isDisabled = isLoading || isDuringCall || isMemoryConfirmationPending || isLive || isConnectingLive || isTtsSpeaking;
    
    const footerBtnBaseClass = `relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full 
                     shadow-lg shadow-[rgba(2,0,16,0.55)] transition-all duration-300
                     hover:transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(2,0,16,0.7),0_0_20px_0px_var(--glow-color-1),0_0_35px_-5px_var(--glow-color-2)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg`;

    const getPlaceholder = () => {
        if (isCommandMode) return "Awaiting command...";
        if (isListening) return "Listening...";
        if (stagedImage) return "Describe how to edit the image...";
        if (stagedFile) return `Ask about ${stagedFile.name}...`;
        return "Speak or type...";
    };
    
    const micTitle = micError ? `Mic Error: ${micError}` : isListening ? "Listening..." : "Click to speak";
    const getVisualizerStatus = () => {
        if(isConnectingLive) return 'connecting';
        if(isSpeaking === 'user') return 'user';
        if(isSpeaking === 'ai') return 'ai';
        return 'idle';
    };

    return (
        <footer className="p-2 sm:p-4 border-t border-[var(--border-color)] flex-shrink-0 flex flex-col gap-2">
            { (stagedImage || stagedFile) && (
                <div className="w-full flex justify-center items-center px-4 animate-fade-in mb-2">
                    {stagedImageUrl && <StagedItemPreview url={stagedImageUrl} onRemove={() => onStageImage(null)} />}
                    {stagedFile && <StagedFilePreview file={stagedFile} onRemove={() => onStageFile(null)} />}
                </div>
            )}
            <div id="input-container" className="flex items-center gap-2 sm:gap-3">
                <button onClick={() => imageInputRef.current?.click()} disabled={isDisabled} className={`${footerBtnBaseClass} bg-white/5 text-purple-300 hover:text-white border border-[var(--border-color)]`} title="Upload Image to Edit or Generate">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16l-4.5-5.5-2.5 3-3.5-4.5-4.5 6H22V4z"/></svg>
                </button>
                <button onClick={() => fileAnalysisInputRef.current?.click()} disabled={isDisabled} className={`${footerBtnBaseClass} bg-white/5 text-cyan-300 hover:text-white border border-[var(--border-color)]`} title="Upload File for Analysis">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                </button>

                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                <input type="file" ref={fileAnalysisInputRef} onChange={handleFileUpload} accept="application/pdf,text/*" className="hidden" />

                <div className={`flex-grow relative bg-[rgba(0,0,0,0.3)] border border-[var(--border-color)] rounded-full h-10 sm:h-12 transition-all duration-300 focus-within:bg-[rgba(0,0,0,0.2)] ${isCommandMode ? 'border-yellow-400 shadow-[0_0_25px_-5px_rgba(250,204,21,0.6)]' : 'focus-within:border-[var(--accent-purple)] focus-within:shadow-[0_0_25px_-5px_var(--glow-color-1)]'}`}>
                    { (isLive || isConnectingLive) ? <AudioVisualizer status={getVisualizerStatus()} /> : (
                        <input
                            type="text" value={inputValue} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKeyDown}
                            placeholder={getPlaceholder()} disabled={isDisabled}
                            className="w-full h-full bg-transparent text-white text-base outline-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed px-4 sm:px-5"
                        />
                    )}
                </div>
                
                <button onClick={onToggleLive} disabled={isDuringCall || isMemoryConfirmationPending || isLoading || isListening || isTtsSpeaking} title={isLive ? "End Live Conversation" : "Start Live Conversation"} className={`${footerBtnBaseClass} ${isLive || isConnectingLive ? 'bg-red-500 text-white' : 'bg-white/5 text-white'}`}>
                    {isConnectingLive ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>}
                </button>

                {(inputValue.trim().length === 0 && !stagedImage && !stagedFile) ? (
                    <button onClick={toggleMic} disabled={isDisabled} title={micTitle} className={`${footerBtnBaseClass} ${isListening ? 'animate-pulse bg-red-500' : 'bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-cyan)]'} text-white`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"></path></svg>
                    </button>
                ) : (
                    <button onClick={handleSend} disabled={isDisabled} title="Send Message" className={`${footerBtnBaseClass} bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                )}

                 <div className="relative">
                    <button onClick={() => setMenuOpen(!isMenuOpen)} disabled={isDisabled} className={`${footerBtnBaseClass} bg-white/5 text-gray-300 hover:text-white border border-[var(--border-color)]`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>
                    <div className={`absolute bottom-14 sm:bottom-16 right-0 w-48 bg-[rgba(10,15,31,0.9)] backdrop-blur-md border border-[var(--border-color)] rounded-lg shadow-2xl z-20 transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <button onClick={() => { onToggleThinkingMode(); setMenuOpen(false); }} className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors rounded-t-lg flex items-center justify-between ${isThinkingMode ? 'text-cyan-400' : 'text-gray-300'}`}>
                            <span>🧠 Thinking Mode</span> {isThinkingMode && 'ON'}
                        </button>
                        <button onClick={() => { onHistoryOpen(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-gray-300">📜 Chat History</button>
                        <button onClick={() => { onSettingsOpen(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-gray-300">⚙️ Settings</button>
                        <button onClick={() => { startNewChat(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors rounded-b-lg flex items-center gap-2 text-gray-300">🆕 New Chat</button>
                    </div>
                </div>
            </div>
             {micError && <p className="text-center text-red-400 text-xs mt-2">{micError}</p>}
             {isDuringCall && <p className="text-center text-yellow-400 text-xs mt-2">Messaging disabled during call.</p>}
             {isMemoryConfirmationPending && <p className="text-center text-purple-300 text-xs mt-2">Please respond to the memory confirmation above.</p>}
        </footer>
    );
};

const StagedItemPreview: React.FC<{url: string, onRemove: () => void}> = ({ url, onRemove }) => (
    <div className="inline-flex items-center gap-2 h-10 bg-purple-900/20 rounded-full p-1 animate-scale-in border border-[var(--border-color)] shadow-md">
        <img src={url} alt="Staged" className="h-full aspect-square object-cover rounded-full" />
        <span className="text-white text-sm pr-2">Image ready to send</span>
        <button onClick={onRemove} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-black/50 flex-shrink-0 mr-1 hover:bg-red-400 transition-colors">&times;</button>
    </div>
);

const StagedFilePreview: React.FC<{file: File, onRemove: () => void}> = ({ file, onRemove }) => (
    <div className="inline-flex items-center gap-2 h-10 bg-purple-900/20 rounded-full pl-3 pr-1 animate-scale-in border border-[var(--border-color)] shadow-md">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
       <span className="text-white text-sm truncate max-w-[100px] sm:max-w-[180px]">{file.name}</span>
       <button onClick={onRemove} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-black/50 flex-shrink-0 hover:bg-red-400 transition-colors">&times;</button>
    </div>
);

export default Footer;