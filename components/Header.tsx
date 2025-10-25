import React from 'react';
import type { User } from '../types';
import Logo from '../assets/Logo';
import Avatar from './Avatar';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    onAdminOpen: () => void;
    onProfileOpen: () => void;
    isLoading: boolean;
}

const CoreSpinner: React.FC<{isActive: boolean}> = ({isActive}) => {
    const activeClass = 'opacity-100 scale-100';
    const inactiveClass = 'opacity-60 scale-90';
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] pointer-events-none z-10">
            <div className={`transition-all duration-500 ${isActive ? activeClass : inactiveClass}`}>
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-[var(--accent-purple)] shadow-[0_0_10px_-2px_var(--glow-color-1),inset_0_0_10px_-2px_var(--glow-color-1)] animate-[spin_10s_linear_infinite]"></div>
                {/* Dashed ring */}
                <div className="absolute inset-[5%] rounded-full border border-dashed border-[var(--accent-cyan)] opacity-70 animate-[spin_12s_steps(40,end)_infinite_reverse]"></div>
                {/* Inner solid ring */}
                <div className="absolute inset-[12%] rounded-full border border-[var(--accent-purple)] opacity-80 animate-[spin_8s_linear_infinite]"></div>
                {/* Segmented inner ring */}
                <div className="absolute inset-[25%] rounded-full border-2 border-transparent border-t-[var(--accent-cyan)] border-l-[var(--accent-cyan)] animate-[spin_6s_linear_infinite_reverse]"></div>
                {/* Center Core */}
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] h-[25%] rounded-full bg-[radial-gradient(circle,white_20%,var(--accent-cyan)_70%,var(--accent-purple)_100%)] transition-all duration-300 ease-out ${isActive ? 'scale-125 shadow-[0_0_20px_white,0_0_30px_var(--glow-color-2)]' : 'scale-100 shadow-[0_0_10px_var(--glow-color-2)]'}`}></div>
            </div>
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onAdminOpen, onProfileOpen, isLoading }) => {
    const displayName = currentUser.displayName || currentUser.username;

    return (
        <header className="relative p-2 sm:p-4 text-center border-b border-[var(--border-color)] flex justify-between items-center h-[70px] sm:h-[90px] flex-shrink-0 bg-transparent">
            <CoreSpinner isActive={isLoading} />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                 <Logo className="h-6 sm:h-8 text-gray-300" />
            </div>
            <div className="z-10 w-full flex justify-between items-center sm:px-4">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 border-2 border-green-300 status-indicator"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-300">Status: <span className="text-green-400">Online</span></span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                     <button 
                        onClick={onProfileOpen} 
                        disabled={currentUser.role === 'guest'}
                        className="flex items-center gap-2 sm:gap-3 group disabled:cursor-default"
                    >
                        <span className="text-sm hidden sm:inline text-gray-300 group-hover:text-[var(--accent-cyan)] transition-colors">
                            <strong className="font-semibold">{displayName}</strong>
                        </span>
                        <Avatar avatarId={currentUser.avatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-transparent group-hover:border-[var(--accent-cyan)] transition-all" />
                    </button>
                    
                    {currentUser.role !== 'guest' && (
                        <button onClick={onLogout} className="text-xs sm:text-sm bg-black/20 border border-white/10 text-gray-300 px-2 py-1 sm:px-3 rounded-md hover:bg-white/10 hover:text-white transition-colors duration-200">
                            Logout
                        </button>
                    )}
                    {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                        <button onClick={onAdminOpen} className="text-xs sm:text-sm bg-black/20 border border-white/10 text-gray-300 px-2 py-1 sm:px-3 rounded-md hover:bg-white/10 hover:text-white transition-colors duration-200">
                            Admin
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;