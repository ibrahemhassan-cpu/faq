import React from 'react';
import { SlidersHorizontal, Cpu, ShieldCheck, Filter, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FAQ_CATEGORIES } from '@/types/faq';
import { AVAILABLE_MODELS } from '@/services/aiService';

interface SearchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  threshold: number;
  onThresholdChange: (val: number) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  matchCount: number;
  onMatchCountChange: (count: number) => void;
  onResetDefaults: () => void;
}

export const SearchSettingsModal: React.FC<SearchSettingsModalProps> = ({
  isOpen,
  onClose,
  threshold,
  onThresholdChange,
  selectedModel,
  onModelChange,
  selectedCategory,
  onCategoryChange,
  matchCount,
  onMatchCountChange,
  onResetDefaults,
}) => {
  const PRESET_THRESHOLDS = [0.50, 0.60, 0.70, 0.80, 0.85];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Vector Search & Model Settings • إعدادات البحث والذكاء الاصطناعي
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Similarity Threshold Slider */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Match Threshold (نسبة تطابق الإجابة)</span>
              </label>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                {Math.round(threshold * 100)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              If the similarity score is below this percentage, the AI will reject the answer and notify you that no confident match exists.
            </p>

            <input
              type="range"
              min="0.40"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_THRESHOLDS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onThresholdChange(val)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${
                    Math.round(threshold * 100) === Math.round(val * 100)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {Math.round(val * 100)}%{val === 0.70 ? ' (Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Cpu className="h-3.5 w-3.5 text-blue-600" />
              <span>AI Answer Generation Model (نموذج الذكاء الاصطناعي)</span>
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedModel === m.id
                      ? 'border-blue-500 bg-blue-50/60 font-medium text-blue-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="modelChoice"
                      value={m.id}
                      checked={selectedModel === m.id}
                      onChange={(e) => onModelChange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{m.label}</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                    {m.badge}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category & Top-K Retrieval */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Filter className="h-3.5 w-3.5 text-blue-600" />
                <span>Scope Category (التصنيف)</span>
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
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Max Context FAQs (Top-K)</span>
                <span className="font-mono text-blue-600">{matchCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={matchCount}
                onChange={(e) => onMatchCountChange(parseInt(e.target.value, 10))}
                className="w-full h-2 mt-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
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
            Reset Defaults (70%)
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5"
          >
            Apply & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
