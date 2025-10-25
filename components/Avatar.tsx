
import React from 'react';

interface AvatarProps {
  avatarId?: string;
  className?: string;
}

const avatarDesigns: { [key: string]: React.ReactNode } = {
  'avatar-1': (
    <g>
      <circle cx="12" cy="12" r="10" fill="#00d9ff" />
      <path d="M12 7V17M7 12H17" stroke="black" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  'avatar-2': (
     <g>
      <rect x="2" y="2" width="20" height="20" rx="10" fill="#FF5733" />
      <polygon points="12,6 18,18 6,18" fill="white" />
    </g>
  ),
  'avatar-3': (
     <g>
      <circle cx="12" cy="12" r="10" fill="#33FF57" />
      <path d="M7 7L17 17M7 17L17 7" stroke="black" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  'avatar-4': (
    <g>
      <rect x="2" y="2" width="20" height="20" rx="10" fill="#FFC300" />
      <circle cx="12" cy="12" r="5" fill="black" />
    </g>
  ),
  default: (
    <g>
      <circle cx="12" cy="12" r="10" fill="#4A5568" />
      <circle cx="12" cy="12" r="4" fill="#E2E8F0" />
    </g>
  )
};

export const availableAvatars = Object.keys(avatarDesigns).filter(k => k !== 'default');

const Avatar: React.FC<AvatarProps> = ({ avatarId = 'default', className = '' }) => {
    if (avatarId && avatarId.startsWith('data:image/')) {
        return (
            <img 
                src={avatarId} 
                alt="User avatar" 
                className={`${className} object-cover`}
            />
        );
    }
    
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            {avatarDesigns[avatarId] || avatarDesigns.default}
        </svg>
    );
};

export default Avatar;