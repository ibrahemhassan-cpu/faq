// Provider-agnostic LLM client. Both Gemini and OpenRouter expose an
// OpenAI-compatible chat completions API, so switching providers is config only.
// Runs unchanged on Deno (Supabase Edge Functions) and Node (Vite dev server).

export type AiProvider = 'gemini' | 'openrouter';

export interface LlmConfig {
  provider: AiProvider;
  fallbackProvider?: AiProvider;
  geminiApiKey?: string;
  geminiModel: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  /** Optional thinking budget for models that support it: 'low' | 'medium' | 'high'. */
  reasoningEffort?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface JsonCompletionRequest {
  messages: ChatMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
  /** Model requested by the client; only honoured if it is in the provider allowlist. */
  requestedModel?: string;
  /** Per-request timeout; long generations (e.g. extracting many FAQs) need more than the default. */
  timeoutMs?: number;
}

export interface JsonCompletionResult<T> {
  data: T;
  provider: AiProvider;
  model: string;
}

export const GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-flash-latest'];

// NVIDIA Nemotron models on OpenRouter that support structured JSON output.
// The ":free" endpoint has strict rate limits and the provider may log prompts.
export const OPENROUTER_MODELS = ['nvidia/nemotron-3-super-120b-a12b:free', 'nvidia/nemotron-3-ultra-550b-a55b'];

function providerForModel(model?: string): AiProvider | null {
  if (!model) return null;
  if (GEMINI_MODELS.includes(model)) return 'gemini';
  if (OPENROUTER_MODELS.includes(model)) return 'openrouter';
  return null;
}

const CHAT_ENDPOINTS: Record<AiProvider, string> = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

const REQUEST_TIMEOUT_MS = 45_000;

interface ProviderTarget {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

/** Ordered attempts for one provider: the preferred model first, then that provider's other models. */
function resolveTargets(provider: AiProvider, config: LlmConfig, requestedModel?: string): ProviderTarget[] {
  const isGemini = provider === 'gemini';
  const apiKey = isGemini ? config.geminiApiKey : config.openrouterApiKey;
  if (!apiKey) return [];

  const catalog = isGemini ? GEMINI_MODELS : OPENROUTER_MODELS;
  const configured = isGemini ? config.geminiModel : config.openrouterModel || OPENROUTER_MODELS[0];
  const preferred = requestedModel && catalog.includes(requestedModel) ? requestedModel : configured;
  // Busy or rate-limited models are common; try the others before giving up.
  const models = [preferred, ...catalog.filter((m) => m !== preferred)];
  return models.map((model) => ({ provider, apiKey, model }));
}

export function describeActiveProvider(config: LlmConfig): { provider: AiProvider; model: string } | null {
  const [target] = resolveTargets(config.provider, config);
  return target ? { provider: target.provider, model: target.model } : null;
}

class ProviderHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the configured provider and returns parsed JSON that follows `schema`.
 * Order: the provider of the model the user picked, then AI_PROVIDER, then AI_FALLBACK_PROVIDER.
 * Within a provider, other models are tried on overload/rate-limit.
 */
export async function completeJson<T>(request: JsonCompletionRequest, config: LlmConfig): Promise<JsonCompletionResult<T>> {
  const providers = [providerForModel(request.requestedModel), config.provider, config.fallbackProvider].filter(
    (p, index, all): p is AiProvider => Boolean(p) && all.indexOf(p) === index
  );

  const errors: string[] = [];
  for (const provider of providers) {
    const targets = resolveTargets(provider, config, request.requestedModel);
    if (targets.length === 0) {
      errors.push(`${provider}: not configured`);
      continue;
    }
    for (const target of targets) {
      try {
        const data = await requestJson<T>(target, request, config.reasoningEffort);
        return { data, provider: target.provider, model: target.model };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[llm] ${provider}/${target.model} failed: ${message.slice(0, 200)}`);
        errors.push(`${provider}/${target.model}: ${message.slice(0, 120)}`);
        // Only a busy/limited model is worth swapping; auth or bad-request errors will repeat.
        const retryable = !(error instanceof ProviderHttpError) || error.status === 429 || error.status >= 500;
        if (!retryable) break;
      }
    }
  }
  throw new Error(`All AI providers failed (${errors.join(' | ')})`);
}

async function requestJson<T>(target: ProviderTarget, request: JsonCompletionRequest, reasoningEffort?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${target.apiKey}`,
  };
  if (target.provider === 'openrouter') {
    headers['X-Title'] = 'FAQ AI';
  }

  const response = await fetch(CHAT_ENDPOINTS[target.provider], {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(request.timeoutMs ?? REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      model: target.model,
      messages: request.messages,
      temperature: 0,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      response_format: {
        type: 'json_schema',
        json_schema: { name: request.schemaName, strict: true, schema: request.schema },
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new ProviderHttpError(response.status, `HTTP ${response.status}: ${detail}`);
  }

  const payload = await response.json();
  const content: unknown = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Empty completion');
  }
  return parseJsonContent<T>(content);
}

function parseJsonContent<T>(content: string): T {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error('Model did not return valid JSON');
  }
}

/**
 * JSON generation from a document file (e.g. PDF) with Gemini's native API, which reads
 * files directly. The expected JSON shape must be described in `instructions`.
 */
export async function completeJsonFromFile<T>(
  file: { data: string; mimeType: string },
  instructions: string,
  apiKey: string,
  timeoutMs = 120_000
): Promise<{ data: T; model: string }> {
  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: file.mimeType, data: file.data } }, { text: instructions }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      }
    );

