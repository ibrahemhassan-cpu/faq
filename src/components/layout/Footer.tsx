import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-10 sm:mt-16 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>
          FAQ AI POC — AI-Powered Knowledge Base Assistant
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>React + TypeScript</span>
          <span>•</span>
          <span>Supabase</span>
          <span>•</span>
          <span>Gemini & NVIDIA</span>
        </div>
      </div>
    </footer>
  );
};
