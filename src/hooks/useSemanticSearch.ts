import { useQuery } from '@tanstack/react-query';
import { searchFaqsSemantically } from '@/services/searchService';
import { AskAiRequest } from '@/types/search';

export const SEMANTIC_SEARCH_KEY = ['semanticSearch'] as const;

/**
 * Hook to perform semantic search with debounce-ready queries.
 */
export function useSemanticSearch(request: AskAiRequest, enabled: boolean = true) {
  return useQuery({
    queryKey: [...SEMANTIC_SEARCH_KEY, request],
    queryFn: () => searchFaqsSemantically(request),
    enabled: enabled && Boolean(request.query && request.query.trim().length >= 2),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
