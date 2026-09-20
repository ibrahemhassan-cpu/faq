import React, { useState, useMemo } from 'react';
import { Search, Sparkles, ArrowRight, Loader2, ShieldCheck, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchSettingsModal } from './SearchSettingsModal';
import { ModelMenu } from './ModelMenu';
import { FaqItem } from '@/types/faq';
import { DEFAULT_MODEL } from '@/services/aiService';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { VoiceRecordButton } from '@/components/common/VoiceRecordButton';
import { InputOverlay, SoundBars, TypewriterPlaceholder } from '@/components/common/Motion';

const PLACEHOLDER_PHRASES = [
  'Type your question, or tap the mic and speak...',
  'My order arrived damaged, what do I do?',
  'How do I cancel my subscription?',
  "I forgot my password and can't sign in",
  'Can I connect this to Slack?',
  'My order is late, when will it arrive?',
];

// Real customers rarely phrase questions like the FAQ titles.
const NATURAL_LANGUAGE_EXAMPLES = [
  'الحاجات اللي جبتها بايظة أعمل ايه؟',
  "I can't get into my account at all",
  'I got charged but I want to stop using it',
];

interface AskAiHeroProps {
  onAsk: (query: string, options?: { category?: string; model?: string }) => void;
  isLoading: boolean;
  faqs?: FaqItem[];
}

export const AskAiHero: React.FC<AskAiHeroProps> = ({ onAsk, isLoading, faqs }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  // Dynamically derive real sample questions directly from the actual database
  const suggestedQuestions = useMemo(() => {
    if (!faqs || faqs.length === 0) {
      return [
        { text: "What are your subscription pricing plans?", category: "Billing" },
        { text: "What is your refund and cancellation policy?", category: "Billing" },
        { text: "How do I enable Two-Factor Authentication (2FA)?", category: "Security" },
        { text: "Which payment methods do you accept?", category: "Billing" },
        { text: "What are the API rate limits?", category: "API" },
        { text: "Where is user data hosted and how is it secured?", category: "Security" },
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
      model: selectedModel,
    });
  };

  const handleSelectSample = (sampleText: string) => {
    if (isLoading) return;
    setQuery(sampleText);
    onAsk(sampleText, {
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      model: selectedModel,
    });
  };

  const handleResetDefaults = () => {
    setSelectedModel(DEFAULT_MODEL);
    setSelectedCategory('All');
  };

  // Voice question: show the transcript in the box (so the user sees what was heard) and ask right away.
  const voice = useVoiceRecorder((transcript) => handleSelectSample(transcript));
  const isRecording = voice.status === 'recording';
  const isTranscribing = voice.status === 'transcribing';
  const isBusy = isLoading || isRecording || isTranscribing;

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6">
      {/* Title & Subtitle */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 max-w-full">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>AI-Powered Knowledge Base</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 text-balance">
          Ask Any Question About Our Services
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Describe your situation in your own words, in any language or dialect. The AI reads the <span className="font-semibold text-slate-800">entire FAQ library</span>, works out what you need, and answers only from verified FAQs.
        </p>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative shadow-lg rounded-2xl bg-white p-2 border border-slate-200/90 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        {/* Phones: input on its own row, actions underneath. Wider screens: one row. */}
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="flex items-center flex-1 min-w-0">
          <div className="pl-2 sm:pl-3 pr-1 sm:pr-2 text-slate-400 shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <div className="relative flex-1 min-w-0">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Ask a question by typing or with the mic"
              className="border-0 shadow-none focus-visible:ring-0 text-base h-12 text-slate-900 disabled:opacity-100"
              disabled={isBusy}
              dir="auto"
            />
            {/* Animated placeholder: typed examples, or live recording status */}
            <TypewriterPlaceholder
              phrases={PLACEHOLDER_PHRASES}
              visible={!query && voice.status === 'idle'}
              className="px-3 text-base text-slate-400"
            />
            <InputOverlay visible={!query && isRecording} className="px-3 gap-2 text-base text-red-600">
              <SoundBars />
              <span className="truncate">Listening...</span>
              <span className="font-mono text-xs text-red-400 shrink-0">
                {voice.seconds}s<span className="hidden sm:inline"> / {voice.maxSeconds}s</span>
              </span>
            </InputOverlay>
            <InputOverlay visible={!query && isTranscribing} className="px-3 text-base text-blue-600">
              <span>Transcribing</span>
              <span className="inline-flex">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse [animation-delay:200ms]">.</span>
                <span className="animate-pulse [animation-delay:400ms]">.</span>
              </span>
            </InputOverlay>
          </div>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0 px-1 sm:pl-0 sm:pr-1">
            {/* Voice question */}
            <VoiceRecordButton voice={voice} disabled={isLoading} />

            {/* Model picker, with Settings at the top of the menu */}
            <ModelMenu
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onOpenSettings={() => setIsSettingsOpen(true)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              disabled={!query.trim() || isBusy}
              className="group h-10 px-5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm ml-auto flex-1 sm:flex-none min-w-[7rem]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask AI</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {voice.error && (
        <p className="mt-2 px-2 text-xs text-red-600">{voice.error}</p>
      )}

      {/* Active Filter Indicators */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 px-2">
        <span className="flex items-center gap-1 text-slate-600 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Answers only from your FAQs</span>
        </span>
        {selectedCategory !== 'All' && (
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 transition-colors"
            title="Change category"
          >
            Category: {selectedCategory}
          </button>
        )}
      </div>

      {/* Natural-language examples that do not share keywords with the FAQ titles */}
      <div className="mt-5 space-y-2">
        <span className="block px-1 text-xs text-slate-400 font-medium">
          Try it like a real customer:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {NATURAL_LANGUAGE_EXAMPLES.map((text) => (
            <button
              key={text}
              onClick={() => handleSelectSample(text)}
              dir="auto"
              className="text-xs text-start max-w-full break-words bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Questions: Drawn Dynamically from Database */}
      <div className="mt-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <span className="text-xs text-slate-400 font-medium">
            Try asking (from your live knowledge base):
          </span>
          <button
            type="button"
            onClick={() => setShuffleOffset((prev) => prev + 1)}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors whitespace-nowrap"
            title="Show other questions from your database"
          >
            <Shuffle className="h-3 w-3" />
            <span>Shuffle</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(q.text)}
              dir="auto"
              className="text-xs text-start max-w-full break-words bg-white hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            >
              {q.text}
            </button>
          ))}

          {/* Explicit Anti-Hallucination Guardrail Test */}
          <button
            onClick={() => handleSelectSample("What is the secret recipe for Italian pizza?")}
            className="text-xs text-start max-w-full bg-amber-50/70 hover:bg-amber-100/80 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs font-medium"
            title="Test that the AI refuses questions the FAQs don't cover"
          >
            🛡️ Out-of-Scope Test: "Recipe for Italian pizza"
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SearchSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};
