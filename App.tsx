import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import CallInterface from './components/CallInterface';
import ImageModal from './components/ImageModal';
import ProfileModal from './components/ProfileModal';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import LoadingSpinner from './components/LoadingSpinner';
import ToastsContainer from './components/ToastsContainer';
import { useAuth } from './hooks/useAuth';
import { useWebRTC } from './hooks/useWebRTC';
import { useChat } from './hooks/useChat';
import type { User, VoiceSettings } from './types';
import { useToasts } from './context/ToastContext';

const App: React.FC = () => {
  const { currentUser, loading, login, signup, logout, continueAsGuest, updateUserProfile } = useAuth();
  const [isAdminPanelVisible, setAdminPanelVisible] = useState(false);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const { addToast } = useToasts();


  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('jiamVoiceSettings');
      const defaultSettings = { isWakeWordEnabled: true, wakeWordSensitivity: 50, isTtsEnabled: false, aiVoice: 'Kore' };
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
    } catch {
      return { isWakeWordEnabled: true, wakeWordSensitivity: 50, isTtsEnabled: false, aiVoice: 'Kore' };
    }
  });

  const handleSaveSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('jiamVoiceSettings', JSON.stringify(newSettings));
  };

  const handleToggleTts = () => {
    setVoiceSettings(prevSettings => {
        const newSettings = { ...prevSettings, isTtsEnabled: !prevSettings.isTtsEnabled };
        localStorage.setItem('jiamVoiceSettings', JSON.stringify(newSettings));
        return newSettings;
    });
  };
  
  const { 
    callState,
    callerUsername,
    initiateCall, 
    answerCall, 
    endCall,
    isDuringCall
  } = useWebRTC(currentUser);

  const chatHook = useChat(currentUser);

  useEffect(() => {
    const appContainer = document.getElementById('app-container-wrapper');
    if (appContainer) {
      if (!loading && currentUser) {
        appContainer.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        appContainer.classList.add('opacity-100', 'scale-100', 'pointer-events-all');
      } else if (!loading && !currentUser) {
        appContainer.classList.remove('opacity-100', 'scale-100', 'pointer-events-all');
        appContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      }
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent overflow-hidden">
        {!currentUser ? (
            <LoginScreen 
              onLogin={login} 
              onSignup={signup} 
              onGuestLogin={continueAsGuest} 
            />
        ) : (
          <>
            <div id="app-container-wrapper" className="w-full h-full flex items-center justify-center opacity-0 scale-95 pointer-events-none transition-all duration-500 ease-out">
              <ChatInterface
                currentUser={currentUser}
                onLogout={logout}
                onAdminOpen={() => setAdminPanelVisible(true)}
                onProfileOpen={() => setProfileModalVisible(true)}
                onHistoryOpen={() => setHistoryModalVisible(true)}
                onSettingsOpen={() => setSettingsModalVisible(true)}
                onImageClick={(url) => setModalImage(url)}
                initiateCall={initiateCall}
                isDuringCall={isDuringCall}
                chatHook={chatHook}
                voiceSettings={voiceSettings}
                onToggleTts={handleToggleTts}
              />
            </div>
            <AdminPanel
              currentUser={currentUser}
              isVisible={isAdminPanelVisible}
              onClose={() => setAdminPanelVisible(false)}
              initiateCall={initiateCall}
            />
            <ProfileModal
                currentUser={currentUser}
                isVisible={isProfileModalVisible}
                onClose={() => setProfileModalVisible(false)}
                onSave={updateUserProfile}
            />
            <HistoryModal
              isVisible={isHistoryModalVisible}
              onClose={() => setHistoryModalVisible(false)}
              messages={chatHook.messages}
              deleteMessage={chatHook.deleteMessage}
              togglePinMessage={chatHook.togglePinMessage}
              toggleArchiveMessage={chatHook.toggleArchiveMessage}
            />
            <SettingsModal
              isVisible={isSettingsModalVisible}
              onClose={() => setSettingsModalVisible(false)}
              currentSettings={voiceSettings}
              onSave={handleSaveSettings}
            />
          </>
        )}
        <CallInterface 
            callState={callState}
            callerUsername={callerUsername}
            onAnswer={answerCall}
            onHangup={() => endCall(true)}
        />
        {modalImage && (
          <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
        )}
        <ToastsContainer />
    </div>
  );
};

export default App;