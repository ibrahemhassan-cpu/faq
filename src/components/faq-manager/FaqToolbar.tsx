import React from 'react';
import { Search, Plus, Sparkles, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FaqFilterOptions } from './FilterModal';

interface FaqToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FaqFilterOptions;
  onOpenFiltersModal: () => void;
  onClearCategory: () => void;
  onOpenCreate: () => void;
  onSeed: () => void;
  isSeeding: boolean;
  seedProgress: { current: number; total: number } | null;
}

export const FaqToolbar: React.FC<FaqToolbarProps> = ({
  search,
  onSearchChange,
  filters,
  onOpenFiltersModal,
  onClearCategory,
  onOpenCreate,
  onSeed,
  isSeeding,
  seedProgress,
}) => {
  const activeFiltersCount =
    (filters.category !== 'All' ? 1 : 0) +
    (filters.vectorStatus !== 'all' ? 1 : 0) +
    (filters.publishedStatus !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'newest' ? 1 : 0);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Search and Filters Trigger */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search FAQs by question, answer, or tag..."
            className="pl-9 h-10 bg-white"
          />
        </div>

        {/* Filter Modal Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenFiltersModal}
          className="h-10 bg-white text-slate-700 hover:bg-slate-50 border-slate-200 flex items-center space-x-1.5 text-xs sm:text-sm"
        >
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Active Category Tag with Clear button */}
        {filters.category !== 'All' && (
          <span className="inline-flex items-center space-x-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs px-2.5 py-1.5 rounded-lg">
            <span>{filters.category}</span>
            <button onClick={onClearCategory} className="hover:text-indigo-950">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={onSeed}
          disabled={isSeeding}
          className="h-10 text-xs sm:text-sm bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
          title="Populate knowledge base with 25+ curated templates"
        >
          {isSeeding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
              <span>
                Embedding {seedProgress ? `${seedProgress.current}/${seedProgress.total}` : '...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1.5 text-blue-600" />
              <span>Seed 25+ FAQs</span>
            </>
          )}
        </Button>

        <Button
          onClick={onOpenCreate}
          className="h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add New FAQ</span>
        </Button>
      </div>
    </div>
  );
};
