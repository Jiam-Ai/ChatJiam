import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import Avatar, { availableAvatars } from './Avatar';
import ImageCropper from './ImageCropper';

interface ProfileModalProps {
  currentUser: User;
  isVisible: boolean;
  onClose: () => void;
  onSave: (profileData: { displayName?: string; avatar?: string }) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ currentUser, isVisible, onClose, onSave }) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setDisplayName(currentUser.displayName || currentUser.username);
      setSelectedAvatar(currentUser.avatar || 'default');
    }
  }, [isVisible, currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size should not exceed 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCroppingImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setSelectedAvatar(croppedImageUrl);
    setCroppingImage(null);
  };

  const handleSave = () => {
    onSave({
      displayName: displayName.trim(),
      avatar: selectedAvatar,
    });
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-[rgba(2,0,16,0.9)] backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="relative w-full max-w-md bg-[rgba(10,15,31,0.6)] border border-[var(--border-color)] rounded-lg p-6 flex flex-col gap-6 font-body text-white animate-scale-in">
          <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xl font-bold z-10 hover:bg-white/20">&times;</button>
          
          <h2 className="font-title text-xl text-[var(--accent-purple)] text-center border-b border-[var(--border-color)] pb-3">Edit Profile</h2>
          
          <div className="flex flex-col items-center gap-4">
            <Avatar avatarId={selectedAvatar} className="w-24 h-24 rounded-full border-2 border-[var(--accent-purple)]" />
            <div className="w-full">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[rgba(0,0,0,0.5)] border border-[var(--border-color)] rounded-md text-white p-3 text-base outline-none transition-colors focus:ring-2 focus:ring-[var(--accent-purple)]"
                maxLength={20}
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Choose Avatar</h3>
            <div className="grid grid-cols-4 gap-4">
              {availableAvatars.map(avatarKey => (
                <button key={avatarKey} onClick={() => setSelectedAvatar(avatarKey)} className={`w-16 h-16 rounded-full transition-all duration-200 ${selectedAvatar === avatarKey ? 'ring-4 ring-offset-2 ring-offset-[#0a0f1f] ring-[var(--accent-purple)]' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}>
                  <Avatar avatarId={avatarKey} className="w-full h-full rounded-full" />
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full bg-black/50 border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400 hover:border-[var(--accent-purple)] hover:text-[var(--accent-purple)] transition-colors"
                title="Upload custom image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/gif"
                className="hidden"
              />
            </div>
          </div>
          
          <button onClick={handleSave} className="w-full mt-2 p-3 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white rounded-md font-title transition hover:brightness-110 transform hover:scale-105">
            Save Changes
          </button>
        </div>
      </div>
      {croppingImage && (
        <ImageCropper 
            imageSrc={croppingImage}
            onCropComplete={handleCropComplete}
            onClose={() => setCroppingImage(null)}
        />
      )}
    </>
  );
};

export default ProfileModal;