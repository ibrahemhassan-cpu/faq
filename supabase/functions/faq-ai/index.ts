// Supabase Edge Function: all AI calls for the FAQ app run here so API keys never
// reach the browser.
//
// Deploy:  npx supabase functions deploy faq-ai
// Secrets: npx supabase secrets set GEMINI_API_KEY=... (see README for the full list)

import { handleFaqAiRequest, readServerConfig } from '../_shared/faqAssistant.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const config = readServerConfig((name) => Deno.env.get(name));
  const result = await handleFaqAiRequest(body, config, req.headers.get('Authorization'));
  return jsonResponse(result.status, result.body);
});
