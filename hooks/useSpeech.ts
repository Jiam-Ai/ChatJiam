
import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceSettings } from '../types';
import { geminiService, decodeAudioData } from '../services/geminiService';

// Add type definitions for Web Speech API which are not standard in TypeScript DOM types.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
    webkitAudioContext: typeof AudioContext;
  }
}

const WAKE_WORDS = ["hey jiam", "hey jam"];

const commandConfig: { command: string; phrases?: string[]; regex?: RegExp }[] = [
  { command: 'send', phrases: ['send message', 'send it'] },
  { command: 'new_chat', phrases: ['new chat', 'start new conversation', 'clear chat'] },
  { command: 'show_history', phrases: ['show history', 'open history'] },
  { command: 'call', regex: /call (?:user )?(.+)/i }
];

const parseCommand = (transcript: string): { command: string; arg?: string } | null => {
    for (const config of commandConfig) {
        if (config.phrases) {
            for (const phrase of config.phrases) {
                if (transcript.includes(phrase)) {
                    return { command: config.command };
                }
            }
        } else if (config.regex) {
            const match = transcript.match(config.regex);
            if (match && match[1]) {
                return { command: config.command, arg: match[1].trim() };
            }
        }
    }
    return null;
};


export const useSpeech = (
  settings: VoiceSettings,
  onTranscriptUpdate: (transcript: string) => void,
  onCommand: (command: string, arg?: string) => void,
  onCommandModeChange: (isActive: boolean) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const commandTimeoutRef = useRef<number | null>(null);
  const isCommandModeRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSource = useRef<AudioBufferSourceNode | null>(null);


  const setCommandMode = useCallback((isActive: boolean) => {
    isCommandModeRef.current = isActive;
    onCommandModeChange(isActive);
    if (isActive) {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = window.setTimeout(() => {
        setCommandMode(false);
      }, 5000); // 5-second window to issue a command
    } else {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    }
  }, [onCommandModeChange]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setCommandMode(false);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setMicError("Microphone error. Please try again.");
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim().toLowerCase();

      if (settings.isWakeWordEnabled) {
        if (isCommandModeRef.current) {
            if (lastResult.isFinal) {
                const parsedCommand = parseCommand(transcript);
                if (parsedCommand) {
                    onCommand(parsedCommand.command, parsedCommand.arg);
                }
                setCommandMode(false);
            }
        } else {
          const wakeWordDetected = WAKE_WORDS.some(w => transcript.includes(w));
          const confidence = lastResult[0].confidence;
          const sensitivityThreshold = settings.wakeWordSensitivity / 100;
          if (wakeWordDetected && confidence >= sensitivityThreshold) {
            setCommandMode(true);
          }
        }
      } else {
        const fullTranscript = Array.from(event.results).map(r => r[0].transcript).join('');
        onTranscriptUpdate(fullTranscript);
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
        recognition.stop();
        if(commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        if(audioContextRef.current) audioContextRef.current.close();
    }
  }, [settings, onTranscriptUpdate, onCommand, setCommandMode]);

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (activeAudioSource.current) {
        activeAudioSource.current.stop();
        activeAudioSource.current = null;
        setIsSpeaking(false);
      }
      try {
        setMicError(null);
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition:", e);
        setMicError("Couldn't start mic.");
      }
    }
  }, [isListening]);

  const speakText = useCallback(async (text: string) => {
    if (!settings.isTtsEnabled || !text || isSpeaking) return;

    // Stop any active recognition
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    setIsSpeaking(true);
    try {
      const base64Audio = await geminiService.generateSpeech(text, settings.aiVoice);
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      const audioBytes = atob(base64Audio).split('').map(char => char.charCodeAt(0));
      const audioBuffer = await decodeAudioData(new Uint8Array(audioBytes), audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      activeAudioSource.current = source;
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setIsSpeaking(false);
        activeAudioSource.current = null;
      };
      source.start();

    } catch (error) {
      console.error("Error in speakText:", error);
      setIsSpeaking(false);
      // Optional: Fallback to native TTS or show a toast
    }
  }, [settings.isTtsEnabled, settings.aiVoice, isSpeaking, isListening]);

  return { isListening, isSpeaking, micError, toggleMic, speakText };
};
