import React from 'react';
import { Bot, Database, Sparkles, HelpCircle, Layers, CheckCircle2, LogOut } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'ask', icon: Sparkles, iconClass: 'text-blue-500', label: 'Ask AI', shortLabel: 'Ask AI', arabic: 'اسأل' },
  { id: 'library', icon: HelpCircle, iconClass: 'text-indigo-500', label: 'FAQ Library', shortLabel: 'Library', arabic: 'المكتبة' },
  { id: 'playground', icon: Layers, iconClass: 'text-purple-500', label: 'Match Inspector', shortLabel: 'Inspector', arabic: 'الفاحص' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { email, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Phones: brand on top, tabs full-width underneath. Tablets and up: one row. */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-x-4 gap-y-2 py-2 md:py-0 md:h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">FAQ AI</span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  POC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block leading-tight">Grounded AI Assistant</p>
            </div>
          </div>

          {/* Service Status (compact dots on phones, badges on large screens) */}
          <div className="flex items-center gap-2 shrink-0 md:order-last">
            <div
              className={`flex items-center gap-1.5 px-2 lg:px-2.5 py-1 rounded-full text-xs font-medium border ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isSupabaseConfigured ? 'Supabase connected' : 'Local mode (browser storage)'}
            >
              <Database className="h-3.5 w-3.5" />
              <span className="hidden lg:inline font-mono text-[11px]">{isSupabaseConfigured ? 'Supabase' : 'Local'}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            </div>

            <div
              className="flex items-center gap-1.5 px-2 lg:px-2.5 py-1 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200"
              title="AI runs server-side; API keys never reach the browser"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span className="hidden lg:inline font-mono text-[11px]">Server AI</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
            </div>

            {email && (
              <button
                type="button"
                onClick={() => void signOut()}
                title={`Signed in as ${email} — sign out`}
                className="flex items-center gap-1.5 px-2 lg:px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors max-w-[9rem]"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden lg:inline truncate">{email}</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="order-last md:order-none w-full md:w-auto grid grid-cols-3 md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-inner">
            {TABS.map(({ id, icon: Icon, iconClass, label, shortLabel, arabic }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap select-none min-w-0 ${
                  activeTab === id
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
                <span className="sm:hidden truncate">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
                <span className="hidden lg:inline text-[11px] text-slate-400 font-normal">| {arabic}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
