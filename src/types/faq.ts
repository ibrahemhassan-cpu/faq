export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  language?: 'en' | 'ar';
  embedding?: number[] | null;
  is_published: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FaqCreateInput {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  language?: 'en' | 'ar';
  is_published?: boolean;
  embedding?: number[] | null;
  metadata?: Record<string, any>;
}

export interface FaqUpdateInput {
  question?: string;
  answer?: string;
  category?: string;
  tags?: string[];
  language?: 'en' | 'ar';
  is_published?: boolean;
  embedding?: number[] | null;
  metadata?: Record<string, any>;
}

export interface FaqStats {
  total: number;
  publishedCount: number;
  withEmbeddingsCount: number;
  categoryCounts: Record<string, number>;
  languageCounts?: { en: number; ar: number };
}

/** An FAQ the AI extracted from an uploaded document, waiting for review. */
export interface ImportedFaqDraft {
  draftId: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  language: 'en' | 'ar';
  /** Quote from the document that supports the answer. */
  sourceExcerpt: string;
  /** true/false for text files (quote checked against the document), null when it can't be checked (PDF). */
  excerptVerified: boolean | null;
  /** Existing FAQ question this repeats, if any. */
  duplicateOf: string | null;
}

export const FAQ_CATEGORIES = [
  'All',
  'General',
  'Billing & Subscriptions',
  'Account & Security',
  'Technical Support',
  'API & Integrations',
] as const;

export type FaqCategory = typeof FAQ_CATEGORIES[number];
