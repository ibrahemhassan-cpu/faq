import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { handleFaqAiRequest, readServerConfig } from './supabase/functions/_shared/faqAssistant.ts';

/**
 * Serves the same handler as the `faq-ai` Edge Function at /api/faq-ai during
 * `npm run dev`, so AI keys stay server-side without deploying first.
 */
function faqAiDevApi(env: Record<string, string>): Plugin {
  const serverEnv: Record<string, string | undefined> = {
    ...env,
    SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
    // Local mode keeps FAQs in the browser, so the dev server accepts them.
    FAQ_ALLOW_CLIENT_FAQS: env.FAQ_ALLOW_CLIENT_FAQS || 'true',
  };

  return {
    name: 'faq-ai-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/faq-ai', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (req.method !== 'POST') return send(405, { error: 'Method not allowed' });

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        let body: unknown;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        } catch {
          return send(400, { error: 'Invalid JSON body' });
        }

        const result = await handleFaqAiRequest(body, readServerConfig((name) => serverEnv[name]));
        send(result.status, result.body);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), faqAiDevApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-tanstack': ['@tanstack/react-query'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
