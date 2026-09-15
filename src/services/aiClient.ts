/**
 * Browser client for the `faq-ai` server function. No AI keys live in the browser:
 * - `npm run dev`: served by the Vite dev middleware at /api/faq-ai
 * - production build: the Supabase Edge Function
 * Set VITE_FAQ_AI_URL to point at a specific deployment.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const FAQ_AI_ENDPOINT: string =
  import.meta.env.VITE_FAQ_AI_URL ||
  (import.meta.env.DEV ? '/api/faq-ai' : `${supabaseUrl}/functions/v1/faq-ai`);

export async function callFaqAi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabaseAnonKey) {
    headers.apikey = supabaseAnonKey;
    headers.Authorization = `Bearer ${supabaseAnonKey}`;
  }

  let response: Response;
  try {
    response = await fetch(FAQ_AI_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new Error('Could not reach the AI service. Check your connection and try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `AI service error (${response.status})`);
  }
  return data as T;
}
