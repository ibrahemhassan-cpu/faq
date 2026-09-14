import { genAI } from '@/lib/gemini';
import { AskAiRequest, AskAiResponse } from '@/types/search';
import { searchFaqsSemantically } from './searchService';

export const AVAILABLE_MODELS = [
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite (Ultra Low-Cost & Fast)', badge: 'Recommended' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash (Balanced Intelligence)', badge: 'Fast' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (High Capability)', badge: 'Advanced' },
] as const;

export interface GeneratedFaqDraft {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  language?: 'en' | 'ar';
}

/**
 * Main Grounded QA generation pipeline:
 * 1. Semantic retrieval from Supabase pgvector
 * 2. Strict threshold check (Default 70% / 0.70): if match < threshold, reject and do not invent
 * 3. Grounded generation via Google Gemini API with strict anti-hallucination prompt
 */
export async function askAiWithKnowledgeBase(
  request: AskAiRequest
): Promise<AskAiResponse> {
  const startTime = performance.now();
  const query = request.query.trim();
  const selectedModel = request.model || 'gemini-flash-lite-latest';
  const matchThreshold = request.matchThreshold ?? 0.70; // Default strictly 70%

  if (!query) {
    throw new Error('Query cannot be empty');
  }

  // Step 1: Semantic search to retrieve relevant FAQs
  const searchResult = await searchFaqsSemantically({
    ...request,
    matchThreshold,
  });

  const sources = searchResult.matches;
  const highestSimilarity = sources.length > 0 ? sources[0].similarity : 0;
  const hasRelevantMatch = sources.length > 0 && highestSimilarity >= matchThreshold;

  // If no relevant FAQs found or similarity is below the configured threshold (e.g. 70%),
  // return anti-hallucination refusal message directly and do NOT hallucinate an answer.
  if (!hasRelevantMatch) {
    const isArabic = /[\u0600-\u06FF]/.test(query);
    const latencyMs = Math.round(performance.now() - startTime);
    const thresholdPct = Math.round(matchThreshold * 100);

    const refusalMessage = isArabic
      ? `عذراً، لم أجد معلومات كافية في قاعدة الأسئلة الشائعة بنسبة تطابق تفوق ${thresholdPct}%. لحماية دقة الإجابات، أمتنع عن التخمين أو تأليف معلومات غير معتمدة. يمكنك إعادة صياغة السؤال، تقليل نسبة التطابق من الإعدادات، أو التواصل مع فريق الدعم.`
      : `I'm sorry, but I could not find verified FAQ information matching your question with at least ${thresholdPct}% confidence. To prevent hallucinations and ensure accuracy, I only answer when there is a strong match. You can rephrase your inquiry, lower the threshold in settings, or contact our support team.`;

    return {
      query,
      modelUsed: selectedModel,
      answer: refusalMessage,
      sources: [], // Do not return weak sources when below threshold
      highestSimilarity,
      isGrounded: true,
      hasRelevantMatch: false,
      latencyMs,
    };
  }

  // Step 2: Build Grounded Anti-Hallucination Prompt with retrieved sources
  const contextText = sources
    .map(
      (s, idx) =>
        `[FAQ Source #${idx + 1}] Category: ${s.category} (Cosine Similarity: ${Math.round(s.similarity * 100)}%)\nQuestion: ${s.question}\nAnswer: ${s.answer}`
    )
    .join('\n\n');

  const systemInstruction = `You are an intelligent, professional customer assistant for our FAQ knowledge base.
Your job is to answer the user's question accurately and concisely, relying STRICTLY and EXCLUSIVELY on the verified FAQ context provided below.

RULES:
1. Grounding: Answer ONLY using facts stated in the CONTEXT. Do NOT extrapolate, invent, or speculate.
2. Anti-Hallucination: If the context does not contain the full answer, state what is covered and clarify what is missing.
3. Language Matching: If the user's question is in Arabic, reply in professional, fluent Arabic. If in English, reply in English.
4. Tone: Helpful, clear, modern, and concise. Avoid unnecessary conversational filler.`;

  const prompt = `CONTEXT FROM FAQ KNOWLEDGE BASE:
${contextText}

---
USER QUESTION:
${query}

Please provide a clear and grounded answer based strictly on the context above:`;

  let answerText = '';

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      answerText = result.response.text();
    } catch (error: any) {
      console.error(`[AiService] Model ${selectedModel} failed, trying fallback:`, error?.message || error);
      try {
        const fallbackModel = genAI.getGenerativeModel({
          model: 'gemini-flash-latest',
          systemInstruction,
        });
        const fbResult = await fallbackModel.generateContent(prompt);
        answerText = fbResult.response.text();
      } catch (fbError) {
        answerText = buildFallbackAnswer(query, sources[0]);
      }
    }
  } else {
    answerText = buildFallbackAnswer(query, sources[0]);
  }

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    query,
    modelUsed: selectedModel,
    answer: answerText,
    sources,
    highestSimilarity,
    isGrounded: true,
    hasRelevantMatch: true,
    latencyMs,
  };
}

