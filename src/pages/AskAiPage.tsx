import React from 'react';
import { AskAiHero } from '@/components/ask-ai/AskAiHero';
import { AiResponseCard } from '@/components/ask-ai/AiResponseCard';
import { MatchedFaqList } from '@/components/ask-ai/MatchedFaqList';
import { QueryHistoryList } from '@/components/ask-ai/QueryHistoryList';
import { useAskAi } from '@/hooks/useAskAi';

export const AskAiPage: React.FC = () => {
  const { ask, isLoading, data: currentResponse, history, clearHistory } = useAskAi();

  const handleAsk = (
    query: string,
    options?: { category?: string; threshold?: number; matchCount?: number; model?: string }
  ) => {
    ask({
      query,
      model: options?.model,
      filterCategory: options?.category,
      matchThreshold: options?.threshold,
      matchCount: options?.matchCount,
    });
  };

  return (
    <div className="space-y-8">
      {/* Search and Prompt Hero */}
      <AskAiHero onAsk={handleAsk} isLoading={isLoading} />

      {/* Response and Retrieved Knowledge Context */}
      {currentResponse && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <AiResponseCard response={currentResponse} />
          <MatchedFaqList sources={currentResponse.sources} />
        </div>
      )}

      {/* Query History */}
      <div className="max-w-4xl mx-auto">
        <QueryHistoryList
          history={history}
          onSelectQuery={(q) => handleAsk(q)}
          onClear={clearHistory}
        />
      </div>
    </div>
  );
};
