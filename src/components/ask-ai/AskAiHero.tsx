import React, { useState, useMemo } from 'react';
import { Search, Sparkles, SlidersHorizontal, ArrowRight, Loader2, ShieldCheck, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchSettingsModal } from './SearchSettingsModal';
import { FaqItem } from '@/types/faq';

interface AskAiHeroProps {
  onAsk: (
    query: string,
    options?: {
      category?: string;
      threshold?: number;
      matchCount?: number;
      model?: string;
    }
  ) => void;
  isLoading: boolean;
  faqs?: FaqItem[];
}

export const AskAiHero: React.FC<AskAiHeroProps> = ({ onAsk, isLoading, faqs }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [threshold, setThreshold] = useState(0.70); // Strictly 70% default
  const [matchCount, setMatchCount] = useState(4);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  // Dynamically derive real sample questions directly from the actual database
  const suggestedQuestions = useMemo(() => {
    if (!faqs || faqs.length === 0) {
      return [
        { text: "What are your subscription pricing plans?", category: "Billing" },
        { text: "What is your refund and cancellation policy?", category: "Billing" },
        { text: "How do I enable Two-Factor Authentication (2FA)?", category: "Security" },
        { text: "ما هي خطط وباقات الأسعار المتاحة لديكم؟", category: "باقات" },
        { text: "ما هي سياسة الاسترجاع واسترداد الأموال وإلغاء الاشتراك؟", category: "استرجاع" },
        { text: "كيف يمكنني استعادة أو تغيير كلمة مرور حسابي؟", category: "أمان" },
      ];
    }

    const published = faqs.filter((f) => f.is_published);
    const arFaqs = published.filter(
      (f) => f.language === 'ar' || /[\u0600-\u06FF]/.test(f.question)
    );
    const enFaqs = published.filter(
      (f) => f.language === 'en' || !/[\u0600-\u06FF]/.test(f.question)
    );

    const getSample = (list: FaqItem[], count: number, offset: number) => {
      if (list.length === 0) return [];
      const res = [];
      for (let i = 0; i < Math.min(count, list.length); i++) {
        const idx = (i + offset) % list.length;
        res.push({
          text: list[idx].question,
          category: list[idx].category,
        });
      }
      return res;
    };

    const sampleEn = getSample(enFaqs, 3, shuffleOffset * 3);
    const sampleAr = getSample(arFaqs, 3, shuffleOffset * 3);

    return [...sampleEn, ...sampleAr];
  }, [faqs, shuffleOffset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onAsk(query.trim(), {
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      threshold,
      matchCount,
      model: selectedModel,
    });
  };

  const handleSelectSample = (sampleText: string) => {
    setQuery(sampleText);
    onAsk(sampleText, {
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      threshold,
      matchCount,
      model: selectedModel,
    });
  };

  const handleResetDefaults = () => {
    setThreshold(0.70);
    setSelectedModel('gemini-flash-lite-latest');
    setSelectedCategory('All');
    setMatchCount(4);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      {/* Title & Subtitle */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Intelligent Semantic Knowledge Base • البحث الدلالي الذكي</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Ask Any Question About Our Services
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Powered by Supabase <span className="font-semibold text-slate-800">pgvector</span> semantic search and <span className="font-semibold text-slate-800">Google Gemini Flash-Lite</span>. Answers are strictly grounded in our FAQ library with a 70% threshold to prevent hallucinations.
        </p>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative shadow-lg rounded-2xl bg-white p-2 border border-slate-200/90 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        <div className="flex items-center">
          <div className="pl-3 pr-2 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question in English or Arabic (e.g. 'How do I upgrade?' or 'كيف أغير كلمة السر؟')..."
            className="border-0 shadow-none focus-visible:ring-0 text-base h-12 text-slate-900 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <div className="flex items-center space-x-2 pr-1">
            {/* Filter & Settings Trigger Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs px-2.5 h-9 text-slate-600 hover:bg-slate-100 hover:text-blue-600 flex items-center space-x-1.5"
              title="Vector Search & Match Percentage Settings"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
              <span className="font-mono text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                {Math.round(threshold * 100)}%
              </span>
            </Button>

            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="h-10 px-5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask AI</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Active Filter Indicators */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-2">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 text-slate-600 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Strict Match Threshold: <strong className="text-slate-800">{Math.round(threshold * 100)}%</strong></span>
          </span>
          {selectedCategory !== 'All' && (
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Category: {selectedCategory}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="text-blue-600 hover:underline text-[11px]"
        >
          Change Threshold or Model
        </button>
      </div>

      {/* Suggested Questions: Drawn Dynamically from Database */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-400 font-medium">
            Try asking (from your live knowledge base • من قاعدة أسئلتك):
          </span>
          <button
            type="button"
            onClick={() => setShuffleOffset((prev) => prev + 1)}
            className="inline-flex items-center space-x-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
            title="Show other questions from your database"
          >
            <Shuffle className="h-3 w-3" />
            <span>Shuffle / أسئلة أخرى</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(q.text)}
              className="text-xs bg-white hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs text-left"
            >
              {q.text}
            </button>
          ))}

          {/* Explicit Anti-Hallucination Guardrail Test */}
          <button
            onClick={() => handleSelectSample("What is the secret recipe for Italian pizza?")}
            className="text-xs bg-amber-50/70 hover:bg-amber-100/80 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs font-medium"
            title="Test out-of-scope query to verify 70% threshold refusal"
          >
            🛡️ Out-of-Scope Test: "Recipe for Italian pizza"
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SearchSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        threshold={threshold}
        onThresholdChange={setThreshold}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        matchCount={matchCount}
        onMatchCountChange={setMatchCount}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};
