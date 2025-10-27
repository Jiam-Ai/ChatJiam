import { GoogleGenAI, Modality } from "@google/genai";
import type { ChatMessage, ImageContent, VideoContent } from '../types';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY environment variable not set for Gemini service.");
}

// Helper to create a new AI client instance, ensuring the latest API key is used.
// This is defined outside the service object to avoid `this` context issues.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Audio Utilities ---
// These are required for decoding TTS audio data from the Gemini API.
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
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


// --- Service Definition ---
export const geminiService = {
  getChatResponseStream: async function* (
    prompt: string,
    history: ChatMessage[],
    systemInstruction: string,
    memory: string,
    useSearch: boolean,
    useThinkingMode: boolean,
    analysisFile?: File | string // Accept string for code analysis
  ): AsyncGenerator<{ text: string; groundingMetadata?: any }> {
    try {
      // FIX: Use standalone getAIClient function to avoid `this` context errors.
      const ai = getAIClient();
      const fullSystemInstruction = `${systemInstruction}\n\n# MEMORY BANK\nThis is what you already know about the user. You MUST use this to inform and personalize your response:\n${memory}`;

      let modelName = 'gemini-2.5-flash-lite';
      if (useSearch) modelName = 'gemini-2.5-flash';
      // Use Pro for thinking mode or code analysis
      if (useThinkingMode || typeof analysisFile === 'string') {
        modelName = 'gemini-2.5-pro';
      }
      
      const contents: any[] = [];
      const textHistory = history.filter(msg => (msg.type === 'text' || msg.type === 'multimodal-user') && msg.content);
      
      for (const msg of textHistory) {
          const role = msg.sender === 'user' ? 'user' : 'model';
          let text = '';
          if (typeof msg.content === 'string') {
            text = msg.content;
          } else if (typeof (msg.content as any).text === 'string') {
            text = (msg.content as any).text;
          }

          if (text) {
             contents.push({ role, parts: [{ text }] });
          }
      }
      
      const currentPromptParts = [];
      if (analysisFile) {
        if (typeof analysisFile === 'string') {
            // It's code, add it as text.
            currentPromptParts.push({ text: `\n\`\`\`\n${analysisFile}\n\`\`\`\n` });
        } else {
            // It's a file, process it.
            currentPromptParts.push(await fileToGenerativePart(analysisFile));
        }
      }
      currentPromptParts.push({ text: prompt });

      contents.push({ role: 'user', parts: currentPromptParts });

      const config: any = { systemInstruction: fullSystemInstruction };

      if (useSearch) {
        config.tools = [{googleSearch: {}}];
      }

      if (useThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }
      
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: config,
      });
      
      for await (const chunk of responseStream) {
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(
            (c: any) => c.web
        ).filter(Boolean);
        
        yield { text: chunk.text, groundingMetadata };
      }
    } catch (error) {
      console.error("Error getting streaming response from Gemini:", error);
      throw new Error("The AI is currently unresponsive. This could be due to a network issue or the service being temporarily down. Please try again shortly.");
    }
  },

  getCodeSuggestion: async (code: string, language: string): Promise<string> => {
    if (!code.trim()) return '';
    try {
        const ai = getAIClient();
        const prompt = `You are an expert ${language} programmer providing code completion. Given the following code snippet, provide the most likely completion. Respond ONLY with the code completion itself, without any explanation, markdown, or conversation.

\`\`\`${language}
${code}
\`\`\``;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                stopSequences: ['\n\n', '```'],
                maxOutputTokens: 128,
                temperature: 0.1,
            },
        });

        const suggestion = response.text.trim();
        // Post-process to ensure it starts on the same line if possible
        if (!code.endsWith('\n') && suggestion.startsWith('\n')) {
            return suggestion.substring(1);
        }
        return suggestion;
    } catch (error) {
        console.warn("Could not fetch code suggestion:", error);
        return '';
    }
  },

  editImage: async (prompt: string, imageFile: File): Promise<{ text?: string; image?: ImageContent }> => {
    try {
        // FIX: Use standalone getAIClient function to avoid `this` context errors.
        const ai = getAIClient();
        const base64Data = await fileToBase64(imageFile);

        const imagePart = {
            inlineData: {
                mimeType: imageFile.type,
                data: base64Data,
            },
        };

        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const result: { text?: string; image?: ImageContent } = {};
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part?.text) {
                result.text = part.text;
            } else if (part?.inlineData) {
                const blob = await base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
                result.image = {
                    blobUrl: URL.createObjectURL(blob),
                    apiName: 'Jiam Edit',
                    apiUrl: '',
                };
            }
        }
        
        if (!result.text && !result.image) {
            throw new Error("The AI did not return a valid response. It may not have understood the request.");
        }

        return result;

    } catch (error) {
        console.error("Error editing image with Gemini:", error);
        throw new Error("Failed to edit the image. The AI service may be down or the image format might not be supported.");
    }
  },
  
  generateImageWithImagen: async (prompt: string): Promise<ImageContent> => {
    try {
        // FIX: Use standalone getAIClient function to avoid `this` context errors.
        const ai = getAIClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        // FIX: Safely access the generated image bytes with optional chaining and a null check to prevent runtime errors.
        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("Image generation failed to produce an image.");
        }

        const blob = await base64ToBlob(base64ImageBytes, 'image/jpeg');

        return {
            blobUrl: URL.createObjectURL(blob),
            apiName: 'Imagen 4',
            apiUrl: '',
        };
    } catch (error) {
        console.error("Error generating image with Imagen:", error);
        throw new Error("Failed to generate image. The service may be unavailable or the prompt may be unsuitable.");
    }
  },

  generateVideo: async (
    prompt: string,
    statusCallback: (status: string) => void
  ): Promise<{ video?: VideoContent; error?: string }> => {
    try {
      // Create a new instance right before the call to ensure the latest key is used.
      const ai = getAIClient();
      statusCallback("Initiating video generation...");
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      statusCallback("Generating video... This may take a few minutes.");
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        statusCallback("Checking progress...");
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      statusCallback("Finalizing video...");

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation completed but no download link was provided.");
      }

      // The API key must be appended for the download link to work.
      const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
      
      return { video: { videoUrl: finalUrl, prompt: prompt } };

    } catch (error: any) {
      console.error("Error generating video with Veo:", error);
      
      // Specific error handling for missing API key
      if (error.message && error.message.includes("Requested entity was not found.")) {
        return { error: "API key is invalid or missing permissions for video generation. Please select a valid key." };
      }
      
      return { error: "Failed to generate video. The service may be busy or the prompt could not be processed." };
    }
  },
  
  generateSpeech: async (text: string, voiceName: string): Promise<string> => {
    try {
      // FIX: Use standalone getAIClient function to avoid `this` context errors.
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
          },
        },
      });
      // FIX: Safely access deeply nested audio data with optional chaining and validate its existence to prevent runtime errors.
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return base64Audio;
      }
      throw new Error("API did not return audio data.");
    } catch (error) {
      console.error("Error generating speech with Gemini:", error);
      throw new Error("Failed to generate speech.");
    }
  },
};

// --- File Utilities (as per Gemini guidelines) ---
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await fileToBase64(file);
    return {
        inlineData: {
            mimeType: file.type,
            data: base64EncodedData,
        },
    };
};

const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
    const res = await fetch(`data:${mimeType};base64,${base64}`);
    return res.blob();
};