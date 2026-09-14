export interface MatchedFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  similarity: number;
}

export interface AskAiRequest {
  query: string;
  model?: string;
  filterCategory?: string;
  matchThreshold?: number;
  matchCount?: number;
}

export interface AskAiResponse {
  query: string;
  modelUsed: string;
  answer: string;
  sources: MatchedFaq[];
  highestSimilarity: number;
  isGrounded: boolean;
  hasRelevantMatch: boolean;
  latencyMs: number;
}

export interface SemanticSearchResult {
  matches: MatchedFaq[];
  queryEmbedding?: number[];
  executionTimeMs: number;
}
