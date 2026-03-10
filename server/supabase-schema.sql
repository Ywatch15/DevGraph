-- ============================================================
-- DevGraph Supabase Schema (corrected)
-- Run this in Supabase SQL Editor
-- ============================================================
-- 1. PROFILES TABLE (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, name, email)
VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 2. NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (
        char_length(title) BETWEEN 1 AND 200
    ),
    description TEXT DEFAULT '',
    code_snippet TEXT DEFAULT '',
    language TEXT DEFAULT 'javascript',
    tags TEXT [] DEFAULT '{}',
    "references" TEXT [] DEFAULT '{}',
    source_url TEXT DEFAULT '',
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    category TEXT DEFAULT 'other' CHECK (
        category IN (
            'bug-fix',
            'snippet',
            'architecture',
            'command',
            'config',
            'learning',
            'other'
        )
    ),
    related_notes UUID [] DEFAULT '{}',
    fts TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_visibility ON notes(user_id, visibility);
CREATE INDEX IF NOT EXISTS idx_notes_visibility_updated ON notes(visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_fts ON notes USING GIN(fts);
-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_updated_at ON notes;
CREATE TRIGGER set_updated_at BEFORE
UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Trigger: maintain full-text search tsvector column
CREATE OR REPLACE FUNCTION update_notes_fts() RETURNS TRIGGER AS $$ BEGIN NEW.fts := setweight(
        to_tsvector('english', COALESCE(NEW.title, '')),
        'A'
    ) || setweight(
        to_tsvector(
            'english',
            COALESCE(array_to_string(NEW.tags, ' '), '')
        ),
        'B'
    ) || setweight(
        to_tsvector('english', COALESCE(NEW.description, '')),
        'C'
    ) || setweight(
        to_tsvector('english', COALESCE(NEW.code_snippet, '')),
        'D'
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_notes_fts ON notes;
CREATE TRIGGER set_notes_fts BEFORE
INSERT
    OR
UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_notes_fts();
-- 3. TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
-- Trigger: auto-maintain tag counts when notes change
CREATE OR REPLACE FUNCTION sync_tag_counts() RETURNS TRIGGER AS $$
DECLARE t TEXT;
BEGIN IF TG_OP = 'INSERT' THEN FOREACH t IN ARRAY COALESCE(NEW.tags, '{}') LOOP
INSERT INTO tags (name, usage_count)
VALUES (LOWER(TRIM(t)), 1) ON CONFLICT (name) DO
UPDATE
SET usage_count = tags.usage_count + 1;
END LOOP;
RETURN NEW;
END IF;
IF TG_OP = 'UPDATE' THEN IF OLD.tags IS DISTINCT
FROM NEW.tags THEN FOREACH t IN ARRAY COALESCE(OLD.tags, '{}') LOOP
UPDATE tags
SET usage_count = GREATEST(usage_count - 1, 0)
WHERE name = LOWER(TRIM(t));
END LOOP;
FOREACH t IN ARRAY COALESCE(NEW.tags, '{}') LOOP
INSERT INTO tags (name, usage_count)
VALUES (LOWER(TRIM(t)), 1) ON CONFLICT (name) DO
UPDATE
SET usage_count = tags.usage_count + 1;
END LOOP;
DELETE FROM tags
WHERE usage_count <= 0;
END IF;
RETURN NEW;
END IF;
IF TG_OP = 'DELETE' THEN FOREACH t IN ARRAY COALESCE(OLD.tags, '{}') LOOP
UPDATE tags
SET usage_count = GREATEST(usage_count - 1, 0)
WHERE name = LOWER(TRIM(t));
END LOOP;
DELETE FROM tags
WHERE usage_count <= 0;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_sync_tags ON notes;
CREATE TRIGGER trigger_sync_tags
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON notes FOR EACH ROW EXECUTE FUNCTION sync_tag_counts();
-- 4. RELATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    relation_type TEXT DEFAULT 'similar' CHECK (
        relation_type IN ('similar', 'references', 'related')
    ),
    weight FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;
-- Profiles
CREATE POLICY profiles_select ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Notes
CREATE POLICY notes_select_own ON notes FOR
SELECT USING (
        user_id = auth.uid()
        OR visibility = 'public'
    );
CREATE POLICY notes_insert ON notes FOR
INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY notes_update ON notes FOR
UPDATE USING (user_id = auth.uid());
CREATE POLICY notes_delete ON notes FOR DELETE USING (user_id = auth.uid());
-- Tags (readable by all authenticated users)
CREATE POLICY tags_select ON tags FOR
SELECT TO authenticated USING (true);
-- Relations
CREATE POLICY relations_select ON relations FOR
SELECT TO authenticated USING (true);
CREATE POLICY relations_insert ON relations FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY relations_delete ON relations FOR DELETE TO authenticated USING (true);
-- 6. HELPER RPC FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_category_counts(uid UUID) RETURNS TABLE(category TEXT, count BIGINT) AS $$
SELECT category,
    COUNT(*)
FROM notes
WHERE user_id = uid
GROUP BY category;
$$ LANGUAGE sql STABLE;
CREATE OR REPLACE FUNCTION get_user_tag_counts(uid UUID, lim INTEGER DEFAULT 15) RETURNS TABLE(tag TEXT, count BIGINT) AS $$
SELECT UNNEST(tags) AS tag,
    COUNT(*) AS count
FROM notes
WHERE user_id = uid
GROUP BY tag
ORDER BY count DESC
LIMIT lim;
$$ LANGUAGE sql STABLE;
CREATE OR REPLACE FUNCTION get_user_timeline(uid UUID) RETURNS TABLE(month TEXT, count BIGINT) AS $$
SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
    COUNT(*) AS count
FROM notes
WHERE user_id = uid
GROUP BY month
ORDER BY month;
$$ LANGUAGE sql STABLE;