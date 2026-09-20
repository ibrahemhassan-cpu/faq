import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Pencil,
  Quote,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImportedFaqDraft } from '@/types/faq';
import { extractFaqsFromFile, IMPORT_ACCEPT, ImportLanguage, ImportProgress } from '@/services/faqImportService';
import { useBulkCreateFaqs } from '@/hooks/useFaqs';

interface FaqImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Questions already in the library, so the AI can flag duplicates. */
  existingQuestions: string[];
}

type Step = 'pick' | 'analyzing' | 'review';

const LANGUAGE_OPTIONS: { id: ImportLanguage; label: string }[] = [
  { id: 'auto', label: 'Same as file' },
  { id: 'ar', label: 'Arabic' },
  { id: 'en', label: 'English' },
];

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FaqImportModal: React.FC<FaqImportModalProps> = ({ isOpen, onClose, existingQuestions }) => {
  const [step, setStep] = useState<Step>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<ImportLanguage>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ImportedFaqDraft[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const runIdRef = useRef(0);
  const bulkCreate = useBulkCreateFaqs();

  // Start fresh every time the modal opens; ignore results of an analysis that was abandoned.
  useEffect(() => {
    if (!isOpen) return;
    runIdRef.current += 1;
    setStep('pick');
    setFile(null);
    setProgress(null);
    setError(null);
    setDrafts([]);
    setSelected(new Set());
    setExpandedId(null);
    setEditingId(null);
    setSaveProgress(null);
  }, [isOpen]);

  const chooseFile = (candidate: File | undefined) => {
    if (!candidate) return;
    setFile(candidate);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    const runId = ++runIdRef.current;
    setStep('analyzing');
    setError(null);
    setProgress(null);

    try {
      const result = await extractFaqsFromFile(file, {
        language,
        existingQuestions,
        onProgress: (p) => runId === runIdRef.current && setProgress(p),
      });
      if (runId !== runIdRef.current) return;
      setDrafts(result);
      // Pre-select everything except entries the AI thinks are similar to an existing FAQ.
      setSelected(new Set(result.filter((d) => !d.duplicateOf).map((d) => d.draftId)));
      setStep('review');
    } catch (err) {
      if (runId !== runIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Analysis failed.');
      setStep('pick');
    }
  };

  const cancelAnalysis = () => {
    runIdRef.current += 1;
    setStep('pick');
  };

  const toggleSelected = (draftId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(draftId)) next.delete(draftId);
      else next.add(draftId);
      return next;
    });
  };

  const updateDraft = (draftId: string, changes: Partial<ImportedFaqDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.draftId === draftId ? { ...d, ...changes } : d)));
  };

  const handleSave = async () => {
    const chosen = drafts.filter((d) => selected.has(d.draftId) && d.question.trim() && d.answer.trim());
    if (chosen.length === 0) return;

    try {
      const count = await bulkCreate.mutateAsync({
        inputs: chosen.map((d) => ({
          question: d.question.trim(),
          answer: d.answer.trim(),
          category: d.category,
          tags: d.tags,
          language: d.language,
          is_published: true,
          metadata: { language: d.language, source: 'file-import', fileName: file?.name },
        })),
        onProgress: (done, total) => setSaveProgress(`${done}/${total}`),
      });
      toast.success(`Added ${count} FAQs`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saving failed.');
    } finally {
      setSaveProgress(null);
    }
  };

  const duplicatesCount = drafts.filter((d) => d.duplicateOf).length;
  const allSelected = drafts.length > 0 && selected.size === drafts.length;
  const isSaving = bulkCreate.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <UploadCloud className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              Import FAQs from a File
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Step 1: choose a file */}
        {step === 'pick' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs sm:text-sm text-slate-600">
              Upload a policy, guide, or any document. The AI reads all of it, writes the FAQs customers would ask, and you review them before anything is saved.
            </p>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                chooseFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-purple-500 bg-purple-50 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50/60 hover:border-purple-400 hover:bg-purple-50/40'
              }`}
            >
              <UploadCloud className={`h-9 w-9 transition-transform duration-300 ${isDragging ? 'text-purple-600 -translate-y-1' : 'text-slate-400'}`} />
              <p className="text-sm font-semibold text-slate-800">Drop a file here or tap to choose</p>
              <p className="text-[11px] text-slate-500">TXT, MD, CSV, JSON (up to 2 MB) • PDF (up to 5 MB)</p>
              <input
                ref={inputRef}
                type="file"
                accept={IMPORT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  chooseFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 animate-fade-in-up">
                <FileText className="h-5 w-5 text-purple-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-500">{formatBytes(file.size)}</p>
                </div>
                <button onClick={() => setFile(null)} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove file">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-700">FAQ language</p>
              <div className="grid grid-cols-3 gap-1.5">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLanguage(option.id)}
                    className={`rounded-lg border px-2 py-2 text-[11px] sm:text-xs font-medium transition-all ${
                      language === option.id
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={!file} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Analyze with AI
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: the AI is reading the document */}
        {step === 'analyzing' && (
          <div className="py-6 space-y-5 text-center animate-fade-in" role="status" aria-live="polite">
            <div className="relative mx-auto h-16 w-16">
              <span className="absolute inset-0 rounded-2xl bg-purple-200 animate-ping opacity-40" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg">
                <FileText className="h-7 w-7" />
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Reading the document and writing FAQs...</p>
              <p className="text-xs text-slate-500 truncate px-4">{file?.name}</p>
              {progress && (
                <p className="text-xs text-purple-700">
                  {progress.totalParts > 1 ? `Part ${progress.part} of ${progress.totalParts} • ` : ''}
                  {progress.foundSoFar > 0 ? `${progress.foundSoFar} FAQs found so far` : 'Reading...'}
                </p>
              )}
            </div>
            <div className="mx-auto max-w-sm h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#9333ea_0%,#c084fc_50%,#9333ea_100%)] bg-[length:200%_100%] animate-shimmer transition-all duration-700"
                style={{ width: progress ? `${Math.max(12, ((progress.part - 0.5) / progress.totalParts) * 100)}%` : '12%' }}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={cancelAnalysis} className="text-slate-500">
              Cancel
            </Button>
          </div>
        )}

        {/* Step 3: review what the AI extracted */}
        {step === 'review' && (
          <div className="space-y-3 animate-fade-in">
            {drafts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No customer FAQs found in this file.</p>
                </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-purple-50/70 border border-purple-100 px-3 py-2">
                  <p className="text-xs sm:text-sm text-purple-950">
                    <span className="font-bold">{drafts.length}</span> FAQs found • <span className="font-bold">{selected.size}</span> selected
                    {duplicatesCount > 0 && <span className="text-amber-700"> • {duplicatesCount} similar to existing (unselected, review them)</span>}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected(allSelected ? new Set() : new Set(drafts.map((d) => d.draftId)))}
                    className="text-xs font-medium text-purple-700 hover:underline"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <ul className="space-y-2">
                  {drafts.map((draft, index) => {
                    const isSelected = selected.has(draft.draftId);
                    const isExpanded = expandedId === draft.draftId || editingId === draft.draftId;
                    const isEditing = editingId === draft.draftId;
                    return (
                      <li
                        key={draft.draftId}
                        className={`rounded-xl border bg-white transition-all animate-fade-in-up ${
                          isSelected ? 'border-purple-300 shadow-sm' : 'border-slate-200 opacity-70'
                        }`}
                        style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
                      >
                        <div className="flex items-start gap-2.5 p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelected(draft.draftId)}
                            className="mt-1 h-4 w-4 shrink-0 accent-purple-600"
                            aria-label="Include this FAQ"
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="secondary" className="text-[10px]">{draft.category}</Badge>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {draft.language.toUpperCase()}
                              </span>
                              {draft.duplicateOf && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded" title={draft.duplicateOf}>
                                  <AlertTriangle className="h-3 w-3" /> Similar FAQ exists
                                </span>
                              )}
                              {draft.excerptVerified === true && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" /> Found in file
                                </span>
                              )}
                              {draft.excerptVerified === false && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="h-3 w-3" /> Quote not found, review it
                                </span>
                              )}
                            </div>

                            {isEditing ? (
                              <Input
                                value={draft.question}
                                onChange={(e) => updateDraft(draft.draftId, { question: e.target.value })}
                                dir="auto"
                                className="text-sm font-semibold"
                              />
                            ) : (
                              <p dir="auto" className="text-sm font-semibold text-slate-900 break-words">{draft.question}</p>
                            )}

                            {isExpanded && (
                              <div className="space-y-2 animate-fade-in">
                                {isEditing ? (
                                  <Textarea
                                    value={draft.answer}
                                    onChange={(e) => updateDraft(draft.draftId, { answer: e.target.value })}
                                    dir="auto"
                                    rows={4}
                                    className="text-sm"
                                  />
                                ) : (
                                  <p dir="auto" className="text-sm text-slate-600 whitespace-pre-line break-words">{draft.answer}</p>
                                )}
                                {draft.duplicateOf && (
                                  <p dir="auto" className="text-[11px] text-amber-800">Similar existing FAQ: {draft.duplicateOf}</p>
                                )}
                                {draft.sourceExcerpt && (
                                  <p dir="auto" className="flex gap-1.5 text-[11px] italic text-slate-500 bg-slate-50 rounded-md px-2 py-1.5 break-words">
                                    <Quote className="h-3 w-3 shrink-0 mt-0.5" />
                                    <span>{draft.sourceExcerpt}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingId(isEditing ? null : draft.draftId)}
                              className={`p-1.5 rounded-md hover:bg-slate-100 ${isEditing ? 'text-purple-600' : 'text-slate-400'}`}
                              aria-label={isEditing ? 'Done editing' : 'Edit'}
                            >
                              {isEditing ? <CheckCircle2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded && !isEditing ? null : draft.draftId)}
                              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"
                              aria-label={isExpanded ? 'Collapse' : 'Show answer'}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <DialogFooter className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep('pick')} disabled={isSaving}>
                Try another file
              </Button>
              <Button
                onClick={handleSave}
                disabled={selected.size === 0 || isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving {saveProgress ?? ''}
                  </>
                ) : (
                  <>Add {selected.size} FAQs</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
