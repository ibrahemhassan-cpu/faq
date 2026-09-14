import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
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

  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim() || isGeneratingAi) return;
    setIsGeneratingAi(true);
    setAiSuccessMessage(null);

    try {
      // Pass the selected target language to the AI generator
      const generated = await generateFaqWithAi(aiPrompt.trim(), language);
      setQuestion(generated.question);
      setAnswer(generated.answer);

      const isKnownCategory = FAQ_CATEGORIES.includes(generated.category as any);
      if (isKnownCategory) {
        setCategory(generated.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(generated.category);
      }

      setTagsInput(generated.tags.join(', '));
      const langLabel = language === 'ar' ? 'العربية' : 'English';
      setAiSuccessMessage(`✨ Generated strictly in ${langLabel} and auto-filled below!`);
      setAiPrompt('');
    } catch (err) {
      console.error('Failed to auto-generate FAQ', err);
    } finally {
      setIsGeneratingAi(false);
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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900">
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
                AR (العربية)
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* AI FAQ Generator Box */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-950">
            <div className="flex items-center space-x-1.5">
              <Wand2 className="h-4 w-4 text-purple-600" />
              <span>Generate FAQ with AI (توليد السؤال بالذكاء الاصطناعي)</span>
            </div>
            <span className="font-mono text-[10px] bg-purple-200/80 text-purple-800 px-1.5 py-0.5 rounded font-bold">
              Target: {language.toUpperCase()}
            </span>
          </div>

          <p className="text-[11px] text-purple-800/80 leading-tight">
            {language === 'ar'
              ? 'اكتب الفكرة أو الموضوع وسيقوم الذكاء الاصطناعي بصياغة السؤال والإجابة والوسوم باللغة العربية الفصحى تلقائياً:'
              : 'Enter a topic or rough note, and AI will generate and auto-fill the question and answer strictly in English:'}
          </p>

          <div className="flex gap-2 pt-1">
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
              placeholder={
                isArabic
                  ? 'مثال: "سياسة استرجاع المنتجات التالفة خلال 14 يوم" أو "حدود الـ API"'
                  : "e.g. 'Refund policy for damaged goods within 14 days' or 'API limits'..."
              }
              className="bg-white text-xs h-9"
              disabled={isGeneratingAi || isSubmitting}
            />
            <Button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={!aiPrompt.trim() || isGeneratingAi}
              className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white text-xs shrink-0 font-medium shadow-2xs"
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
                {isArabic ? 'السؤال المعتمد' : 'Canonical question'}
              </span>
            </div>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              dir={isArabic ? 'rtl' : 'ltr'}
              placeholder={
                isArabic
                  ? 'مثال: كيف يمكنني استرجاع قيمة الاشتراك؟'
                  : 'e.g. What is your refund policy?'
              }
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Answer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <label>
                Answer / Solution ({language.toUpperCase()}) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                {isArabic ? 'الإجابة المعتمدة' : 'Authoritative solution'}
              </span>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              dir={isArabic ? 'rtl' : 'ltr'}
              placeholder={
                isArabic
                  ? 'اكتب الإجابة الواضحة والدقيقة التي سيعتمد عليها المساعد الذكي للإجابة على المستخدمين...'
                  : 'Provide a clear, authoritative answer that the AI will use to formulate responses...'
              }
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Category (التصنيف)
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
                isArabic
                  ? 'استرجاع، ضمان، فوترة، إلغاء'
                  : 'billing, refund, guarantee, cancellation'
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
              disabled={!question.trim() || !answer.trim() || isSubmitting}
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
