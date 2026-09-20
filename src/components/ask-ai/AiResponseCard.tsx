import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  HelpCircle,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AskAiResponse } from '@/types/search';
import { useRevealText } from '@/hooks/useTypewriter';
import { Caret } from '@/components/common/Motion';

interface AiResponseCardProps {
  response: AskAiResponse;
}

const CONFIDENCE_LABELS: Record<AskAiResponse['confidence'], string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const ARABIC_SCRIPT = /[؀-ۿ]/;

export const AiResponseCard: React.FC<AiResponseCardProps> = ({ response }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isArabic = ARABIC_SCRIPT.test(response.answer);
  // The answer appears as if it is being typed; clicking it shows the rest immediately.
  const answerReveal = useRevealText(response.answer);

  return (
    <Card className="border-blue-100 shadow-md bg-gradient-to-b from-white to-slate-50/50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-white/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base text-slate-900 font-bold">
              AI Generated Response
            </CardTitle>
            <p className="text-xs text-slate-500 break-words" dir="auto">
              Query: &ldquo;{response.query}&rdquo;
            </p>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px] text-blue-700 bg-blue-50/50 border-blue-200">
            {response.modelUsed}
          </Badge>

          {response.hasRelevantMatch ? (
            <Badge
              variant={response.confidence === 'low' ? 'warning' : 'success'}
              className="flex items-center space-x-1 py-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Grounded on FAQ • {CONFIDENCE_LABELS[response.confidence]}</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center space-x-1 py-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Not in Knowledge Base (Protected)</span>
            </Badge>
          )}

          <Badge variant="secondary" className="flex items-center space-x-1 text-slate-500 py-1">
            <Clock className="h-3 w-3" />
            <span>{response.latencyMs}ms</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* What the AI understood the customer needs */}
        {response.intent && (
          <div
            dir={ARABIC_SCRIPT.test(response.intent) ? 'rtl' : 'ltr'}
            className="flex items-start gap-2 rounded-lg bg-indigo-50/70 border border-indigo-100 px-3 py-2 text-xs text-indigo-900"
          >
            <Brain className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-600" />
            <span>
              <span className="font-semibold">Understood need:{' '}</span>
              {response.intent}
            </span>
          </div>
        )}

        {/* Answer Text */}
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className={`text-slate-800 leading-relaxed whitespace-pre-line text-sm sm:text-base ${
            isArabic ? 'text-right font-sans' : 'text-left'
          }`}
        >
          <span onClick={answerReveal.skip} className={answerReveal.isRevealing ? 'cursor-pointer' : undefined}>
            {answerReveal.visible}
          </span>
          {answerReveal.isRevealing && <Caret className="text-blue-500" />}
        </div>

        {response.followUpQuestion && !answerReveal.isRevealing && (
          <div
            dir={ARABIC_SCRIPT.test(response.followUpQuestion) ? 'rtl' : 'ltr'}
            className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 animate-fade-in-up"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>{response.followUpQuestion}</span>
          </div>
        )}

        {/* Card Footer Actions & Feedback */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs text-slate-600 hover:text-slate-900"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  <span>Copy Answer</span>
                </>
              )}
            </Button>
            <span className="text-slate-300">|</span>
            <span className="flex items-center space-x-1">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {response.sources.length} of {response.faqsConsidered} FAQs selected
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Was this accurate?</span>
            <button
              onClick={() => setFeedback('up')}
              className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setFeedback('down')}
              className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                feedback === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-400'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
