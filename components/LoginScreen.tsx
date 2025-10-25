import React, { useState } from 'react';
import Logo from '../assets/Logo';
import { useToasts } from '../context/ToastContext';

const Spinner: React.FC = () => (
    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// FIX: Define the missing `LoginScreenProps` interface to resolve TypeScript error.
interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  onSignup: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  onGuestLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSignup, onGuestLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { addToast } = useToasts();

  const handleAuth = async (authFn: (user: string, pass: string) => Promise<{success: boolean, message: string}>) => {
    if (!username || !password) {
        addToast('Username and password are required.', 'error');
        return;
    }
    setIsLoading(true);

    const result = await authFn(username, password);
    
    addToast(result.message, result.success ? 'success' : 'error');

    if (!result.success) {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 transition-opacity duration-500">
      <div className="w-full max-w-md h-full sm:h-auto bg-[rgba(10,15,31,0.6)] sm:backdrop-blur-xl p-8 sm:rounded-xl border-none sm:border sm:border-[rgba(147,51,234,0.25)] animate-scale-in flex flex-col justify-center shadow-2xl shadow-[rgba(147,51,234,0.1)]">
        <div className="flex justify-center mb-8">
          <Logo className="h-12 text-white" />
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="w-full bg-[rgba(0,0,0,0.5)] border border-[rgba(147,51,234,0.3)] rounded-md text-white p-3 text-base outline-none transition-all duration-300 focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_var(--glow-color-1)]"
          />
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full bg-[rgba(0,0,0,0.5)] border border-[rgba(147,51,234,0.3)] rounded-md text-white p-3 text-base outline-none transition-all duration-300 focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_var(--glow-color-1)]"
            />
            <button
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPasswordVisible ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-3.29-3.29m0 0l-3.29 3.29"} />
              </svg>
            </button>
          </div>
          <div className="space-y-3 pt-2">
            <button onClick={() => handleAuth(onLogin)} disabled={isLoading} className="w-full p-3 font-title bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white rounded-md text-lg transition-all duration-300 hover:shadow-[0_0_20px_var(--glow-color-1)] hover:brightness-110 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center h-[52px]">
              {isLoading ? <Spinner /> : 'Login'}
            </button>
            <button onClick={() => handleAuth(onSignup)} disabled={isLoading} className="w-full p-3 font-title bg-transparent border border-[var(--accent-purple)] text-[var(--accent-purple)] rounded-md text-lg transition-all duration-300 hover:bg-[var(--accent-purple)] hover:text-white disabled:opacity-50 disabled:cursor-wait flex items-center justify-center h-[52px]">
              {isLoading ? <Spinner /> : 'Sign Up'}
            </button>
          </div>
          <div className="text-center mt-4">
            <a href="#" onClick={(e) => { e.preventDefault(); onGuestLogin(); }} className="text-[var(--accent-cyan)] hover:underline">
              or Continue as Guest
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;