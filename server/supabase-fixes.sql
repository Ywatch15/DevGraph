-- ============================================================
-- Fix: sync_tag_counts trigger uses empty search_path
-- Must use fully-qualified table names (public.tags)
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION sync_tag_counts()
RETURNS TRIGGER AS $$
DECLARE
  t TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOREACH t IN ARRAY COALESCE(NEW.tags, '{}') LOOP
      INSERT INTO public.tags (name, usage_count) VALUES (LOWER(TRIM(t)), 1)
        ON CONFLICT (name) DO UPDATE SET usage_count = public.tags.usage_count + 1;
    END LOOP;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      FOREACH t IN ARRAY COALESCE(OLD.tags, '{}') LOOP
        UPDATE public.tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE name = LOWER(TRIM(t));
      END LOOP;
      FOREACH t IN ARRAY COALESCE(NEW.tags, '{}') LOOP
        INSERT INTO public.tags (name, usage_count) VALUES (LOWER(TRIM(t)), 1)
          ON CONFLICT (name) DO UPDATE SET usage_count = public.tags.usage_count + 1;
      END LOOP;
      DELETE FROM public.tags WHERE usage_count <= 0;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    FOREACH t IN ARRAY COALESCE(OLD.tags, '{}') LOOP
      UPDATE public.tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE name = LOWER(TRIM(t));
    END LOOP;
    DELETE FROM public.tags WHERE usage_count <= 0;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Also fix the other functions to use public. prefix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION update_notes_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.code_snippet, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- RPC functions also need schema-qualified names
CREATE OR REPLACE FUNCTION get_user_category_counts(uid UUID)
RETURNS TABLE(category TEXT, count BIGINT) AS $$
  SELECT category, COUNT(*) FROM public.notes WHERE user_id = uid GROUP BY category;
$$ LANGUAGE sql STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION get_user_tag_counts(uid UUID, lim INTEGER DEFAULT 15)
RETURNS TABLE(tag TEXT, count BIGINT) AS $$
  SELECT UNNEST(tags) AS tag, COUNT(*) AS count
  FROM public.notes WHERE user_id = uid
  GROUP BY tag ORDER BY count DESC LIMIT lim;
$$ LANGUAGE sql STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION get_user_timeline(uid UUID)
RETURNS TABLE(month TEXT, count BIGINT) AS $$
  SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count
  FROM public.notes WHERE user_id = uid
  GROUP BY month ORDER BY month;
$$ LANGUAGE sql STABLE
SET search_path = '';