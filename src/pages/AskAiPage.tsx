import React, { useEffect, useRef } from 'react';
import { AskAiHero } from '@/components/ask-ai/AskAiHero';
import { AiResponseCard } from '@/components/ask-ai/AiResponseCard';
import { MatchedFaqList } from '@/components/ask-ai/MatchedFaqList';
import { QueryHistoryList } from '@/components/ask-ai/QueryHistoryList';
import { ThinkingIndicator } from '@/components/ask-ai/ThinkingIndicator';
import { useAskAi } from '@/hooks/useAskAi';
import { useFaqs } from '@/hooks/useFaqs';
import { usePrefersReducedMotion } from '@/hooks/useTypewriter';

export const AskAiPage: React.FC = () => {
  const { ask, isLoading, error, data: currentResponse, history, clearHistory } = useAskAi();
  const { data: faqData } = useFaqs();
  const resultsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const handleAsk = (query: string, options?: { category?: string; model?: string }) => {
    ask({
      query,
      model: options?.model,
      filterCategory: options?.category,
      // Last few exchanges (oldest first) so follow-ups like "and how long does it take?" resolve.
      history: history
        .slice(0, 3)
        .reverse()
        .map((turn) => ({ question: turn.query, answer: turn.answer })),
    });
  };

  // Bring the thinking indicator, then the answer, into view. On phones the results
  // start below the fold, and the on-screen keyboard hides them.
  useEffect(() => {
    const target = resultsRef.current;
    if (!target || (!isLoading && !currentResponse && !error)) return;

    if (isLoading && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); // closes the mobile keyboard
    }
    // Short delay so the new content (and the closing keyboard) has settled before measuring.
    const timer = window.setTimeout(() => {
      const { top } = target.getBoundingClientRect();
      const header = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      // Scroll unless the results already sit just below the sticky header.
      if (top < header || top > header + 80) {
        window.scrollTo({ top: window.scrollY + top - header - 12, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isLoading, currentResponse, error, reducedMotion]);

  return (
    <div className="space-y-8">
      {/* Search and Prompt Hero with real database FAQs */}
      <AskAiHero onAsk={handleAsk} isLoading={isLoading} faqs={faqData?.faqs} />

      <div ref={resultsRef} className="space-y-6 empty:hidden">
        {error && !isLoading && (
          <div className="max-w-4xl mx-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in-up">
            {error.message}
          </div>
        )}

        {isLoading && <ThinkingIndicator />}

        {/* Response and the FAQs the AI selected. Keyed so each new answer replays its entrance. */}
        {currentResponse && !isLoading && (
          <div
            key={`${currentResponse.query}-${currentResponse.latencyMs}`}
            className="max-w-4xl mx-auto space-y-6 animate-fade-in-up"
          >
            <AiResponseCard response={currentResponse} />
            <MatchedFaqList sources={currentResponse.sources} faqsConsidered={currentResponse.faqsConsidered} />
          </div>
        )}
      </div>

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
