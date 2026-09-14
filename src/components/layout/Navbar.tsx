import React from 'react';
import { Bot, Database, Sparkles, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isGeminiConfigured } from '@/lib/gemini';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">
                  FAQ AI
                </span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  POC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block leading-tight">
                Grounded AI & pgvector
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Clean, Single-Line, No Wrapping */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => onTabChange('ask')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap select-none ${
                activeTab === 'ask'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Ask AI</span>
              <span className="hidden md:inline text-[11px] text-slate-400 font-normal">| اسأل</span>
            </button>

            <button
              onClick={() => onTabChange('library')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap select-none ${
                activeTab === 'library'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>FAQ Library</span>
              <span className="hidden md:inline text-[11px] text-slate-400 font-normal">| المكتبة</span>
            </button>

            <button
              onClick={() => onTabChange('playground')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap select-none ${
                activeTab === 'playground'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="h-4 w-4 text-purple-500 shrink-0" />
              <span>Vector Inspector</span>
              <span className="hidden md:inline text-[11px] text-slate-400 font-normal">| الفاحص</span>
            </button>
          </nav>

          {/* Service Status Badges */}
          <div className="hidden sm:flex items-center space-x-2 shrink-0">
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title="Supabase pgvector (vector 768)"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px]">pgvector</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isGeminiConfigured
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title="Gemini Flash-Lite"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span className="font-mono text-[11px]">Flash-Lite</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
