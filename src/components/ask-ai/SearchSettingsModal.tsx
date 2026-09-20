import React from 'react';
import { Settings2, ShieldCheck, Filter, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FAQ_CATEGORIES } from '@/types/faq';

interface SearchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onResetDefaults: () => void;
}

/** Everything except the model, which is picked from the menu next to the question box. */
export const SearchSettingsModal: React.FC<SearchSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onCategoryChange,
  onResetDefaults,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Settings2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Settings
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-[11px] text-slate-600 leading-normal">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              The AI reads every published FAQ, decides which ones answer your need, and rates its own confidence.
              Every FAQ it cites is checked against the database, and it refuses questions the FAQs don't cover.
              Pick the AI model from the menu next to the question box.
            </p>
          </div>

          {/* Category scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span>Scope category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full h-9 bg-white border border-slate-200 rounded-md px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">Limit answers to one category, or search all FAQs.</p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetDefaults}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Defaults
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
