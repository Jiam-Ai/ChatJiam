
import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality, Blob as GenAI_Blob, LiveServerMessage } from '@google/genai';
import type { ChatMessage } from '../types';
import { useToasts } from '../context/ToastContext';

// Fix: Add webkitAudioContext to window type for older browser compatibility.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// Safely access the API key
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY environment variable not set for Gemini service.");
}
const ai = new GoogleGenAI({ apiKey: apiKey! });

// --- Audio Encoding/Decoding Utilities (as per Gemini guidelines) ---

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): GenAI_Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- The Hook ---

export const useLiveConversation = (
    addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => ChatMessage,
    updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
) => {
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<'user' | 'ai' | 'none'>('none');

  const { addToast } = useToasts();

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const currentTranscription = useRef({ user: '', ai: '' });
  const currentMessageIds = useRef({ user: '', ai: '' });

  const stopLiveSession = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (error) {
            console.error("Error closing live session:", error);
        }
    }
    
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if(mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        await inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        await outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }

    // Finalize any lingering transcriptions
    if (currentMessageIds.current.user) {
        updateMessage(currentMessageIds.current.user, { type: 'text' });
    }
     if (currentMessageIds.current.ai) {
        updateMessage(currentMessageIds.current.ai, { type: 'text' });
    }

    sessionPromiseRef.current = null;
    setIsLive(false);
    setIsConnecting(false);
    setIsSpeaking('none');
    currentTranscription.current = { user: '', ai: '' };
    currentMessageIds.current = { user: '', ai: '' };
  }, [updateMessage]);

  const startLiveSession = useCallback(async () => {
    if (isLive || isConnecting) return;

    setIsConnecting(true);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // FIX: Initialize the input audio context with the device's default sample rate to avoid errors.
        // We will resample the audio to the required 16000Hz before sending it to the API.
        inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        
        const outputNode = outputAudioContextRef.current.createGain();
        outputNode.connect(outputAudioContextRef.current.destination);

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    mediaStreamSourceRef.current = source;
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputBuffer = audioProcessingEvent.inputBuffer;
                        const inputData = inputBuffer.getChannelData(0);
                        
                        // FIX: Resample audio from the native device sample rate to the 16000Hz required by the Gemini API.
                        const sourceSampleRate = inputBuffer.sampleRate;
                        const targetSampleRate = 16000;
                        let processedData: Float32Array;

                        if (sourceSampleRate === targetSampleRate) {
                            processedData = inputData;
                        } else {
                            const ratio = sourceSampleRate / targetSampleRate;
                            const targetLength = Math.floor(inputData.length / ratio);
                            processedData = new Float32Array(targetLength);

                            for (let i = 0; i < targetLength; i++) {
                                const srcIndex = i * ratio;
                                const srcIndexFloor = Math.floor(srcIndex);
                                const srcIndexCeil = srcIndexFloor + 1;
                                const weight = srcIndex - srcIndexFloor;
                                
                                const val1 = inputData[srcIndexFloor] || 0;
                                const val2 = inputData[srcIndexCeil] || 0;

                                processedData[i] = val1 * (1 - weight) + val2 * weight;
                            }
                        }

                        const pcmBlob = createBlob(processedData);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    setIsConnecting(false);
                    setIsLive(true);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription?.text) {
                        setIsSpeaking('user');
                        const text = message.serverContent.inputTranscription.text;
                        currentTranscription.current.user += text;

                        if (!currentMessageIds.current.user) {
                            const newMessage = addMessage({ sender: 'user', type: 'live-user', content: currentTranscription.current.user });
                            currentMessageIds.current.user = newMessage.id;
                        } else {
                            updateMessage(currentMessageIds.current.user, { content: currentTranscription.current.user });
                        }
                    }

                    if (message.serverContent?.outputTranscription?.text) {
                        setIsSpeaking('ai');
                        const text = message.serverContent.outputTranscription.text;
                        currentTranscription.current.ai += text;

                        if (!currentMessageIds.current.ai) {
                            const newMessage = addMessage({ sender: 'jiam', type: 'live-ai', content: currentTranscription.current.ai });
                            currentMessageIds.current.ai = newMessage.id;
                        } else {
                            updateMessage(currentMessageIds.current.ai, { content: currentTranscription.current.ai });
                        }
                    }
                    
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        const outCtx = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                        
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        
                        source.addEventListener('ended', () => {
                            audioSourcesRef.current.delete(source);
                            if (audioSourcesRef.current.size === 0) {
                                setIsSpeaking(p => p === 'ai' ? 'none' : p);
                            }
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }

                    if (message.serverContent?.interrupted) {
                        for (const source of audioSourcesRef.current.values()) {
                            source.stop();
                            audioSourcesRef.current.delete(source);
                        }
                        nextStartTimeRef.current = 0;
                    }

                    if (message.serverContent?.turnComplete) {
                        setIsSpeaking('none');
                        
                        // Finalize user message
                        if (currentMessageIds.current.user) {
                            updateMessage(currentMessageIds.current.user, { type: 'text' });
                        }
                        // Finalize AI message
                        if (currentMessageIds.current.ai) {
                            updateMessage(currentMessageIds.current.ai, { type: 'text' });
                        }

                        currentTranscription.current = { user: '', ai: '' };
                        currentMessageIds.current = { user: '', ai: '' };
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Live session error:", e);
                    addToast("Live conversation error. Please try again.", 'error');
                    stopLiveSession();
                },
                onclose: (e: CloseEvent) => {
                    stopLiveSession();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: 'You are Jiam, a helpful AI assistant created by Ibrahim Sorie Kamara. Your goal is to have a natural, helpful, and friendly conversation.',
            },
        });

    } catch (error) {
        console.error("Failed to start live session:", error);
        addToast("Could not access microphone. Please check permissions.", 'error');
        setIsConnecting(false);
    }
  }, [isLive, isConnecting, addMessage, updateMessage, stopLiveSession, addToast]);

  return { isLive, isConnecting, isSpeaking, startLiveSession, stopLiveSession };
};
