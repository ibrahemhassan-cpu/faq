import React from 'react';
import { History, ArrowUpRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AskAiResponse } from '@/types/search';

interface QueryHistoryListProps {
  history: AskAiResponse[];
  onSelectQuery: (query: string) => void;
  onClear: () => void;
}

export const QueryHistoryList: React.FC<QueryHistoryListProps> = ({
  history,
  onSelectQuery,
  onClear,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
          <History className="h-3.5 w-3.5" />
          <span>Recent Questions in this Session ({history.length})</span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-red-600 h-7 px-2"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuery(item.query)}
            className="group flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span className="truncate max-w-[200px]">{item.query}</span>
            <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};
