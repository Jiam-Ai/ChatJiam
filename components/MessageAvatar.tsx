
import React from 'react';

const MessageAvatar: React.FC = () => {
  return (
    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-900 to-gray-900 flex items-center justify-center p-1 shadow-lg border-2 border-cyan-500/50">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path d="M12 2L12 6" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)"/>
        <path d="M12 18L12 22" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)"/>
        <path d="M22 12L18 12" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)"/>
        <path d="M6 12L2 12" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)"/>
        <circle cx="12" cy="12" r="3" stroke="#00d9ff" strokeWidth="1.5" filter="url(#glow)"/>
      </svg>
    </div>
  );
};

export default MessageAvatar;