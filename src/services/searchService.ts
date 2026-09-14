import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MatchedFaq, AskAiRequest, SemanticSearchResult } from '@/types/search';
import { generateEmbedding, calculateCosineSimilarity } from './embeddingService';
import { getFaqs } from './faqService';

/**
 * Searches the FAQ knowledge base semantically using vector embeddings.
 */
export async function searchFaqsSemantically(
  request: AskAiRequest
): Promise<SemanticSearchResult> {
  const startTime = performance.now();
  const query = request.query.trim();

  if (!query) {
    return { matches: [], executionTimeMs: 0 };
  }

  const matchThreshold = request.matchThreshold ?? 0.70;
  const matchCount = request.matchCount ?? 5;
  const filterCategory = request.filterCategory && request.filterCategory !== 'All' 
    ? request.filterCategory 
    : null;

  // 1. Generate query embedding via Gemini (768 dimensions)
  const queryEmbedding = await generateEmbedding(query);

  // 2. Try Supabase pgvector RPC function `match_faqs`
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('match_faqs', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_category: filterCategory,
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const executionTimeMs = Math.round(performance.now() - startTime);
        return {
          matches: data as MatchedFaq[],
          queryEmbedding,
          executionTimeMs,
        };
      }
      if (error) {
        console.warn('[SearchService] Supabase RPC match_faqs failed, fallback to local vector search:', error.message);
      }
    } catch (err: any) {
      console.warn('[SearchService] Supabase RPC exception:', err?.message);
    }
  }

  // 3. Fallback: Local vector similarity calculation over existing FAQs
  const { faqs } = await getFaqs({ category: filterCategory || undefined });
  const matches: MatchedFaq[] = [];

  for (const faq of faqs) {
    if (!faq.is_published) continue;

    let similarity = 0;
    if (faq.embedding && faq.embedding.length > 0) {
      similarity = calculateCosineSimilarity(queryEmbedding, faq.embedding);
    } else {
      // If FAQ doesn't have vector yet, generate one or compare text tokens
      const textToEmbed = `${faq.question}\n${faq.answer}`;
      const faqVector = await generateEmbedding(textToEmbed);
      similarity = calculateCosineSimilarity(queryEmbedding, faqVector);
    }

    if (similarity >= matchThreshold) {
      matches.push({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
        similarity: Math.round(similarity * 1000) / 1000,
      });
    }
  }

  // Sort by similarity descending and cap at matchCount
  matches.sort((a, b) => b.similarity - a.similarity);
  const slicedMatches = matches.slice(0, matchCount);

  const executionTimeMs = Math.round(performance.now() - startTime);
  return {
    matches: slicedMatches,
    queryEmbedding,
    executionTimeMs,
  };
}
