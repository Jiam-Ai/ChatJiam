
import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';
import type { User } from '../types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserState = useCallback(async (username: string | null) => {
    if (username) {
        const roles = await firebaseService.getRoles();
        const role = firebaseService.getUserRole(username, roles);
        
        let profile: { displayName?: string, avatar?: string } = {};
        if (username !== 'Guest') {
            const storedProfile = localStorage.getItem(`jiamUserProfile_${username}`);
            if (storedProfile) {
                try {
                    profile = JSON.parse(storedProfile);
                } catch (error) {
                    console.error("Failed to parse user profile from localStorage:", error);
                    localStorage.removeItem(`jiamUserProfile_${username}`);
                }
            }
        }

        setCurrentUser({ username, role, ...profile });
    } else {
        setCurrentUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const localUser = localStorage.getItem('jiamCurrentUser');
    const sessionUser = sessionStorage.getItem('jiamCurrentUser');
    const loggedInUser = localUser || sessionUser;
    updateUserState(loggedInUser);
  }, [updateUserState]);

  const login = async (username: string, password: string):Promise<{success: boolean, message: string}> => {
    const userData = await firebaseService.getUserData(username);
    if (userData && userData.password === password) {
      localStorage.setItem('jiamCurrentUser', username);
      await updateUserState(username);
      return { success: true, message: 'Login successful!' };
    }
    return { success: false, message: 'Invalid username or password.' };
  };

  const signup = async (username: string, password: string):Promise<{success: boolean, message: string}> => {
    const userData = await firebaseService.getUserData(username);
    if (userData) {
      return { success: false, message: 'Username already exists.' };
    }
    await firebaseService.createUser(username, password);
    localStorage.setItem('jiamCurrentUser', username);
    await updateUserState(username);
    return { success: true, message: 'Account created successfully!' };
  };
  
  const continueAsGuest = async () => {
      sessionStorage.setItem('jiamCurrentUser', 'Guest');
      await updateUserState('Guest');
  };

  const logout = () => {
    localStorage.removeItem('jiamCurrentUser');
    sessionStorage.removeItem('jiamCurrentUser');
    setCurrentUser(null);
  };
  
  const updateUserProfile = (profileData: { displayName?: string; avatar?: string }) => {
    if (currentUser && currentUser.username !== 'Guest') {
        const updatedUser = { ...currentUser, ...profileData };
        setCurrentUser(updatedUser);
        localStorage.setItem(`jiamUserProfile_${currentUser.username}`, JSON.stringify({
            displayName: updatedUser.displayName,
            avatar: updatedUser.avatar,
        }));
    }
  };


  return { currentUser, loading, login, signup, logout, continueAsGuest, updateUserProfile };
};