    if (response.ok) {
      const payload = await response.json();
      const parts: { text?: string }[] = payload?.candidates?.[0]?.content?.parts ?? [];
      return { data: parseJsonContent<T>(parts.map((p) => p.text ?? '').join('')), model };
    }

    const detail = `HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`;
    console.error(`[llm] file generation ${model} failed: ${detail}`);
    errors.push(`${model}: ${detail}`);
    if (response.status !== 429 && response.status < 500) break;
  }
  throw new Error(`File analysis failed (${errors.join(' | ')})`);
}

/**
 * Speech-to-text with Gemini (native API). Always Gemini: the OpenRouter models
 * used here do not accept audio. Tries each Gemini model on overload/rate-limit.
 */
export async function transcribeAudio(base64Audio: string, mimeType: string, apiKey: string): Promise<string> {
  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Audio } },
                {
                  text:
                    'Transcribe exactly what the speaker says. Keep the original language and dialect: ' +
                    'write Arabic (including Egyptian and other dialects) in Arabic script, and English in English. ' +
                    'Output only the transcript, with no quotes or notes. If there is no clear speech, output nothing.',
                },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (response.ok) {
      const payload = await response.json();
      const parts: { text?: string }[] = payload?.candidates?.[0]?.content?.parts ?? [];
      return parts.map((part) => part.text ?? '').join('').trim();
    }

    const detail = `HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`;
    console.error(`[llm] transcription ${model} failed: ${detail}`);
    errors.push(`${model}: ${detail}`);
    if (response.status !== 429 && response.status < 500) break;
  }
  throw new Error(`Transcription failed (${errors.join(' | ')})`);
}

/**
 * Gemini embeddings (native API). Used only for storing FAQ vectors and for the
 * pgvector pre-filter when the knowledge base is too large to send in full.
 */
export async function embedTexts(
  texts: string[],
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY',
  apiKey: string
): Promise<number[][]> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: 768,
        })),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const payload = await response.json();
  const vectors: number[][] = (payload?.embeddings ?? []).map((e: { values: number[] }) => e.values);
  if (vectors.length !== texts.length || vectors.some((v) => !Array.isArray(v) || v.length !== 768)) {
    throw new Error('Embedding response has unexpected shape');
  }
  return vectors;
}
