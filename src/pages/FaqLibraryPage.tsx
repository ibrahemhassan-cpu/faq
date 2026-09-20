import React, { useState, useMemo } from 'react';
import { FaqStatsCards } from '@/components/faq-manager/FaqStatsCards';
import { SupabaseNoticeBanner } from '@/components/faq-manager/SupabaseNoticeBanner';
import { FaqToolbar } from '@/components/faq-manager/FaqToolbar';
import { FilterModal, FaqFilterOptions } from '@/components/faq-manager/FilterModal';
import { FaqTable } from '@/components/faq-manager/FaqTable';
import { FaqFormModal } from '@/components/faq-manager/FaqFormModal';
import { FaqDeleteDialog } from '@/components/faq-manager/FaqDeleteDialog';
import { FaqImportModal } from '@/components/faq-manager/FaqImportModal';
import {
  useFaqs,
  useFaqStats,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  useSeedFaqs,
} from '@/hooks/useFaqs';
import { FaqItem, FaqCreateInput } from '@/types/faq';

export const FaqLibraryPage: React.FC = () => {
  const [search, setSearch] = useState('');

  // Comprehensive Filter options
  const [filters, setFilters] = useState<FaqFilterOptions>({
    category: 'All',
    vectorStatus: 'all',
    publishedStatus: 'all',
    sortBy: 'newest',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<FaqItem | null>(null);
  const [seedProgress, setSeedProgress] = useState<{ current: number; total: number } | null>(null);

  // Queries & Mutations
  const { data: faqData, isLoading: isFaqsLoading } = useFaqs(
    filters.category !== 'All' ? filters.category : undefined,
    search
  );
  const { data: stats } = useFaqStats();
  // Unfiltered list, so the importer can flag duplicates against the whole library.
  const { data: allFaqsData } = useFaqs();
  const existingQuestions = useMemo(
    () => Array.from(new Set((allFaqsData?.faqs ?? []).map((f) => f.question.trim()))),
    [allFaqsData?.faqs]
  );
  const createMutation = useCreateFaq();
  const updateMutation = useUpdateFaq();
  const deleteMutation = useDeleteFaq();
  const seedMutation = useSeedFaqs();

  // Filter and Sort in-memory for immediate UI reactivity
  const filteredAndSortedFaqs = useMemo(() => {
    let list = faqData?.faqs || [];

    // Filter by vectorStatus
    if (filters.vectorStatus === 'synced') {
      list = list.filter((f) => f.embedding && f.embedding.length > 0);
    } else if (filters.vectorStatus === 'pending') {
      list = list.filter((f) => !f.embedding || f.embedding.length === 0);
    }

    // Filter by publishedStatus
    if (filters.publishedStatus === 'published') {
      list = list.filter((f) => f.is_published);
    } else if (filters.publishedStatus === 'draft') {
      list = list.filter((f) => !f.is_published);
    }

    // Sort
    const sorted = [...list];
    if (filters.sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filters.sortBy === 'alpha') {
      sorted.sort((a, b) => a.question.localeCompare(b.question));
    }

    return sorted;
  }, [faqData?.faqs, filters]);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (faq: FaqItem) => {
    setDeletingFaq(faq);
  };

  const handleFormSubmit = async (input: FaqCreateInput) => {
    if (editingFaq) {
      await updateMutation.mutateAsync({ id: editingFaq.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    setIsFormOpen(false);
    setEditingFaq(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFaq) return;
    await deleteMutation.mutateAsync(deletingFaq.id);
    setDeletingFaq(null);
  };

  const handleSeed = async () => {
    setSeedProgress({ current: 0, total: 20 });
    try {
      await seedMutation.mutateAsync((curr, total) => {
        setSeedProgress({ current: curr, total });
      });
    } finally {
      setTimeout(() => setSeedProgress(null), 1500);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'All',
      vectorStatus: 'all',
      publishedStatus: 'all',
      sortBy: 'newest',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            FAQ Knowledge Base Library
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage templates, AI vector embeddings & categories
          </p>
        </div>
      </div>

      {/* Database Connection Notice */}
      <SupabaseNoticeBanner />

      {/* Statistics Cards */}
      <FaqStatsCards stats={stats} />

      {/* Toolbar & Filters Modal Trigger */}
      <FaqToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onOpenFiltersModal={() => setIsFilterModalOpen(true)}
        onClearCategory={() => setFilters({ ...filters, category: 'All' })}
        onOpenCreate={handleOpenCreate}
        onOpenImport={() => setIsImportOpen(true)}
        onSeed={handleSeed}
        isSeeding={seedMutation.isPending}
        seedProgress={seedProgress}
      />

      {/* FAQ Items Table with 10-by-10 Infinite Scroll */}
      <FaqTable
        faqs={filteredAndSortedFaqs}
        isLoading={isFaqsLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
        totalResultsCount={filteredAndSortedFaqs.length}
      />

      {/* Create / Edit Modal (with AI FAQ Auto-Fill) */}
      <FaqFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingFaq}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Import FAQs from a document with AI */}
      <FaqImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        existingQuestions={existingQuestions}
      />

      {/* Delete Confirmation Dialog */}
      <FaqDeleteDialog
        isOpen={Boolean(deletingFaq)}
        onClose={() => setDeletingFaq(null)}
        onConfirm={handleDeleteConfirm}
        faq={deletingFaq}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
