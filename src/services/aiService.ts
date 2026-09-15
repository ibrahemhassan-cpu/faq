import { isSupabaseConfigured } from '@/lib/supabase';
import { AskAiRequest, AskAiResponse } from '@/types/search';
import { callFaqAi } from './aiClient';
import { getFaqs } from './faqService';

export interface AiModelOption {
  id: string;
  name: string;
  provider: 'Google Gemini' | 'NVIDIA';
  description: string;
  badge?: string;
}

export const AVAILABLE_MODELS: AiModelOption[] = [
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', provider: 'Google Gemini', description: 'Fast and low-cost • سريع وموفّر', badge: 'Recommended' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'Google Gemini', description: 'Most capable, a little slower • الأذكى', badge: 'Advanced' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash', provider: 'Google Gemini', description: 'Balanced speed and quality • متوازن' },
  // NVIDIA models via OpenRouter; need OPENROUTER_API_KEY on the server
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super', provider: 'NVIDIA', description: 'Free via OpenRouter, rate-limited • مجاني', badge: 'Free' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra', provider: 'NVIDIA', description: 'Needs OpenRouter credits • مدفوع', badge: 'Paid' },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

export interface GeneratedFaqDraft {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  language?: 'en' | 'ar';
}

/**
 * Asks the AI assistant. The server gives the model the whole published knowledge
 * base, lets it work out the customer's real need, and verifies the FAQs it picks.
 */
export async function askAiWithKnowledgeBase(request: AskAiRequest): Promise<AskAiResponse> {
  const query = request.query.trim();
  if (!query) {
    throw new Error('Query cannot be empty');
  }

  const payload: Record<string, unknown> = {
    query,
    model: request.model,
    category: request.filterCategory,
    history: request.history,
  };

  // Without Supabase the FAQs only exist in this browser, so send them along.
  if (!isSupabaseConfigured) {
    const { faqs } = await getFaqs();
    payload.faqs = faqs
      .filter((faq) => faq.is_published)
      .map(({ id, question, answer, category, tags }) => ({ id, question, answer, category, tags }));
  }

  return callFaqAi<AskAiResponse>('ask', payload);
}

/** Transcribes a recorded voice question (base64 16 kHz mono WAV) on the server. */
export async function transcribeAudio(wavBase64: string): Promise<string> {
  const { text } = await callFaqAi<{ text: string }>('transcribe', { audio: wavBase64, mimeType: 'audio/wav' });
  return text.trim();
}

/**
 * AI FAQ Generator: Takes a topic or draft and generates a full FAQ
 * in the requested target language ('en' or 'ar', default 'en').
 */
export async function generateFaqWithAi(
  userTopic: string,
  targetLanguage: 'en' | 'ar' = 'en'
): Promise<GeneratedFaqDraft> {
  const topic = userTopic.trim();
  if (!topic) {
    throw new Error('Please provide a topic or prompt for the FAQ.');
  }
  return callFaqAi<GeneratedFaqDraft>('generate-faq', { topic, language: targetLanguage });
}
