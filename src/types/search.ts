// Mirrors the response shape of supabase/functions/_shared/faqAssistant.ts

export type MatchRelevance = 'direct' | 'partial' | 'related';
export type AnswerConfidence = 'high' | 'medium' | 'low';
export type SearchStrategy = 'full-context' | 'prefilter' | 'truncated';

export interface MatchedFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  relevance: MatchRelevance;
  /** Why the AI picked this entry, in the customer's language. */
  reason: string;
}

export interface ConversationTurn {
  question: string;
  answer: string;
}

export interface AskAiRequest {
  query: string;
  model?: string;
  filterCategory?: string;
  history?: ConversationTurn[];
}

export interface AskAiResponse {
  query: string;
  answer: string;
  /** The customer's need as the AI understood it. */
  intent: string;
  confidence: AnswerConfidence;
  hasRelevantMatch: boolean;
  followUpQuestion: string | null;
  sources: MatchedFaq[];
  provider: string;
  modelUsed: string;
  strategy: SearchStrategy;
  faqsConsidered: number;
  latencyMs: number;
}
