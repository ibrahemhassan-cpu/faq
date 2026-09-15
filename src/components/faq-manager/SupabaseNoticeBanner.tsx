import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SupabaseNoticeBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const sqlScriptPath = 'supabase/migrations/20260914_init_faq_pgvector.sql';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(sqlScriptPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="hidden sm:flex h-8 w-8 rounded-lg bg-blue-600 text-white items-center justify-center shrink-0 mt-0.5">
            <Database className="h-4 w-4" />
          </div>
          <div className="space-y-1 min-w-0 break-words">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-blue-950 text-sm">
                Supabase pgvector Database Integration Active
              </span>
              <span className="font-mono bg-blue-200/80 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">
                lbqhsninijcscfpnygdq
              </span>
            </div>
            <p className="text-blue-800/90 leading-relaxed">
              To enable native PostgreSQL vector similarity in your Supabase project, execute the migration script in your{' '}
              <a
                href="https://supabase.com/dashboard/project/lbqhsninijcscfpnygdq/sql"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold hover:text-blue-950 inline-flex items-center"
              >
                Supabase SQL Editor <ExternalLink className="h-3 w-3 ml-0.5" />
              </a>
              . The script creates the <code className="bg-blue-100 px-1 rounded">faqs</code> table, enables <code className="bg-blue-100 px-1 rounded">pgvector</code>, and defines the <code className="bg-blue-100 px-1 rounded">match_faqs</code> stored procedure.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPath}
                className="h-7 text-[11px] bg-white text-blue-800 border-blue-300 hover:bg-blue-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-emerald-600" />
                    <span>Path Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    <span>Copy Migration Path<span className="hidden md:inline"> ({sqlScriptPath})</span></span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-700 p-1 shrink-0"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
