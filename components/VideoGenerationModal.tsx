import React from 'react';

interface VideoGenerationModalProps {
  isVisible: boolean;
  status: string;
}

const loadingMessages = [
    "This can take a few minutes...",
    "Warming up the video synthesis engine...",
    "Compositing frames...",
    "Applying post-processing effects...",
    "Finalizing the video render...",
    "Almost there, polishing the details...",
];

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isVisible, status }) => {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="flex flex-col items-center justify-center gap-6 text-center text-white">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-lg border-2 border-[var(--accent-purple)] opacity-50 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-2 rounded-lg border-2 border-dashed border-[var(--accent-cyan)] opacity-60 animate-[spin_15s_linear_infinite_reverse]"></div>
          <svg className="w-12 h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent-cyan)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.55a1 1 0 01.55.89v6.22a1 1 0 01-.55.89L15 21l-4.55-2.11a1 1 0 01-.55-.89V11.89a1 1 0 01.55-.89L15 10zM4.55 10L9 12.11v6.22L4.55 21A1 1 0 014 20.11V10.89a1 1 0 01.55-.89zM9 4l4.55 2.11L18 4l-4.55-2.11L9 4z" />
          </svg>
        </div>
        <div className="max-w-sm">
            <h3 className="text-xl font-title text-purple-300 mb-2">{status}</h3>
            <p className="text-gray-400">{loadingMessages[messageIndex]}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationModal;