
import { useState, useCallback, useRef } from 'react';
import { geminiService } from '../services/geminiService';

export const useCodeSuggestions = () => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setIsLoading(false);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const triggerSuggestion = useCallback((code: string, language: string) => {
    clearSuggestion();
    if (code.trim().length < 10) return; // Don't trigger for very short code

    setIsLoading(true);

    debounceTimeoutRef.current = window.setTimeout(async () => {
      const result = await geminiService.getCodeSuggestion(code, language);
      if (result) {
        setSuggestion(result);
      }
      setIsLoading(false);
    }, 1000); // 1-second debounce
  }, [clearSuggestion]);

  const acceptSuggestion = useCallback(() => {
    const accepted = suggestion;
    clearSuggestion();
    return accepted;
  }, [suggestion, clearSuggestion]);

  const rejectSuggestion = useCallback(() => {
    clearSuggestion();
  }, [clearSuggestion]);

  return {
    suggestion,
    isLoading,
    triggerSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
