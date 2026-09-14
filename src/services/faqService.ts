import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FaqItem, FaqCreateInput, FaqUpdateInput, FaqStats } from '@/types/faq';
import { generateEmbedding } from './embeddingService';
import { INITIAL_FAQS } from '@/data/initialFaqs';

const LOCAL_STORAGE_KEY = 'faq_ai_poc_local_faqs';

// In-memory / LocalStorage cache fallback if Supabase is offline or table uninitialized
function getLocalFaqs(): FaqItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to read local FAQs', e);
  }
  return [];
}

function saveLocalFaqs(faqs: FaqItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(faqs));
  } catch (e) {
    console.error('Failed to save local FAQs', e);
  }
}

/**
 * Fetch all FAQs with optional category and search query filters.
 */
export async function getFaqs(params?: {
  category?: string;
  search?: string;
}): Promise<{ faqs: FaqItem[]; isUsingFallback: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
      }

      if (params?.search && params.search.trim()) {
        const searchTerm = `%${params.search.trim()}%`;
        query = query.or(`question.ilike.${searchTerm},answer.ilike.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist yet in Supabase
        console.warn('[FaqService] Supabase query returned error, falling back to local storage:', error.message);
        return {
          faqs: filterLocalFaqs(params),
          isUsingFallback: true,
          error: error.message,
        };
      }

      return { faqs: (data as FaqItem[]) || [], isUsingFallback: false };
    } catch (err: any) {
      console.warn('[FaqService] Supabase connection error:', err?.message);
      return {
        faqs: filterLocalFaqs(params),
        isUsingFallback: true,
        error: err?.message,
      };
    }
  }

  return { faqs: filterLocalFaqs(params), isUsingFallback: true };
}

function filterLocalFaqs(params?: { category?: string; search?: string }): FaqItem[] {
  let faqs = getLocalFaqs();

  // If local storage is empty, initialize with default seeded FAQs
  if (faqs.length === 0) {
    faqs = INITIAL_FAQS.map((item, idx) => ({
      ...item,
      id: `local-${idx + 1}`,
      is_published: true,
      created_at: new Date(Date.now() - idx * 3600000).toISOString(),
      updated_at: new Date(Date.now() - idx * 3600000).toISOString(),
    }));
    saveLocalFaqs(faqs);
  }

  if (params?.category && params.category !== 'All') {
    faqs = faqs.filter((f) => f.category === params.category);
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase();
    faqs = faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return faqs;
}

/**
 * Creates a new FAQ item and generates its vector embedding.
 */
export async function createFaq(input: FaqCreateInput): Promise<FaqItem> {
  // Generate vector embedding for question + answer
  const textToEmbed = `${input.question}\n${input.answer}\nTags: ${input.tags.join(', ')}`;
  const embedding = input.embedding || (await generateEmbedding(textToEmbed));

  const newRecord = {
    question: input.question,
    answer: input.answer,
    category: input.category || 'General',
    tags: input.tags || [],
    embedding,
    is_published: input.is_published ?? true,
    metadata: input.metadata || {},
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) {
        return data as FaqItem;
      }
      console.warn('[FaqService] Supabase insert failed, saving locally:', error?.message);
    } catch (err) {
      console.warn('[FaqService] Supabase exception, saving locally:', err);
    }
  }

  // Fallback save to local storage
  const localItem: FaqItem = {
    ...newRecord,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const current = getLocalFaqs();
  saveLocalFaqs([localItem, ...current]);
  return localItem;
}

/**
 * Updates an existing FAQ. If question or answer changed, re-computes the embedding.
 */
export async function updateFaq(id: string, input: FaqUpdateInput): Promise<FaqItem> {
  let embedding = input.embedding;

  // If question or answer was updated, regenerate embedding
  if (embedding === undefined && (input.question || input.answer)) {
    const textToEmbed = `${input.question || ''}\n${input.answer || ''}\nTags: ${(input.tags || []).join(', ')}`;
    embedding = await generateEmbedding(textToEmbed);
  }

  const payload: any = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  if (embedding !== undefined) {
    payload.embedding = embedding;
  }

  if (isSupabaseConfigured && !id.startsWith('local-')) {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as FaqItem;
      }
      console.warn('[FaqService] Supabase update failed:', error?.message);
    } catch (err) {
      console.warn('[FaqService] Supabase update exception:', err);
    }
  }

  // Local fallback
  const list = getLocalFaqs();
  const index = list.findIndex((f) => f.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...payload };
    saveLocalFaqs(list);
    return list[index];
  }

  throw new Error(`FAQ with id ${id} not found.`);
}

/**
 * Deletes an FAQ item.
 */
export async function deleteFaq(id: string): Promise<void> {
  if (isSupabaseConfigured && !id.startsWith('local-')) {
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) {
        console.warn('[FaqService] Supabase delete failed:', error.message);
      }
    } catch (err) {
      console.warn('[FaqService] Supabase delete exception:', err);
    }
  }

  // Also purge from local storage
  const list = getLocalFaqs().filter((f) => f.id !== id);
  saveLocalFaqs(list);
}

/**
 * Batch seeds initial FAQs with generated embeddings into Supabase or local storage.
 */
export async function seedInitialFaqs(onProgress?: (current: number, total: number) => void): Promise<number> {
  const total = INITIAL_FAQS.length;
  let seededCount = 0;

  const itemsToInsert: any[] = [];

  for (let i = 0; i < total; i++) {
    const item = INITIAL_FAQS[i];
    const textToEmbed = `${item.question}\n${item.answer}\nTags: ${item.tags.join(', ')}`;
    const embedding = await generateEmbedding(textToEmbed);

    itemsToInsert.push({
      ...item,
      embedding,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    seededCount++;
    if (onProgress) {
      onProgress(seededCount, total);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('faqs').insert(itemsToInsert);
      if (!error) {
        return seededCount;
      }
      console.warn('[FaqService] Supabase batch seed error:', error.message);
    } catch (err) {
      console.warn('[FaqService] Supabase batch seed exception:', err);
    }
  }

  // Save to local storage as fallback
  const localList: FaqItem[] = itemsToInsert.map((item, idx) => ({
    ...item,
    id: `local-seed-${Date.now()}-${idx}`,
  }));
  saveLocalFaqs(localList);
  return seededCount;
}

/**
 * Calculates statistics on FAQ database.
 */
export async function getFaqStats(): Promise<FaqStats> {
  const { faqs } = await getFaqs();
  const categoryCounts: Record<string, number> = {};
  let withEmbeddingsCount = 0;

  faqs.forEach((faq) => {
    categoryCounts[faq.category] = (categoryCounts[faq.category] || 0) + 1;
    if (faq.embedding && faq.embedding.length > 0) {
      withEmbeddingsCount++;
    }
  });

  return {
    total: faqs.length,
    publishedCount: faqs.filter((f) => f.is_published).length,
    withEmbeddingsCount,
    categoryCounts,
  };
}
