import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFaqs,
  createFaq,
  createFaqsBulk,
  updateFaq,
  deleteFaq,
  seedInitialFaqs,
  getFaqStats,
} from '@/services/faqService';
import { FaqCreateInput, FaqUpdateInput } from '@/types/faq';

export const FAQS_QUERY_KEY = ['faqs'] as const;
export const FAQ_STATS_QUERY_KEY = ['faqStats'] as const;

/**
 * Hook to query FAQs with optional category and keyword search filters.
 */
export function useFaqs(category?: string, search?: string) {
  return useQuery({
    queryKey: [...FAQS_QUERY_KEY, { category, search }],
    queryFn: () => getFaqs({ category, search }),
    staleTime: 1000 * 60 * 2, // 2 minutes fresh
  });
}

/**
 * Hook to get knowledge base statistics.
 */
export function useFaqStats() {
  return useQuery({
    queryKey: FAQ_STATS_QUERY_KEY,
    queryFn: getFaqStats,
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook to create a new FAQ item.
 */
export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FaqCreateInput) => createFaq(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_STATS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update an existing FAQ item.
 */
export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FaqUpdateInput }) =>
      updateFaq(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_STATS_QUERY_KEY });
    },
  });
}

/**
 * Hook to delete an FAQ item.
 */
export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_STATS_QUERY_KEY });
    },
  });
}

/**
 * Hook to add many FAQs at once (document import).
 */
export function useBulkCreateFaqs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inputs, onProgress }: { inputs: FaqCreateInput[]; onProgress?: (done: number, total: number) => void }) =>
      createFaqsBulk(inputs, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_STATS_QUERY_KEY });
    },
  });
}

/**
 * Hook to seed the knowledge base with initial curated FAQs.
 */
export function useSeedFaqs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onProgress?: (curr: number, total: number) => void) =>
      seedInitialFaqs(onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_STATS_QUERY_KEY });
    },
  });
}
