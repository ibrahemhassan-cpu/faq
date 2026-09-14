import React, { useState } from 'react';
import { Layers, Search, Zap, ArrowRight, Loader2, Sparkles, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchFaqsSemantically } from '@/services/searchService';
import { MatchedFaq } from '@/types/search';

const PRESET_PARAPHRASES = [
  {
    original: "What are your subscription pricing plans?",
    variations: [
      "How much does it cost?",
      "What are the fees for your tool?",
      "Can you give me the pricing breakdown?",
      "كم تكلفة الخدمة وما هي الأسعار؟",
    ],
  },
  {
    original: "What is your refund and cancellation policy?",
    variations: [
      "Can I get my money back?",
      "If I don't like it, do I get a refund?",
      "How do I cancel my account and get refunded?",
      "هل يمكن استرداد أموالي إذا ألغيت الاشتراك؟",
    ],
  },
  {
    original: "How do I enable Two-Factor Authentication (2FA)?",
    variations: [
      "How to turn on 2FA security?",
      "Where do I set up authenticator app codes?",
      "How to protect my login with OTP?",
      "كيف أفعل التحقق بخطوتين لحسابي؟",
    ],
  },
];

export const VectorPlayground: React.FC = () => {
  const [testQuery, setTestQuery] = useState('How much does it cost?');
  const [matches, setMatches] = useState<MatchedFaq[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleRunTest = async (queryToTest: string) => {
    if (!queryToTest.trim() || isLoading) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await searchFaqsSemantically({
        query: queryToTest.trim(),
        matchThreshold: 0.30, // Lower threshold to visualize ranking differences
        matchCount: 6,
      });
      setMatches(res.matches);
      setLatency(res.executionTimeMs);
    } catch (err) {
      console.error('Vector test failed', err);
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
          <span>pgvector Cosine Similarity Inspector</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Semantic Search & Paraphrase Testing
        </h2>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto">
          Test how different user phrasings, synonyms, and languages map to the exact same FAQ template via 768-dimensional vector embeddings without requiring keyword matches!
        </p>
      </div>

      {/* Preset Paraphrase Demonstration Card */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center space-x-1.5 text-slate-800">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Click any paraphrase to test real-time vector matching:</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PRESET_PARAPHRASES.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Canonical FAQ: &ldquo;{group.original}&rdquo;</span>
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
                  <span>Computing Vectors...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1.5" />
                  <span>Inspect Similarity</span>
                </>
              )}
            </Button>
          </div>

          {/* Results Display */}
          {hasSearched && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  <span>Vector Match Results ({matches.length})</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {latency}ms
                </Badge>
              </div>

              {matches.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No matching FAQs found for this query above the 30% baseline.
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map((item, idx) => {
                    const pct = Math.round(item.similarity * 100);
                    const isHighConfidence = pct >= 65;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <Badge variant="outline" className="text-[11px]">
                              {item.category}
                            </Badge>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                              {item.question}
                            </h4>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span
                              className={`text-xs font-mono font-bold ${
                                isHighConfidence ? 'text-emerald-600' : 'text-slate-600'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Similarity Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHighConfidence
                                ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {item.answer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
