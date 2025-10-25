import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Initializing Jiam.io...",
    "Warming up neural networks...",
    "Establishing secure connection...",
    "Calibrating logic circuits...",
    "Loading user profile..."
];

const LoadingSpinner: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-8 text-center">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-purple)] opacity-50 animate-[spin_8s_linear_infinite]"></div>
                <div className="absolute inset-[10%] rounded-full border-2 border-dashed border-[var(--accent-cyan)] opacity-60 animate-[spin_10s_linear_infinite_reverse]"></div>
                <div className="absolute inset-[20%] rounded-full border-2 border-[var(--accent-purple)] opacity-70 animate-[spin_6s_linear_infinite]"></div>
                <div className="absolute inset-[30%] rounded-full border-2 border-transparent border-t-[var(--accent-cyan)] animate-[spin_2s_ease-in-out_infinite]"></div>
                <div className="absolute inset-[40%] rounded-full bg-[var(--accent-purple)] opacity-50 blur-lg"></div>
            </div>
            <p className="text-lg text-purple-300 font-light tracking-wider animate-fade-in w-64">
                {loadingMessages[messageIndex]}
            </p>
        </div>
    );
};

export default LoadingSpinner;