import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ChatWindow from './ChatWindow';
import type { User, ChatMessage, VoiceSettings } from '../types';
import MessageAvatar from './MessageAvatar';
import { useSpeech } from '../hooks/useSpeech';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { useChat } from '../hooks/useChat';

interface ChatInterfaceProps {
  currentUser: User;
  onLogout: () => void;
  onAdminOpen: () => void;
  onProfileOpen: () => void;
  onHistoryOpen: () => void;
  onSettingsOpen: () => void;
  onImageClick: (url: string) => void;
  initiateCall: (targetUsername: string) => void;
  isDuringCall: boolean;
  chatHook: ReturnType<typeof useChat>;
  voiceSettings: VoiceSettings;
  onToggleTts: () => void;
}

// Helper to strip markdown for clean text-to-speech output.
const removeMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^-{3,}\s*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentUser, onLogout, onAdminOpen, onProfileOpen, onHistoryOpen, onSettingsOpen, onImageClick, initiateCall, isDuringCall,
  chatHook, voiceSettings, onToggleTts
}) => {
  const { 
    messages, isLoading, isStreaming, loadingTask, processUserMessage, addMessage, updateMessage, 
    startNewChat, memoryConfirmation, confirmMemory, rejectMemory, isThinkingMode, toggleThinkingMode 
  } = chatHook;
  
  const mainRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isCommandMode, setIsCommandMode] = useState(false);

  const { isLive, isConnecting, isSpeaking, startLiveSession, stopLiveSession } = useLiveConversation(addMessage, updateMessage);

  const handleCommand = (command: string, arg?: string) => {
    if (command === 'send') {
      handleSendMessage();
    } else if (command === 'new_chat') {
      startNewChat();
      setInputValue('');
    } else if (command === 'call' && arg) {
      initiateCall(arg);
    } else if (command === 'show_history') {
      onHistoryOpen();
    }
  };
  
  const { isListening, isSpeaking: isTtsSpeaking, micError, toggleMic, speakText } = useSpeech(
    voiceSettings,
    setInputValue,
    handleCommand,
    setIsCommandMode
  );

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStreaming]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'jiam' && lastMessage.type === 'text' && typeof lastMessage.content === 'string' && !isStreaming) {
      const textToSpeak = removeMarkdown(lastMessage.content);
      if (textToSpeak) {
          speakText(textToSpeak);
      }
    }
  }, [messages, isStreaming, speakText]);
  
  const handleSendMessage = () => {
    processUserMessage(inputValue, { imageFile: stagedImage, analysisFile: stagedFile });
    setInputValue('');
    setStagedImage(null);
    setStagedFile(null);
  };
  
  const handleStageImage = (file: File | null) => {
    if (file) setStagedFile(null);
    setStagedImage(file);
  }

  const handleStageFile = (file: File | null) => {
    if (file) setStagedImage(null);
    setStagedFile(file);
  }

  const handleToggleLive = () => {
      if (isLive) stopLiveSession();
      else startLiveSession();
  };

  return (
    <div 
      className="w-full max-w-4xl h-[95vh] sm:h-[95vh] bg-[rgba(10,15,31,0.6)] backdrop-blur-2xl
                 rounded-none sm:rounded-2xl border flex flex-col overflow-hidden chat-container-glow"
    >
      <Header 
        currentUser={currentUser} 
        onLogout={onLogout} 
        onAdminOpen={onAdminOpen}
        onProfileOpen={onProfileOpen}
        isLoading={isLoading || isStreaming || isConnecting}
      />
      <main ref={mainRef} className="flex-grow flex flex-col overflow-y-auto p-2 sm:p-4 min-h-0 scroll-smooth">
        <ChatWindow 
          messages={messages} 
          onImageClick={onImageClick}
          memoryConfirmation={memoryConfirmation}
          onConfirmMemory={confirmMemory}
          onRejectMemory={rejectMemory}
        />
        {isLoading && <TypingIndicator task={loadingTask} />}
      </main>
      <Footer 
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isLoading={isLoading || isStreaming}
        startNewChat={startNewChat}
        onHistoryOpen={onHistoryOpen}
        onSettingsOpen={onSettingsOpen}
        isDuringCall={isDuringCall}
        isMemoryConfirmationPending={!!memoryConfirmation}
        isListening={isListening}
        isTtsSpeaking={isTtsSpeaking}
        voiceSettings={voiceSettings}
        micError={micError}
        toggleMic={toggleMic}
        toggleTts={onToggleTts}
        isCommandMode={isCommandMode}
        stagedImage={stagedImage}
        onStageImage={handleStageImage}
        stagedFile={stagedFile}
        onStageFile={handleStageFile}
        isLive={isLive}
        isConnectingLive={isConnecting}
        isSpeaking={isSpeaking}
        onToggleLive={handleToggleLive}
        isThinkingMode={isThinkingMode}
        onToggleThinkingMode={toggleThinkingMode}
      />
    </div>
  );
};

const TypingIndicator: React.FC<{ task: 'text' | 'image' | 'lyrics' | 'search' | 'thinking' | null }> = ({ task }) => {
    const getTaskContent = () => {
        switch (task) {
            case 'search':
                return ( <p className="text-sm text-purple-300">Searching the web...</p> );
            case 'image':
                 return ( <p className="text-sm text-purple-300">Generating image with Imagen 4...</p> );
            case 'thinking':
                 return ( <p className="text-sm text-purple-300">Engaging Thinking Mode...</p> );
            case 'lyrics':
                 return ( <p className="text-sm text-purple-300">Searching for lyrics...</p> );
            case 'text':
            default:
                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-[pulse_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-[pulse_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-[pulse_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                );
        }
    };

    return (
        <div className="flex items-end gap-2 sm:gap-3 justify-start animate-slide-in-left mt-6 flex-shrink-0">
            <MessageAvatar />
            <div className="w-fit px-5 py-4 bg-[rgba(147,51,234,0.1)] backdrop-blur-md border border-[var(--border-color)] rounded-3xl rounded-bl-md shadow-lg shadow-black/30">
                {getTaskContent()}
            </div>
        </div>
    );
};


export default ChatInterface;