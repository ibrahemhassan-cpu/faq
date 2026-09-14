-- ==============================================================================
-- FAQ AI POC: Database Schema & Vector Search (pgvector)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable the pgvector extension for high-performance vector similarity search
create extension if not exists vector;

-- 2. Create the FAQs table
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'General',
  tags text[] default '{}',
  embedding vector(768), -- Dimensions match Google Gemini text-embedding-004
  is_published boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Create indices for performance
-- HNSW Index for rapid approximate nearest-neighbor search using cosine distance
create index if not exists faqs_embedding_hnsw_idx 
  on faqs using hnsw (embedding vector_cosine_ops);

-- B-Tree indices for regular filtering
create index if not exists faqs_category_idx on faqs (category);
create index if not exists faqs_published_idx on faqs (is_published);
create index if not exists faqs_created_at_idx on faqs (created_at desc);

-- 4. Create trigger to automatically update updated_at timestamp
create or replace function update_faqs_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_faqs_updated_at on faqs;
create trigger set_faqs_updated_at
  before update on faqs
  for each row
  execute function update_faqs_updated_at();

-- 5. Create RPC function for Cosine Similarity Vector Search
-- Called via: supabase.rpc('match_faqs', { query_embedding: [...], match_threshold: 0.65, match_count: 5 })
create or replace function match_faqs (
  query_embedding vector(768),
  match_threshold float default 0.60,
  match_count int default 5,
  filter_category text default null
)
returns table (
  id uuid,
  question text,
  answer text,
  category text,
  tags text[],
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    faqs.id,
    faqs.question,
    faqs.answer,
    faqs.category,
    faqs.tags,
    round((1 - (faqs.embedding <=> query_embedding))::numeric, 4)::float as similarity
  from faqs
  where faqs.is_published = true
    and faqs.embedding is not null
    and (filter_category is null or faqs.category = filter_category)
    and 1 - (faqs.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- 6. Row Level Security (RLS) setup for POC
alter table faqs enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public read published FAQs" on faqs;
drop policy if exists "Anon full access for POC testing" on faqs;
drop policy if exists "Anon insert FAQs for POC" on faqs;
drop policy if exists "Anon update FAQs for POC" on faqs;
drop policy if exists "Anon delete FAQs for POC" on faqs;

-- Allow reading published FAQs
create policy "Public read published FAQs"
  on faqs for select
  using (is_published = true);

-- For the POC demonstration, allow anon CRUD operations so user can test the admin UI immediately
create policy "Anon insert FAQs for POC"
  on faqs for insert
  with check (true);

create policy "Anon update FAQs for POC"
  on faqs for update
  using (true);

create policy "Anon delete FAQs for POC"
  on faqs for delete
  using (true);
