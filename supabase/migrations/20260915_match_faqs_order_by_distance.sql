-- ==============================================================================
-- match_faqs: order by vector distance so the HNSW index is used.
-- Only used as a pre-filter when the knowledge base is too large to send to the
-- AI in full (FAQ_FULL_CONTEXT_LIMIT). Same signature as the original function.
-- ==============================================================================

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
language sql
stable
as $$
  select
    faqs.id,
    faqs.question,
    faqs.answer,
    faqs.category,
    faqs.tags,
    (1 - (faqs.embedding <=> query_embedding))::float as similarity
  from faqs
  where faqs.is_published = true
    and faqs.embedding is not null
    and (filter_category is null or faqs.category = filter_category)
    and 1 - (faqs.embedding <=> query_embedding) > match_threshold
  order by faqs.embedding <=> query_embedding
  limit match_count;
$$;
