-- LORIS chatbot: narrowly scoped, read-only catalogue queries.
-- Run this script in the Supabase SQL Editor.
-- These functions use SECURITY INVOKER so the caller's RLS policies still apply.
-- No arbitrary SQL is accepted from the chatbot.

CREATE OR REPLACE FUNCTION public.chatbot_search_materials(
    p_search_term text DEFAULT NULL,
    p_limit integer DEFAULT 8
)
RETURNS TABLE (
    id uuid,
    title text,
    author text,
    description text,
    file_type text,
    category_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT
        material.id,
        material.title,
        material.author,
        material.description,
        material.file_type,
        material.category_id
    FROM public.materials AS material
    WHERE material.status = 'published'
      AND (
          material.organisation_id IS NULL
          OR EXISTS (
              SELECT 1
              FROM public."Memberships" AS membership
              JOIN public."Profiles" AS profile
                ON profile.id = membership.user_id
              WHERE profile.auth_user_id = (SELECT auth.uid())
                AND membership.organisation_id = material.organisation_id
                AND membership.status = 'active'
          )
      )
      AND (
          NULLIF(btrim(p_search_term), '') IS NULL
          OR material.title ILIKE '%' || btrim(p_search_term) || '%'
          OR COALESCE(material.author, '') ILIKE '%' || btrim(p_search_term) || '%'
          OR COALESCE(material.description, '') ILIKE '%' || btrim(p_search_term) || '%'
      )
    ORDER BY material.title
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 20);
$$;

CREATE OR REPLACE FUNCTION public.chatbot_count_materials(
    p_search_term text DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT count(*)
    FROM public.materials AS material
    WHERE material.status = 'published'
      AND (
          material.organisation_id IS NULL
          OR EXISTS (
              SELECT 1
              FROM public."Memberships" AS membership
              JOIN public."Profiles" AS profile
                ON profile.id = membership.user_id
              WHERE profile.auth_user_id = (SELECT auth.uid())
                AND membership.organisation_id = material.organisation_id
                AND membership.status = 'active'
          )
      )
      AND (
          NULLIF(btrim(p_search_term), '') IS NULL
          OR material.title ILIKE '%' || btrim(p_search_term) || '%'
          OR COALESCE(material.author, '') ILIKE '%' || btrim(p_search_term) || '%'
          OR COALESCE(material.description, '') ILIKE '%' || btrim(p_search_term) || '%'
      );
$$;

-- Remove the default PUBLIC/anon execution path; only signed-in users may call these.
REVOKE ALL ON FUNCTION public.chatbot_search_materials(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.chatbot_count_materials(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chatbot_search_materials(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chatbot_count_materials(text) TO authenticated;
