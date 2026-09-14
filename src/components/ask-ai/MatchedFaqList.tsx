import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchedFaq } from '@/types/search';

interface MatchedFaqListProps {
  sources: MatchedFaq[];
}

export const MatchedFaqList: React.FC<MatchedFaqListProps> = ({ sources }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  if (!sources || sources.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Retrieved Knowledge Sources ({sources.length})</span>
        </h3>
        <span className="text-xs text-slate-500">
          Ranked by pgvector cosine similarity
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sources.map((item, idx) => {
          const isExpanded = expandedIds[item.id] ?? (idx === 0);
          const similarityPct = Math.round(item.similarity * 100);

          return (
            <Card
              key={item.id}
              className="border-slate-200/80 bg-white transition-all hover:border-blue-300 hover:shadow-2xs overflow-hidden"
            >
              {/* Click anywhere on the entire row/header to expand/collapse */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-4 cursor-pointer select-none flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                title="Click anywhere to toggle answer"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      {item.category}
                    </Badge>
                    {/* Similarity Meter */}
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                      <span>{similarityPct}% Similarity</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 pt-1">
                    {item.question}
                  </h4>
                </div>

                <div className="p-1 rounded text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <CardContent className="px-4 pb-4 pt-0 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2 mt-2">
                  <p className="whitespace-pre-line pt-2">{item.answer}</p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/80 mt-2">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
