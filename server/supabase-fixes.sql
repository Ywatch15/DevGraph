-- ============================================================
-- DevGraph – Fix Supabase Advisor Warnings
-- Run this AFTER the main schema
-- ============================================================
-- Fix 1: Set search_path on all functions (prevents search_path injection)
ALTER FUNCTION public.handle_new_user()
SET search_path = '';
ALTER FUNCTION public.update_updated_at()
SET search_path = '';
ALTER FUNCTION public.update_notes_fts()
SET search_path = '';
ALTER FUNCTION public.sync_tag_counts()
SET search_path = '';
ALTER FUNCTION public.get_user_category_counts(UUID)
SET search_path = '';
ALTER FUNCTION public.get_user_tag_counts(UUID, INTEGER)
SET search_path = '';
ALTER FUNCTION public.get_user_timeline(UUID)
SET search_path = '';
-- Fix 2: Tighten relations RLS policies (only allow users to manage their own notes' relations)
DROP POLICY IF EXISTS relations_insert ON relations;
DROP POLICY IF EXISTS relations_delete ON relations;
CREATE POLICY relations_insert ON relations FOR
INSERT TO authenticated WITH CHECK (
        source_id IN (
            SELECT id
            FROM public.notes
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY relations_delete ON relations FOR DELETE TO authenticated USING (
    source_id IN (
        SELECT id
        FROM public.notes
        WHERE user_id = auth.uid()
    )
);