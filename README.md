# FAQ AI POC — Smart Knowledge Base & Assistant

A modern Proof of Concept (POC) demonstrating intelligent FAQ template management, semantic vector retrieval via **Supabase pgvector**, and grounded anti-hallucination question answering via **Google Gemini Flash Lite**.

---

## 🌟 Key Features

1. **Intelligent Ask AI Assistant (`AskAiPage`)**:
   - Natural language query understanding in both **English and Arabic**.
   - Semantic retrieval using 768-dimensional vector embeddings with cosine similarity.
   - Grounded QA: Google Gemini generates answers strictly based on retrieved FAQ templates.
   - **Anti-Hallucination Guardrail**: Refuses to guess or invent facts if relevant FAQ knowledge is absent.
   - Model switcher: Defaults to ultra-low cost **Gemini Flash Lite** (`gemini-flash-lite-latest`), with options for **Gemini Flash** and **Gemini 3.8 Flash**.
   - Real-time similarity scores and collapsible source citations for full transparency.

2. **Knowledge Base Management (`FaqLibraryPage`)**:
   - Complete CRUD operations for FAQ questions, answers, categories, and tags.
   - Auto-Embedding: Generates 768d vector embeddings using `gemini-embedding-001` upon creation/update.
   - **1-Click Seeder**: Pre-load 25+ rich enterprise FAQ templates across Billing, Security, Technical Support, and API categories.
   - Live category filtering and search.
   - Database health & vector synchronization statistics.

3. **Vector Similarity Inspector & Playground (`PlaygroundPage`)**:
   - Test diverse user phrasings and synonyms (e.g., *"How much does it cost?"* vs *"What are the fees?"* vs *"كم تكلفة الخدمة؟"*).
   - Visual similarity score meters and response time tracking (ms).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui design tokens, Radix UI primitives.
- **State Management & Caching**: TanStack React Query (`@tanstack/react-query`) with automatic cache invalidation and query deduplication.
- **Vector Database**: Supabase PostgreSQL + `pgvector` extension (HNSW index, cosine distance similarity RPC `match_faqs`).
- **AI & Embeddings**: Google Gemini API (`@google/generative-ai`):
  - Embeddings: `gemini-embedding-001` (768 dimensions via MRL)
  - Grounded QA: `gemini-flash-lite-latest` (Ultra-low cost, high speed)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Your credentials are already configured in `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Supabase pgvector Database Setup

To enable native database vector search in your Supabase project:
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/lbqhsninijcscfpnygdq/sql).
2. Copy and execute the migration script located at:
   ```
   supabase/migrations/20260914_init_faq_pgvector.sql
   ```
3. This creates the `faqs` table, enables `vector`, sets up the HNSW index, and creates the `match_faqs` stored procedure.

*(Note: The application also includes an automated local fallback mode so the UI and vector matching work seamlessly even before the SQL migration is executed!)*

---

## 📂 Project Structure

```
faq/
├── supabase/
│   └── migrations/
│       └── 20260914_init_faq_pgvector.sql # Complete Supabase SQL migration
├── src/
│   ├── types/
│   │   ├── faq.ts                         # FAQ & category types
│   │   └── search.ts                      # Semantic search & AI types
│   ├── lib/
│   │   ├── supabase.ts                    # Supabase client singleton
│   │   ├── gemini.ts                      # Gemini SDK configuration
│   │   ├── queryClient.ts                 # TanStack QueryClient with caching
│   │   └── utils.ts                       # Tailwind merge & utilities
│   ├── services/
│   │   ├── faqService.ts                  # FAQ CRUD with Supabase & local cache
│   │   ├── embeddingService.ts            # 768d vector generation & cosine similarity
│   │   ├── searchService.ts               # pgvector RPC `match_faqs` & vector search
│   │   └── aiService.ts                   # Grounded QA engine & model router
│   ├── hooks/
│   │   ├── useFaqs.ts                     # TanStack Query hooks for FAQs & stats
│   │   ├── useSemanticSearch.ts           # Semantic query hook
│   │   └── useAskAi.ts                    # AI ask mutation with history
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components (Button, Card, Dialog, etc.)
│   │   ├── layout/                        # Navbar with status badges, Footer
│   │   ├── ask-ai/                        # Ask AI search, response card, sources
│   │   ├── faq-manager/                   # FAQ table, stats, toolbar, create/edit modal
│   │   └── playground/                    # Vector similarity tester
│   ├── pages/
│   │   ├── AskAiPage.tsx                  # User QA interface
│   │   ├── FaqLibraryPage.tsx             # Knowledge base admin
│   │   └── PlaygroundPage.tsx             # Semantic testing playground
│   ├── data/
│   │   └── initialFaqs.ts                 # 25+ curated enterprise templates
│   ├── App.tsx
│   └── main.tsx
```
