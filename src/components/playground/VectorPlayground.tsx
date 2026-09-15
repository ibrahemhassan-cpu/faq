import React, { useState } from 'react';
import { Layers, Search, Zap, ArrowRight, Loader2, Sparkles, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { askAiWithKnowledgeBase } from '@/services/aiService';
import { AskAiResponse, MatchRelevance } from '@/types/search';

const PRESET_PARAPHRASES = [
  {
    original: "What is your refund and cancellation policy?",
    variations: [
      "I bought a plan by mistake yesterday",
      "الحاجات اللي جبتها بايظة أعمل ايه؟",
      "3ayez flousy tany",
      "بيخصم مني فلوس كل شهر ومش عايز الخدمة دي",
    ],
  },
  {
    original: "How do I reset my account password?",
    variations: [
      "I'm locked out and can't remember anything",
      "مش عارف ادخل على حسابي خالص",
      "nesit el password",
    ],
  },
  {
    original: "Can I connect the FAQ knowledge base to Slack or Microsoft Teams?",
    variations: [
      "can our company chat bot answer from this",
      "عايز الموظفين يسألوا البوت جوه الشات بتاعنا",
    ],
  },
];

const RELEVANCE_COLORS: Record<MatchRelevance, string> = {
  direct: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  partial: 'text-blue-700 bg-blue-50 border-blue-100',
  related: 'text-slate-600 bg-slate-50 border-slate-200',
};

export const VectorPlayground: React.FC = () => {
  const [testQuery, setTestQuery] = useState("I bought a plan by mistake yesterday");
  const [result, setResult] = useState<AskAiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRunTest = async (queryToTest: string) => {
    if (!queryToTest.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      setResult(await askAiWithKnowledgeBase({ query: queryToTest.trim() }));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Match test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
          <Layers className="h-3.5 w-3.5 text-purple-600" />
          <span>AI Match Inspector</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          How Well Does the AI Understand Customers?
        </h2>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto">
          Test indirect phrasings, slang, dialects, and Franco-Arabic. See what the AI understood, which FAQs it picked, and why, with no shared keywords required.
        </p>
      </div>

      {/* Preset Paraphrase Demonstration Card */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center space-x-1.5 text-slate-800">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Click any phrasing to test it:</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PRESET_PARAPHRASES.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Expected FAQ: &ldquo;{group.original}&rdquo;</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {group.variations.map((v, vIdx) => (
                  <button
                    key={vIdx}
                    onClick={() => {
                      setTestQuery(v);
                      handleRunTest(v);
                    }}
                    className="text-xs bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 px-3 py-1 rounded-lg transition-all text-left flex items-center space-x-1"
                  >
                    <span>&ldquo;{v}&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-40 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Test Query Input */}
      <Card className="border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Type any test query or phrasing..."
                className="pl-9 h-11 text-sm bg-slate-50/50"
              />
            </div>
            <Button
              onClick={() => handleRunTest(testQuery)}
              disabled={!testQuery.trim() || isLoading}
              className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Reading FAQs...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1.5" />
                  <span>Inspect Match</span>
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span>
                    {result.sources.length} of {result.faqsConsidered} FAQs selected • {result.confidence} confidence
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{result.modelUsed}</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">{result.latencyMs}ms</Badge>
                </div>
              </div>

              {result.intent && (
                <p dir="auto" className="text-xs text-indigo-900 bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-2">
                  {result.intent}
                </p>
              )}

              {result.sources.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  The AI found no FAQ that helps with this message.
                </p>
              ) : (
                <div className="space-y-3">
                  {result.sources.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${RELEVANCE_COLORS[item.relevance]}`}>
                          {item.relevance}
                        </span>
                        <Badge variant="outline" className="text-[11px]">
                          {item.category}
                        </Badge>
                        <h4 dir="auto" className="text-xs sm:text-sm font-semibold text-slate-900">
                          {item.question}
                        </h4>
                      </div>
                      {item.reason && (
                        <p dir="auto" className="text-xs text-slate-500">{item.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
