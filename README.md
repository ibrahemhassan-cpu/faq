# FAQ AI POC — Smart Knowledge Base & Assistant

An FAQ assistant that **understands what the customer means**, not just the words they type. The AI reads the entire FAQ library, works out the customer's underlying need, picks the FAQs that resolve it, and answers only from those FAQs.

> "الحاجات اللي جبتها بايظة أعمل ايه؟" → refund policy (partial fit) + how to contact support
> "3ayez flousy tany" → refund policy
> "What is the secret recipe for Italian pizza?" → politely refused, not in the knowledge base

---

## 🧠 How the search works

```
Customer message
   │
   ▼
faq-ai server function  (Supabase Edge Function, or the Vite dev server locally)
   │  1. Load every published FAQ (id, question, answer, category, tags; no vectors)
   │  2. Remove exact duplicates
   │  3. Send the whole library to the LLM with short refs [F1], [F2], ...
   ▼
LLM returns strict JSON:
   intent · found · confidence · matches[{ref, relevance, reason}] · answer · follow_up_question
   │
   ▼
Server verifies every ref exists (invented refs are dropped) and maps it back to the
real FAQ from the database, so the FAQ text shown is never AI-generated
```

- **Understanding, not keywords**: dialects (Egyptian, Gulf, Levantine…), Franco-Arabic, typos, and indirect descriptions of a situation.
- **Relevance levels**: `direct` (answers it), `partial` (close policy, with its limits stated), `related` (next step, such as contacting support).
- **Anti-hallucination**: answers use only facts from the selected FAQs; out-of-scope questions are refused.
- **Follow-ups**: the last 3 exchanges are sent so "and how long does that take?" resolves.
- **Scales**: above `FAQ_FULL_CONTEXT_LIMIT` (default 300) FAQs, pgvector pre-filters to the closest `FAQ_PREFILTER_COUNT` (default 80) before the AI reads them.
- **Resilient**: if a Gemini model is busy or rate-limited, the server tries the other Gemini models, then `AI_FALLBACK_PROVIDER` if configured.

**No AI keys reach the browser.** All AI calls (answering, the FAQ draft generator, and embeddings) run server-side.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, TanStack React Query.
- **Database**: Supabase PostgreSQL (+ `pgvector` for the large-library pre-filter).
- **AI server**: Supabase Edge Function `faq-ai` ([supabase/functions/faq-ai](supabase/functions/faq-ai/index.ts)), sharing its logic with the local dev server ([supabase/functions/_shared](supabase/functions/_shared/faqAssistant.ts)).
- **LLM providers** (OpenAI-compatible API, switch with config only):
  - Google Gemini: `gemini-flash-lite-latest` (default), `gemini-3.8-flash`, `gemini-flash-latest`
  - NVIDIA via OpenRouter: `nvidia/nemotron-3-super-120b-a12b:free`, `nvidia/nemotron-3-ultra-550b-a55b` (selectable in the app's AI settings; needs `OPENROUTER_API_KEY`)
- **Embeddings**: `gemini-embedding-001` (768d, task-typed).

---

## 🚀 Quick Start (local)

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). In dev, the Vite server serves the AI endpoint at `/api/faq-ai` using the server-only variables from `.env`.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | browser | Supabase client (public values) |
| `AI_PROVIDER` | server | `gemini` (default) or `openrouter` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | server | Gemini access and default model |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | server | OpenRouter access (NVIDIA models) and its default model |
| `AI_FALLBACK_PROVIDER` | server | Provider to try if the main one fails |
| `AI_REASONING_EFFORT` | server | Optional `low`/`medium`/`high` thinking for models that support it |
| `FAQ_REQUIRE_AUTH` | server | Require a signed-in user on every AI request (default `true`) |
| `FAQ_FULL_CONTEXT_LIMIT`, `FAQ_PREFILTER_COUNT` | server | Large-library pre-filter tuning |
| `VITE_FAQ_AI_URL` | browser | Optional: use a deployed function during dev |

⚠️ Never prefix server variables with `VITE_`, or Vite will bundle them into the public JavaScript.

---

## 🔐 Sign-in (Supabase Auth)

The whole app sits behind a sign-in screen. Accounts live in Supabase Auth, so no email or
password is ever stored in this repository, in env vars, or in the built JavaScript.

**One-time setup in the Supabase dashboard:**

1. **Authentication → Providers → Email:** make sure Email is enabled, and turn **Confirm email** off
   (or confirm the user manually) so the account can sign in right away.
2. **Authentication → Users → Add user:** enter your email and choose the password there.
3. **Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".**
   Without this, anyone could create their own account with the public anon key.
4. **SQL Editor:** run `supabase/migrations/20260920_lock_down_rls.sql` so only signed-in users
   can read or change FAQs.

How it is enforced:

- **The app:** nothing renders until there is a session; sign out from the button in the navbar.
- **The database:** RLS allows `authenticated` only; the public anon key can no longer read or write.
- **The AI function:** every request must carry the signed-in user's token. The anon key alone is
  rejected, so nobody else can burn your AI credits. The function reads the database with the
  service role key, which is why it still works with RLS locked down.

## ☁️ Deploying the AI function (production)

A production build (`npm run build`) calls `${VITE_SUPABASE_URL}/functions/v1/faq-ai`, so deploy the function first:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-flash-lite-latest
npx supabase functions deploy faq-ai
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to Edge Functions automatically.

---

## 🗄️ Supabase Database Setup

Run these in the Supabase SQL Editor, in order:

1. `supabase/migrations/20260914_init_faq_pgvector.sql`: `faqs` table, pgvector, HNSW index, `match_faqs`.
2. `supabase/migrations/20260914_seed_large_faq_dataset.sql`: optional sample data.
3. `supabase/migrations/20260915_match_faqs_order_by_distance.sql`: makes `match_faqs` use the HNSW index.

*(Without Supabase, the app runs in local mode: FAQs live in browser storage and are sent to the dev server's AI endpoint.)*

### ⚠️ Before going to production

- Run `20260920_lock_down_rls.sql` and turn off public sign-ups (see the sign-in section above).
- Add rate limiting in front of `faq-ai`: every call costs AI tokens.

---

## 📂 Project Structure

```
faq/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── faqAssistant.ts   # Prompt, knowledge-base loading, ref verification, pre-filter
│   │   │   └── llm.ts            # Gemini / OpenRouter client with model & provider fallback
│   │   └── faq-ai/index.ts       # Edge Function entry point
│   └── migrations/               # Schema, seed data, match_faqs
├── src/
│   ├── services/
│   │   ├── aiClient.ts           # Browser → faq-ai endpoint
│   │   ├── aiService.ts          # Ask AI + FAQ draft generator
│   │   └── faqService.ts         # FAQ CRUD (Supabase or local storage)
│   ├── components/
│   │   ├── ask-ai/               # Search, AI answer (intent, confidence), selected FAQs
│   │   ├── faq-manager/          # FAQ table, stats, create/edit modal
│   │   └── playground/           # AI Match Inspector
│   └── pages/                    # AskAiPage, FaqLibraryPage, PlaygroundPage
└── vite.config.ts                # Includes the /api/faq-ai dev middleware
```