/**
 * AI FAQ Generator: Takes a topic or draft and generates a full FAQ
 * in the requested target language ('en' or 'ar', default 'en').
 */
export async function generateFaqWithAi(
  userTopic: string,
  targetLanguage: 'en' | 'ar' = 'en'
): Promise<GeneratedFaqDraft> {
  const cleanTopic = userTopic.trim();
  if (!cleanTopic) {
    throw new Error('Please provide a topic or prompt for the FAQ.');
  }

  const isArabic = targetLanguage === 'ar';

  const fallbackResult: GeneratedFaqDraft = {
    question: isArabic ? `ما هي تفاصيل ${cleanTopic}؟` : `What is the policy regarding ${cleanTopic}?`,
    answer: isArabic
      ? `توفر شركتنا معلومات شاملة وإرشادات واضحة بخصوص ${cleanTopic}. يرجى مراجعة التفاصيل أو التواصل مع فريق الدعم للمزيد من التوضيح.`
      : `We provide clear guidelines and support regarding ${cleanTopic}. Please refer to our documentation or contact customer support for further assistance.`,
    category: 'General',
    tags: [cleanTopic.split(' ')[0] || (isArabic ? 'عام' : 'general'), isArabic ? 'دعم' : 'support'],
    language: targetLanguage,
  };

  if (!genAI) {
    return fallbackResult;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const langName = isArabic ? 'ARABIC (اللغة العربية الفصحى)' : 'ENGLISH';

    const prompt = `You are an expert FAQ content creator.
Create a complete, high-quality, professional FAQ template based on this topic:
"${cleanTopic}"

CRITICAL MANDATORY REQUIREMENT:
The output language MUST BE strictly in ${langName}.
Even if the topic or input was written in another language, formulate the Question, the Answer, and the Tags strictly in ${langName}.

Return ONLY a JSON object conforming strictly to this format:
{
  "question": "Canonical, user-friendly question in ${langName}",
  "answer": "Clear, authoritative answer (2-4 sentences) written in ${langName}",
  "category": "one of: 'Billing & Subscriptions', 'Account & Security', 'Technical Support', 'API & Integrations', 'General'",
  "tags": ["3-5", "relevant", "keywords", "in", "${langName}"]
}`;

    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const parsed = JSON.parse(text);

    return {
      question: parsed.question || fallbackResult.question,
      answer: parsed.answer || fallbackResult.answer,
      category: parsed.category || fallbackResult.category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackResult.tags,
      language: targetLanguage,
    };
  } catch (error: any) {
    console.error('[AiService] generateFaqWithAi failed:', error?.message || error);
    return fallbackResult;
  }
}

function buildFallbackAnswer(query: string, topFaq: { question: string; answer: string }): string {
  const isArabic = /[\u0600-\u06FF]/.test(query);
  if (isArabic) {
    return `بناءً على الأسئلة الشائعة المتطابقة "${topFaq.question}":\n\n${topFaq.answer}`;
  }
  return `Based on the matching FAQ "${topFaq.question}":\n\n${topFaq.answer}`;
}
