import { useState, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { externalApiService } from '../services/externalApiService';
import { firebaseService } from '../services/firebaseService';
import { useToasts } from '../context/ToastContext';
import type { User, ChatMessage } from '../types';

// FIX: Define the AIStudio interface to match the expected global type for window.aistudio.
// This resolves the conflict with another declaration of the same property by moving the interface into the global scope.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const imageKeywords = ['create', 'draw', 'paint', 'generate', 'design', 'show me a picture of', 'an image of', 'render', 'illustrate', 'logo'];
const imageKeywordRegex = new RegExp(`\\b(${imageKeywords.join('|')})\\b`, 'i');
const lyricsKeywords = ['lyrics for', 'get lyrics', 'find lyrics', 'what are the lyrics to'];
const lyricsKeywordRegex = new RegExp(`\\b(${lyricsKeywords.join('|')})\\b`, 'i');
const searchKeywords = ['search for', 'look up', 'find information on', 'what is the latest on', 'google', 'search the web for'];
const searchKeywordRegex = new RegExp(`\\b(${searchKeywords.join('|')})\\b`, 'i');
const videoKeywords = ['create a video of', 'make a video of', 'generate a video of', 'animate a scene of', 'a video of'];
const videoKeywordRegex = new RegExp(`^(${videoKeywords.join('|')})`, 'i');


export const useChat = (currentUser: User | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingTask, setLoadingTask] = useState<'text' | 'image' | 'lyrics' | 'search' | 'thinking' | 'video' | null>(null);
    const [memoryConfirmation, setMemoryConfirmation] = useState<{ fact: string; messageId: string } | null>(null);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const [isApiKeySelectionRequired, setApiKeySelectionRequired] = useState(false);
    const [videoStatus, setVideoStatus] = useState('');
    const { addToast } = useToasts();


    useEffect(() => {
        const loadHistory = async () => {
            if (!currentUser || currentUser.username === 'Guest') {
                setMessages([{
                    id: 'welcome-guest',
                    type: 'system',
                    sender: 'jiam',
                    content: "Hey there! I'm Jiam. Ask me anything. Sign up to save your chats!",
                    timestamp: Date.now()
                }]);
                return;
            }
            const history = await firebaseService.getChatHistory(currentUser.username);
            if (history.length === 0) {
                 setMessages([{
                    id: 'welcome-back',
                    type: 'system',
                    sender: 'jiam',
                    content: `Welcome back, ${currentUser.username}! What's on your mind?`,
                    timestamp: Date.now()
                }]);
            } else {
                setMessages(history);
            }
        };
        loadHistory();
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.username && currentUser.username !== 'Guest') {
            const unsubscribe = firebaseService.listenForBroadcasts(currentUser.username, (broadcastMessage) => {
                if (broadcastMessage) {
                    setMessages(prev => {
                        if (prev.some(msg => msg.id === broadcastMessage.id)) return prev;
                        return [...prev, broadcastMessage];
                    });
                } else {
                    setMessages(prev => prev.filter(msg => msg.type !== 'broadcast'));
                }
            });
            return () => unsubscribe();
        }
    }, [currentUser?.username]);

    const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
        const newMessage: ChatMessage = {
            ...message,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };
        setMessages(prev => {
            const updatedMessages = [...prev, newMessage];
            if (currentUser && currentUser.username !== 'Guest') {
                firebaseService.saveChatHistory(currentUser.username, updatedMessages);
            }
            return updatedMessages;
        });
        return newMessage;
    }, [currentUser]);
    
    const processUserMessage = async (prompt: string, options: { imageFile?: File | null; analysisFile?: File | string | null } = {}) => {
        if ((!prompt && !options.imageFile && !options.analysisFile) || isLoading || isStreaming || !currentUser || memoryConfirmation) return;
        if (isApiKeySelectionRequired) return;

        setIsLoading(true);

        // Add user message to chat
        if (options.imageFile) {
            addMessage({ type: 'multimodal-user', sender: 'user', content: { imageUrl: URL.createObjectURL(options.imageFile), text: prompt } });
        } else if (options.analysisFile) {
            if (typeof options.analysisFile === 'string') {
                 addMessage({ type: 'text', sender: 'user', content: `${prompt}\n\`\`\`\n${options.analysisFile}\n\`\`\`` });
            } else {
                addMessage({ type: 'file-user', sender: 'user', content: { file: { name: options.analysisFile.name }, text: prompt } });
            }
        } else {
            addMessage({ type: 'text', sender: 'user', content: prompt });
        }
        
        try {
            if (options.imageFile) { // Image Editing
                setLoadingTask('image');
                const result = await geminiService.editImage(prompt, options.imageFile);
                if (result.image) addMessage({ type: 'image', sender: 'jiam', content: { images: [result.image] } });
                if (result.text) addMessage({ type: 'text', sender: 'jiam', content: result.text });
            } else if (imageKeywordRegex.test(prompt) && !options.analysisFile) { // Image Generation
                setLoadingTask('image');
                const image = await geminiService.generateImageWithImagen(prompt);
                addMessage({ type: 'image', sender: 'jiam', content: { images: [image] } });
            } else if (lyricsKeywordRegex.test(prompt) && !options.analysisFile) { // Lyrics
                setLoadingTask('lyrics');
                const query = extractLyricsQuery(prompt);
                const lyrics = await externalApiService.fetchLyrics(query);
                addMessage({ type: 'lyrics', sender: 'jiam', content: lyrics });
            } else if (videoKeywordRegex.test(prompt) && !options.analysisFile) { // Video Generation
                setLoadingTask('video');

                const hasKey = await window.aistudio?.hasSelectedApiKey();
                if (!hasKey) {
                    setApiKeySelectionRequired(true);
                    setIsLoading(false);
                    setLoadingTask(null);
                    return;
                }
                
                const result = await geminiService.generateVideo(prompt, setVideoStatus);

                if (result.error) {
                    addToast(result.error, 'error');
                    // If it's the specific key error, prompt the user again.
                    if (result.error.includes("Please select a valid key")) {
                        setApiKeySelectionRequired(true);
                    }
                } else if (result.video) {
                    addMessage({ type: 'video', sender: 'jiam', content: result.video });
                }
            } else { // General Chat, Search, Thinking, File Analysis
                const useSearch = searchKeywordRegex.test(prompt) && !options.analysisFile;
                if (useSearch) setLoadingTask('search');
                else if (isThinkingMode) setLoadingTask('thinking');
                else setLoadingTask('text');

                const [persona, memory] = await Promise.all([
                    firebaseService.getGlobalPersona(),
                    currentUser.username === 'Guest' ? Promise.resolve('') : firebaseService.getUserMemory(currentUser.username)
                ]);
                
                setIsStreaming(true);
                const stream = geminiService.getChatResponseStream(prompt, messages, persona, memory, useSearch, isThinkingMode, options.analysisFile ?? undefined);

                let firstChunk = true, fullResponse = '', aiMessageId = '', groundingMetadata: any = null;

                for await (const chunk of stream) {
                    fullResponse += chunk.text;
                    if (chunk.groundingMetadata && !groundingMetadata) groundingMetadata = chunk.groundingMetadata;

                    if (firstChunk) {
                        setIsLoading(false);
                        const newMessage = addMessage({ type: 'text', sender: 'jiam', content: fullResponse });
                        aiMessageId = newMessage.id;
                        firstChunk = false;
                    } else {
                        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: fullResponse } : msg));
                    }
                }
                
                setIsStreaming(false);

                const memoryMatch = fullResponse.match(/\[\[memory:(.+?)\]\]/);
                let finalContent = fullResponse.replace(/\[\[memory:.+?\]\]/g, '').trim();

                if (memoryMatch?.[1] && currentUser.username !== 'Guest') {
                    setMemoryConfirmation({ fact: memoryMatch[1].trim(), messageId: aiMessageId });
                }

                setMessages(prev => {
                    const finalMessages = prev.map(msg => msg.id === aiMessageId ? { ...msg, content: finalContent, groundingMetadata: groundingMetadata } : msg);
                    if (currentUser.username !== 'Guest') firebaseService.saveChatHistory(currentUser.username, finalMessages);
                    return finalMessages;
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            setLoadingTask(null);
        }
    };
    
    const extractLyricsQuery = (prompt: string): string => {
        const lowerCasePrompt = prompt.toLowerCase();
        for (const phrase of lyricsKeywords) {
            if (lowerCasePrompt.includes(phrase)) {
                return prompt.substring(lowerCasePrompt.indexOf(phrase) + phrase.length).trim();
            }
        }
        return prompt;
    };

    const confirmMemory = async () => {
        if (!memoryConfirmation || !currentUser || currentUser.username === 'Guest') return;
        try {
            await firebaseService.saveUserMemory(currentUser.username, memoryConfirmation.fact);
            addToast('Memory saved!', 'success');
        } catch (error) {
            addToast("Sorry, I had trouble saving that memory.", 'error');
        } finally {
            setMemoryConfirmation(null);
        }
    };

    const rejectMemory = () => setMemoryConfirmation(null);
    
    const startNewChat = () => {
        const newChatWelcome = { id: 'new-chat-welcome', type: 'system', sender: 'jiam', content: 'New chat started. How can I help you?', timestamp: Date.now() } as ChatMessage;
        setMessages([newChatWelcome]);
        if(currentUser?.username !== 'Guest') firebaseService.saveChatHistory(currentUser.username, [newChatWelcome]);
    };

    const deleteMessage = useCallback((messageId: string) => {
        setMessages(prev => {
            const updated = prev.filter(msg => msg.id !== messageId);
            if (currentUser?.username !== 'Guest') firebaseService.saveChatHistory(currentUser.username, updated);
            return updated;
        });
    }, [currentUser]);

    const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
        setMessages(prev => {
            const updated = prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg);
            if (currentUser?.username !== 'Guest' && updates.type !== 'live-ai' && updates.type !== 'live-user') {
                 firebaseService.saveChatHistory(currentUser.username, updated);
            }
            return updated;
        });
    }, [currentUser]);

    const togglePinMessage = useCallback((messageId: string) => {
        const msg = messages.find(m => m.id === messageId);
        if (msg) updateMessage(messageId, { isPinned: !msg.isPinned });
    }, [messages, updateMessage]);



    const toggleArchiveMessage = useCallback((messageId: string) => {
        const msg = messages.find(m => m.id === messageId);
        if (msg) updateMessage(messageId, { isArchived: !msg.isArchived });
    }, [messages, updateMessage]);
    
    const clearApiKeyRequirement = () => {
        setApiKeySelectionRequired(false);
    };

    return { 
        messages, 
        isLoading, 
        isStreaming, 
        loadingTask, 
        memoryConfirmation, 
        isThinkingMode,
        isApiKeySelectionRequired,
        clearApiKeyRequirement,
        videoStatus,
        processUserMessage, 
        addMessage, 
        updateMessage, 
        startNewChat, 
        confirmMemory, 
        rejectMemory, 
        deleteMessage, 
        togglePinMessage, 
        toggleArchiveMessage,
        toggleThinkingMode: () => setIsThinkingMode(prev => !prev)
    };
};