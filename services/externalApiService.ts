
import type { ImageContent, LyricsContent } from '../types';

export const availableImageApis: string[] = [];

export const externalApiService = {
  fetchLyrics: async (query: string): Promise<LyricsContent> => {
    try {
        const response = await fetch(`https://api.ryzumi.vip/api/search/lyrics?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error("Could not find lyrics for that query.");
            throw new Error(`Lyrics API request failed with status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Sorry, I couldn't find any lyrics matching your query.");
        }

        const firstHit = data[0];
        if (!firstHit || !firstHit.plainLyrics) {
            throw new Error("The lyrics service returned an invalid response.");
        }

        return {
          title: firstHit.name || 'Unknown Title',
          artist: firstHit.artistName || 'Unknown Artist',
          lyrics: firstHit.plainLyrics,
        };
    } catch (error) {
        if (error instanceof Error && (error.message.includes('find lyrics') || error.message.includes('invalid response') || error.message.includes('request failed'))) {
            throw error; // Re-throw our custom, user-friendly errors
        }
        console.error("Lyrics API fetch error:", error);
        throw new Error("The lyrics service is currently unavailable. Please check your connection and try again.");
    }
  }
};