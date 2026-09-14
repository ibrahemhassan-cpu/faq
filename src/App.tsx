import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AskAiPage } from '@/pages/AskAiPage';
import { FaqLibraryPage } from '@/pages/FaqLibraryPage';
import { PlaygroundPage } from '@/pages/PlaygroundPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ask' | 'library' | 'playground'>('ask');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-slate-50/70">
        {/* Navigation Bar */}
        <Navbar activeTab={activeTab} onTabChange={(tab: any) => setActiveTab(tab)} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'ask' && <AskAiPage />}
          {activeTab === 'library' && <FaqLibraryPage />}
          {activeTab === 'playground' && <PlaygroundPage />}
        </main>

        {/* Global Toast Notifications */}
        <Toaster position="top-right" richColors />

        {/* Footer */}
        <Footer />
      </div>
    </QueryClientProvider>
  );
};

export default App;
