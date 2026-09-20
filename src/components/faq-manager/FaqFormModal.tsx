import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Wand2, CheckCircle2, Languages } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FaqItem, FaqCreateInput, FAQ_CATEGORIES } from '@/types/faq';
import { generateFaqWithAi } from '@/services/aiService';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { VoiceRecordButton } from '@/components/common/VoiceRecordButton';
import { Caret, InputOverlay, SoundBars, TypewriterPlaceholder } from '@/components/common/Motion';
import { usePrefersReducedMotion } from '@/hooks/useTypewriter';

const AR_TOPIC_EXAMPLES = [
  'Describe the topic, or tap the mic and speak...',
  'Refund policy for damaged goods within 14 days',
  'How a customer changes their plan',
  'Delivery times per governorate',
];
const EN_TOPIC_EXAMPLES = [
  'Type a topic or tap the mic and speak...',
  'Refund policy for damaged goods within 14 days',
  'How customers can change their plan',
  'API rate limits per plan',
];

interface FaqFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: FaqCreateInput) => Promise<void>;
  initialData?: FaqItem | null;
  isSubmitting: boolean;
}

export const FaqFormModal: React.FC<FaqFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en'); // Default is 'en'
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // AI Auto-Fill Generator States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Describe the FAQ by voice: the transcript fills the topic box and generation starts.
  const voice = useVoiceRecorder((transcript) => {
    setAiPrompt(transcript);
    void generateFromTopic(transcript);
  });
  const isVoiceBusy = voice.status !== 'idle';

  const [isTypingFill, setIsTypingFill] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
  const generationIdRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();

  const stopTyping = () => {
    if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    setIsTypingFill(false);
  };

  const typeInto = (text: string, setValue: (value: string) => void) =>
    new Promise<void>((resolve) => {
      if (reducedMotion) {
        setValue(text);
        resolve();
        return;
      }
      const tokens = text.split(/(\s+)/);
      let shown = 0;
      const tick = () => {
        shown += 2;
        setValue(tokens.slice(0, shown).join(''));
        if (shown >= tokens.length) {
          typingTimerRef.current = null;
          resolve();
        } else {
          typingTimerRef.current = window.setTimeout(tick, 35);
        }
      };
      tick();
    });

  const topicPlaceholders = language === 'ar' ? AR_TOPIC_EXAMPLES : EN_TOPIC_EXAMPLES;

  useEffect(() => {
    setAiError(null);
    // Abandon any generation still running for the previous open/record.
    generationIdRef.current += 1;
    stopTyping();
    setIsGeneratingAi(false);
    if (!isOpen) voice.cancel();
    if (initialData) {
      setLanguage(initialData.language || 'en');
      setQuestion(initialData.question);
      setAnswer(initialData.answer);
      const isPresetCategory = FAQ_CATEGORIES.includes(initialData.category as any);
      if (isPresetCategory) {
        setCategory(initialData.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(initialData.category);
      }
      setTagsInput(initialData.tags ? initialData.tags.join(', ') : '');
      setIsPublished(initialData.is_published);
      setAiPrompt('');
      setAiSuccessMessage(null);
    } else {
      setLanguage('en'); // Default to English
      setQuestion('');
      setAnswer('');
      setCategory('General');
      setCustomCategory('');
      setTagsInput('');
      setIsPublished(true);
      setAiPrompt('');
      setAiSuccessMessage(null);
    }
  }, [initialData, isOpen]);

  const handleGenerateWithAi = () => generateFromTopic(aiPrompt);

  const generateFromTopic = async (topic: string) => {
    if (!topic.trim() || isGeneratingAi) return;
    const generationId = ++generationIdRef.current;
    setIsGeneratingAi(true);
    setAiSuccessMessage(null);
    setAiError(null);

    try {
      // Pass the selected target language to the AI generator
      const generated = await generateFaqWithAi(topic.trim(), language);
      if (generationId !== generationIdRef.current) return; // modal was closed or reset meanwhile

      // Type the result into the fields so the user watches the FAQ being written.
      setIsTypingFill(true);
      setQuestion('');
      setAnswer('');
      await typeInto(generated.question, setQuestion);
      await typeInto(generated.answer, setAnswer);
      setIsTypingFill(false);

      const isKnownCategory = FAQ_CATEGORIES.includes(generated.category as any);
      if (isKnownCategory) {
        setCategory(generated.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(generated.category);
      }

      setTagsInput(generated.tags.join(', '));
      const langLabel = language === 'ar' ? 'Arabic' : 'English';
      setAiSuccessMessage(`✨ Generated strictly in ${langLabel} and auto-filled below!`);
      setAiPrompt('');
    } catch (err) {
      console.error('Failed to auto-generate FAQ', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate the FAQ.');
    } finally {
      if (generationId === generationIdRef.current) setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    const finalCategory =
      category === 'Other' && customCategory.trim()
        ? customCategory.trim()
        : category;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit({
      question: question.trim(),
      answer: answer.trim(),
      category: finalCategory,
      tags,
      language,
      is_published: isPublished,
    });
  };

  const isArabic = language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              {initialData ? 'Edit FAQ Template' : 'Add New FAQ Template'}
            </DialogTitle>

            {/* Language Selector: EN (Default) vs AR */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Languages className="h-3.5 w-3.5 text-slate-500 ml-1" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN (English)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'ar'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AR (Arabic)
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* AI FAQ Generator Box */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-950">
            <div className="flex items-center space-x-1.5">
              <Wand2 className="h-4 w-4 text-purple-600" />
              <span>Generate FAQ with AI</span>
            </div>
            <span className="font-mono text-[10px] bg-purple-200/80 text-purple-800 px-1.5 py-0.5 rounded font-bold">
              Target: {language.toUpperCase()}
            </span>
          </div>

          <p className="text-[11px] text-purple-800/80 leading-tight">
            {language === 'ar'
              ? 'Enter a topic or rough note, and AI will write the question, answer, and tags in Arabic:'
              : 'Enter a topic or rough note, and AI will write the question, answer, and tags in English:'}
          </p>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-1">
            <div className="relative flex-1 min-w-0 basis-full sm:basis-auto">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateWithAi();
                  }
                }}
                dir={isArabic ? 'rtl' : 'ltr'}
                aria-label="FAQ topic"
                className="bg-white text-xs h-9 disabled:opacity-100"
                disabled={isGeneratingAi || isSubmitting || isVoiceBusy}
              />
              <TypewriterPlaceholder
                key={language}
                phrases={topicPlaceholders}
                visible={!aiPrompt && voice.status === 'idle'}
                className="px-3 text-xs text-slate-400"
              />
              <InputOverlay visible={!aiPrompt && voice.status === 'recording'} className="px-3 gap-2 text-xs text-red-600">
                <SoundBars className="h-3" />
                <span>Listening... ({voice.seconds}s)</span>
              </InputOverlay>
              <InputOverlay visible={!aiPrompt && voice.status === 'transcribing'} className="px-3 text-xs text-purple-600">
                <span>Transcribing...</span>
              </InputOverlay>
            </div>
            <VoiceRecordButton voice={voice} size="sm" disabled={isGeneratingAi || isSubmitting} />
            <Button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={!aiPrompt.trim() || isGeneratingAi || isVoiceBusy}
              className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white text-xs flex-1 sm:flex-none shrink-0 font-medium shadow-2xs"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span>Auto-Fill</span>
                </>
              )}
            </Button>
          </div>

          {(voice.error || aiError) && (
            <p className="text-[11px] text-red-600">{voice.error || aiError}</p>
          )}

          {aiSuccessMessage && (
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Question */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <label>
                Question ({language.toUpperCase()}) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                'Canonical question'
              </span>
            </div>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              dir={isArabic ? 'rtl' : 'ltr'}
              placeholder={
'e.g. What is your refund policy?'
              }
              required
              disabled={isSubmitting}
              readOnly={isTypingFill}
              className={isTypingFill ? 'ring-2 ring-purple-200 transition-shadow' : 'transition-shadow'}
            />
          </div>

          {/* Answer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <label>
                Answer / Solution ({language.toUpperCase()}) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                'Authoritative solution'
              </span>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              dir={isArabic ? 'rtl' : 'ltr'}
              placeholder={
'Provide a clear, authoritative answer that the AI will use to formulate responses...'
              }
              rows={4}
              required
              disabled={isSubmitting}
              readOnly={isTypingFill}
              className={isTypingFill ? 'ring-2 ring-purple-200 transition-shadow' : 'transition-shadow'}
            />
            {isTypingFill && (
              <p className="flex items-center gap-1 text-[11px] text-purple-700">
                <Caret className="h-3 text-purple-500" />
                <span>'AI is writing...'</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-md px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {FAQ_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other (custom)...</option>
              </select>
            </div>

            {category === 'Other' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Custom Category Name
                </label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Legal & Compliance"
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Tags / Keywords (comma separated)
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              dir={isArabic ? 'rtl' : 'ltr'}
              placeholder={
'billing, refund, guarantee, cancellation'
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Auto-embedding note */}
          <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-2.5 text-xs text-blue-900 flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Saving will automatically invoke Google Gemini <span className="font-semibold">gemini-embedding-001</span> to compute a 768-dimensional vector embedding for pgvector.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!question.trim() || !answer.trim() || isSubmitting || isTypingFill}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Embedding & Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Update FAQ' : 'Save FAQ'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
