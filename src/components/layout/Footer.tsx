import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          FAQ AI POC — Proof of Concept for Intelligent Knowledge Base & Semantic Search
        </p>
        <div className="flex items-center space-x-4">
          <span>React + TypeScript</span>
          <span>•</span>
          <span>Supabase pgvector</span>
          <span>•</span>
          <span>Google Gemini</span>
        </div>
      </div>
    </footer>
  );
};
