import React, { forwardRef, useState } from 'react';
import type { ChatMessage, ImageContent, LyricsContent, MultimodalUserContent, UserFileContent, VideoContent } from '../types';
import ImageSlider from './ImageSlider';
import LyricsDisplay from './LyricsDisplay';
import CodeBlock from './CodeBlock';
import MessageAvatar from './MessageAvatar';
import MemoryConfirmationPrompt from './MemoryConfirmationPrompt';
import MarkdownRenderer from './MarkdownRenderer';
import VideoDisplay from './VideoDisplay';

interface ChatWindowProps {
  messages: ChatMessage[];
  onImageClick: (url: string) => void;
  memoryConfirmation: { fact: string; messageId: string } | null;
  onConfirmMemory: () => void;
  onRejectMemory: () => void;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 w-8 h-8 rounded-full bg-black/30 text-gray-400 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--accent-purple)] hover:text-white"
      title={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      {isCopied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

const getCopyableText = (msg: ChatMessage): string | null => {
  switch (msg.type) {
    case 'text': case 'live-user': case 'live-ai':
      return msg.content as string;
    case 'lyrics':
      const lyrics = msg.content as LyricsContent;
      return `"${lyrics.title}" by ${lyrics.artist}\n\n${lyrics.lyrics}`;
    default:
      return null;
  }
};

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ messages, onImageClick, memoryConfirmation, onConfirmMemory, onRejectMemory }, ref) => {
  return (
    <div ref={ref} id="chat-window" className="space-y-6">
      {messages.map((msg, index) => (
        <React.Fragment key={msg.id}>
          <MessageBubble 
            message={msg} 
            onImageClick={onImageClick} 
            isLastMessage={index === messages.length - 1}
          />
          {memoryConfirmation && memoryConfirmation.messageId === msg.id && (
            <MemoryConfirmationPrompt
              fact={memoryConfirmation.fact}
              onConfirm={onConfirmMemory}
              onReject={onRejectMemory}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

const SearchSources: React.FC<{ sources: { uri: string; title: string }[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-black/30 text-purple-300 text-xs px-2 py-1 rounded-md transition-colors hover:bg-[var(--accent-purple)] hover:text-white"
            title={source.title}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.527 1.907 6.011 6.011 0 01-1.631 3.033 1 1 0 101.414 1.414c1.125-1.125.989-2.772.586-3.967A3.501 3.501 0 0013 5.5a3.5 3.5 0 00-1.343-2.734 6.014 6.014 0 01-4.288 0A3.5 3.5 0 006 5.5a3.5 3.5 0 00-1.343 2.734 6.011 6.011 0 01-1.631 3.033 1 1 0 101.414 1.414c1.125-1.125.989-2.772.586-3.967A3.501 3.501 0 006 9.5a3.5 3.5 0 00-1.343-2.734 6.014 6.014 0 01-1.125-1.45z" clipRule="evenodd" />
            </svg>
            <span className="truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage; onImageClick: (url: string) => void; isLastMessage: boolean; }> = ({ message, onImageClick, isLastMessage }) => {
  const isUser = message.sender === 'user';
  const textToCopy = getCopyableText(message);
  
  const bubbleStyles = isUser
    ? 'bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-magenta)] text-white rounded-3xl rounded-br-md shadow-lg shadow-[rgba(147,51,234,0.2)]'
    : 'bg-[rgba(147,51,234,0.1)] backdrop-blur-md border border-[var(--border-color)] text-gray-200 rounded-3xl rounded-bl-md shadow-lg shadow-black/30';

  if (message.type === 'system' || message.type === 'broadcast') {
    return (
      <div className="self-center text-center w-full my-2 animate-fade-in">
        <div className="inline-block max-w-[90%] font-code border border-dashed border-[var(--border-color)] text-gray-300 p-2 sm:p-3 rounded-lg text-xs sm:text-sm bg-black/20">
          {message.type === 'broadcast' && <span className="font-bold opacity-80 text-purple-300">BROADCAST :: </span>}
          {message.content as string}
        </div>
      </div>
    );
  }
  
  const renderTextContent = (content: string, isLive: boolean) => {
    if (isLive) {
      return (
        <div className="flex items-center gap-2">
            <span className="text-red-500 text-xs font-bold bg-red-500/20 px-1.5 py-0.5 rounded-md">LIVE</span>
            <p className="whitespace-pre-wrap break-words italic text-gray-300">
                {content}
                {isLastMessage && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1"></span>}
            </p>
        </div>
      )
    }

    if (!content.trim()) return null;

    const codeBlockRegex = /```(\w*)\n([\s\S]+?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || 'text', content: match[2].trim() });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return (
      <div className="flex flex-col gap-2">
        {parts.map((part, index) => {
          if (part.type === 'text' && part.content.trim()) {
            return <MarkdownRenderer key={index} content={part.content} />;
          }
          if (part.type === 'code') {
            return <CodeBlock key={index} language={part.language} code={part.content} />;
          }
          return null;
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case 'text': return renderTextContent(message.content as string, false);
      case 'live-user': case 'live-ai': return renderTextContent(message.content as string, true);
      case 'image': return <ImageSlider images={(message.content as { images: ImageContent[] }).images} onImageClick={onImageClick} />;
      case 'lyrics': return <LyricsDisplay data={message.content as LyricsContent} />;
      case 'video': return <VideoDisplay data={message.content as VideoContent} />;
      case 'multimodal-user':
        const content = message.content as MultimodalUserContent;
        return (
          <div className="flex flex-col gap-2">
            <img src={content.imageUrl} alt="User upload" className="max-w-xs rounded-lg object-cover" />
            {content.text && <p className="px-2 pt-1 whitespace-pre-wrap break-words">{content.text}</p>}
          </div>
        );
      case 'file-user':
        const fileContent = message.content as UserFileContent;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                <span className="font-semibold truncate">{fileContent.file.name}</span>
            </div>
            {fileContent.text && <p className="px-1 pt-1 whitespace-pre-wrap break-words">{fileContent.text}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`group flex items-end gap-2 sm:gap-3 ${isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}>
      {!isUser && <MessageAvatar />}
      <div className={`${(message.type === 'multimodal-user' || message.type === 'file-user') ? 'p-2 sm:p-3' : 'px-4 py-2.5 sm:px-5 sm:py-3'} max-w-[90%] sm:max-w-[85%] w-fit transition-all duration-300 ${bubbleStyles}`}>
        {renderContent()}
        {message.groundingMetadata && message.groundingMetadata.length > 0 && (
          <SearchSources sources={message.groundingMetadata} />
        )}
      </div>
      {!isUser && textToCopy && message.type !== 'live-ai' && (
        <div className="self-center flex-shrink-0">
            <CopyButton textToCopy={textToCopy} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;