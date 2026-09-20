import React from 'react';
import { Filter, Check, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FAQ_CATEGORIES } from '@/types/faq';

export interface FaqFilterOptions {
  category: string;
  vectorStatus: 'all' | 'synced' | 'pending';
  publishedStatus: 'all' | 'published' | 'draft';
  sortBy: 'newest' | 'oldest' | 'alpha';
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FaqFilterOptions;
  onFiltersChange: (newFilters: FaqFilterOptions) => void;
  onReset: () => void;
  totalResultsCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onReset,
  totalResultsCount,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Filter className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Filter FAQ Knowledge Base
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, category: cat })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    filters.category === cat
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {filters.category === cat && <Check className="h-3 w-3 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Vector Embedding Status */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Vector embedding status</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All FAQs' },
                { id: 'synced', label: 'Vector Synced' },
                { id: 'pending', label: 'Pending Vector' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, vectorStatus: item.id as any })}
                  className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                    filters.vectorStatus === item.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Publication Status */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Publish status</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'published', label: 'Published' },
                { id: 'draft', label: 'Drafts' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, publishedStatus: item.id as any })}
                  className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                    filters.publishedStatus === item.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Sort order</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
              className="w-full h-9 bg-white border border-slate-200 rounded-md px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="alpha">Alphabetical A-Z</option>
            </select>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4"
          >
            View ({totalResultsCount}) FAQs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
