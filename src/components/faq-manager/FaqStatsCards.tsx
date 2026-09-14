import React from 'react';
import { HelpCircle, CheckCircle, Cpu, FolderTree } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FaqStats } from '@/types/faq';

interface FaqStatsCardsProps {
  stats?: FaqStats;
}

export const FaqStatsCards: React.FC<FaqStatsCardsProps> = ({ stats }) => {
  const total = stats?.total ?? 0;
  const published = stats?.publishedCount ?? 0;
  const withVectors = stats?.withEmbeddingsCount ?? 0;
  const categoryCount = stats?.categoryCounts ? Object.keys(stats.categoryCounts).length : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-slate-200/80 shadow-2xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total FAQs</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{total}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <HelpCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-2xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Published</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{published}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-2xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Vector Embeddings</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{withVectors}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-2xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{categoryCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderTree className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
