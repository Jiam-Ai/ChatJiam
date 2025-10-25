export interface User {
  username: string;
  role: 'guest' | 'user' | 'admin' | 'super';
  displayName?: string;
  avatar?: string;
}

export interface ImageContent {
  blobUrl: string;
  apiUrl: string;
  apiName: string;
}

export interface LyricsContent {
  title: string;
  artist: string;
  lyrics: string;
}

export interface MultimodalUserContent {
  imageUrl: string;
  text: string;
}

export interface UserFileContent {
  file: { name: string };
  text: string;
}

// FIX: Add the missing VideoContent interface to resolve the import error in VideoDisplay.tsx.
export interface VideoContent {
  videoUrl: string;
  prompt?: string;
}

// FIX: Add VideoContent to the MessageContent union type.
export type MessageContent = string | { images: ImageContent[] } | LyricsContent | MultimodalUserContent | UserFileContent | VideoContent;

export interface ChatMessage {
  id: string;
  // FIX: Add 'video' to the ChatMessage type union to support video messages.
  type: 'text' | 'image' | 'lyrics' | 'system' | 'broadcast' | 'multimodal-user' | 'file-user' | 'live-user' | 'live-ai' | 'video';
  sender: 'user' | 'jiam';
  content: MessageContent;
  timestamp: number;
  isPinned?: boolean;
  isArchived?: boolean;
  groundingMetadata?: {
    uri: string;
    title: string;
  }[];
  contextImageUrl?: string;
}

export enum CallState {
    IDLE = 'IDLE',
    OUTGOING = 'OUTGOING',
    INCOMING = 'INCOMING',
    CONNECTED = 'CONNECTED',
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface VoiceSettings {
  isWakeWordEnabled: boolean;
  wakeWordSensitivity: number; // Stored as 0-100
  isTtsEnabled: boolean;
  aiVoice: string;
}
