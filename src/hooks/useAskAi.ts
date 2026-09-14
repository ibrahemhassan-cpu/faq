import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { askAiWithKnowledgeBase } from '@/services/aiService';
import { AskAiRequest, AskAiResponse } from '@/types/search';

export function useAskAi() {
  const [history, setHistory] = useState<AskAiResponse[]>([]);

  const mutation = useMutation({
    mutationFn: (request: AskAiRequest) => askAiWithKnowledgeBase(request),
    onSuccess: (data) => {
      setHistory((prev) => [data, ...prev.slice(0, 9)]); // Keep last 10 queries
    },
  });

  const clearHistory = () => setHistory([]);

  return {
    ask: mutation.mutate,
    askAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    history,
    clearHistory,
  };
}
