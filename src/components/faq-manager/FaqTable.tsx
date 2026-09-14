import React, { useState, useEffect, useRef } from 'react';
import {
  Edit,
  Trash2,
  Cpu,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaqItem } from '@/types/faq';
import { formatRelativeTime } from '@/lib/utils';

interface FaqTableProps {
  faqs: FaqItem[];
  isLoading: boolean;
  onEdit: (faq: FaqItem) => void;
  onDelete: (faq: FaqItem) => void;
}

const PAGE_SIZE = 10;

export const FaqTable: React.FC<FaqTableProps> = ({
  faqs,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination when the underlying list or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [faqs.length]);

  const totalCount = faqs.length;
  const displayedCount = Math.min(visibleCount, totalCount);
  const displayedFaqs = faqs.slice(0, displayedCount);
  const hasMore = displayedCount < totalCount;

  // Infinite Scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, totalCount));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.2, rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoadingMore, totalCount]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-slate-100 animate-pulse border border-slate-200/60"
          />
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No FAQs Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          No FAQs match your search or filter. Try clearing filters or clicking &ldquo;Seed 25+ FAQs&rdquo;.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleManualLoadMore = () => {
    if (!hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, totalCount));
      setIsLoadingMore(false);
    }, 200);
  };

  const progressPercentage = Math.round((displayedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      {/* Showing X of Y Counter & Progress Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">
              Showing {displayedCount} of {totalCount} FAQs
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">
              (عرض {displayedCount} من إجمالي {totalCount} سؤال)
            </span>
          </div>
          <span className="font-mono text-blue-600 font-bold">
            {progressPercentage}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* FAQ Items List (10 by 10) */}
      <div className="space-y-3">
        {displayedFaqs.map((faq, idx) => {
          const isExpanded = expandedId === faq.id;
          const hasEmbedding = Boolean(faq.embedding && faq.embedding.length > 0);

          return (
            <Card
              key={faq.id}
              className="border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* FAQ Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        #{idx + 1}
                      </span>

                      <Badge variant="secondary" className="text-xs font-semibold">
                        {faq.category}
                      </Badge>

                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {faq.language ? faq.language.toUpperCase() : /[\u0600-\u06FF]/.test(faq.question) ? 'AR' : 'EN'}
                      </span>

                      {hasEmbedding ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          <Cpu className="h-3 w-3 text-purple-600" />
                          <span>Vector Synced (768d)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <span>Pending Vector</span>
                        </span>
                      )}

                      {faq.is_published ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Draft</span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        • {formatRelativeTime(faq.updated_at || faq.created_at)}
                      </span>
                    </div>

                    <h3
                      onClick={() => toggleExpand(faq.id)}
                      className="text-base font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {faq.question}
                    </h3>

                    <p
                      className={`text-sm text-slate-600 leading-relaxed whitespace-pre-line ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {faq.answer}
                    </p>

                    {/* Tags */}
                    {faq.tags && faq.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {faq.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0 self-end sm:self-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(faq.id)}
                      className="h-8 px-2 text-slate-500 hover:text-slate-900"
                      title={isExpanded ? 'Collapse' : 'Expand full answer'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(faq)}
                      className="h-8 px-2 text-slate-600 hover:text-blue-600"
                      title="Edit FAQ"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(faq)}
                      className="h-8 px-2 text-slate-400 hover:text-red-600"
                      title="Delete FAQ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel and Load More Trigger */}
      <div ref={sentinelRef} className="py-4 text-center">
        {isLoadingMore ? (
          <div className="inline-flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading 10 more FAQs...</span>
          </div>
        ) : hasMore ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleManualLoadMore}
            className="text-xs text-slate-600 bg-white hover:bg-slate-50 border-slate-200"
          >
            <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
            Load More (10 by 10)
          </Button>
        ) : totalCount > PAGE_SIZE ? (
          <p className="text-xs text-slate-400">
            ✓ All {totalCount} FAQs loaded • تم عرض جميع الأسئلة
          </p>
        ) : null}
      </div>
    </div>
  );
};
