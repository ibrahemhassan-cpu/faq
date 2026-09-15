import { ImportedFaqDraft } from '@/types/faq';
import { callFaqAi } from './aiClient';

export type ImportLanguage = 'auto' | 'ar' | 'en';

export const IMPORT_ACCEPT = '.txt,.md,.markdown,.csv,.json,.pdf,text/plain,text/markdown,text/csv,application/json,application/pdf';

const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'csv', 'json'];
const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
// Each part is analyzed in its own request, so long documents stay within model and server limits.
const CHUNK_CHARS = 12_000;

export interface ImportProgress {
  part: number;
  totalParts: number;
  foundSoFar: number;
}

type ExtractedFaq = Omit<ImportedFaqDraft, 'draftId'>;

/**
 * Sends a document to the AI and returns the FAQs it extracted, deduplicated across parts.
 * Text files are split into parts on paragraph boundaries; PDFs are read by the AI directly.
 */
export async function extractFaqsFromFile(
  file: File,
  options: { language: ImportLanguage; existingQuestions: string[]; onProgress?: (progress: ImportProgress) => void }
): Promise<ImportedFaqDraft[]> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isPdf = extension === 'pdf' || file.type === 'application/pdf';
  const existingQuestions = options.existingQuestions.slice(0, 400);
  const collected: ExtractedFaq[] = [];

  if (isPdf) {
    if (file.size > MAX_PDF_BYTES) throw new Error('PDF is too large (max 5 MB). • حجم الـ PDF أكبر من 5 ميجا.');
    options.onProgress?.({ part: 1, totalParts: 1, foundSoFar: 0 });
    const { faqs } = await callFaqAi<{ faqs: ExtractedFaq[] }>('extract-faqs', {
      file: { data: await fileToBase64(file), mimeType: 'application/pdf' },
      fileName: file.name,
      language: options.language,
      existingQuestions,
    });
    collected.push(...faqs);
  } else {
    if (!TEXT_EXTENSIONS.includes(extension) && !file.type.startsWith('text/')) {
      throw new Error('Unsupported file. Use TXT, MD, CSV, JSON, or PDF. • نوع الملف مش مدعوم.');
    }
    if (file.size > MAX_TEXT_FILE_BYTES) throw new Error('File is too large (max 2 MB). • الملف أكبر من 2 ميجا.');

    const text = (await file.text()).trim();
    if (!text) throw new Error('The file is empty. • الملف فاضي.');

    const parts = splitIntoChunks(text, CHUNK_CHARS);
    for (let index = 0; index < parts.length; index++) {
      options.onProgress?.({ part: index + 1, totalParts: parts.length, foundSoFar: collected.length });
      const { faqs } = await callFaqAi<{ faqs: ExtractedFaq[] }>('extract-faqs', {
        text: parts[index],
        fileName: file.name,
        part: parts.length > 1 ? `part ${index + 1} of ${parts.length}` : undefined,
        language: options.language,
        existingQuestions,
        alreadyExtracted: collected.map((faq) => faq.question).slice(-300),
      });
      collected.push(...faqs);
    }
  }

  return dedupeByQuestion(collected).map((faq, index) => ({ ...faq, draftId: `draft-${Date.now()}-${index}` }));
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    // A single huge paragraph is cut on line breaks, then hard-cut as a last resort.
    const pieces = paragraph.length > maxChars ? paragraph.match(new RegExp(`[\\s\\S]{1,${maxChars}}`, 'g')) ?? [] : [paragraph];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 2 > maxChars) {
        chunks.push(current);
        current = '';
      }
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

function dedupeByQuestion(faqs: ExtractedFaq[]): ExtractedFaq[] {
  const seen = new Set<string>();
  return faqs.filter((faq) => {
    const key = faq.question.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
