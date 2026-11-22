-- =====================================================
-- LORIS Opaque Browser Sessions
-- Apply in the Supabase SQL Editor.
--
-- Browser roles cannot directly access this table.
-- The Express service-role key is server-only.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    session_hash text NOT NULL UNIQUE
        CHECK (session_hash ~ '^[a-f0-9]{64}$'),

    auth_user_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    access_token_ciphertext text NOT NULL,

    refresh_token_ciphertext text NOT NULL,

    expires_at timestamptz NOT NULL,

    absolute_expires_at timestamptz NOT NULL,

    created_at timestamptz NOT NULL DEFAULT now(),

    last_used_at timestamptz,

    revoked_at timestamptz,

    -- Absolute expiry must be after session creation.
    CONSTRAINT app_sessions_absolute_expiry_check
        CHECK (absolute_expires_at > created_at),

    -- Session expiry cannot exceed absolute expiry.
    CONSTRAINT app_sessions_expiry_check
        CHECK (
            expires_at > created_at
            AND expires_at <= absolute_expires_at
        ),

    -- Revocation cannot occur before session creation.
    CONSTRAINT app_sessions_revocation_check
        CHECK (
            revoked_at IS NULL
            OR revoked_at >= created_at
        )
);


-- =====================================================
-- INDEXES
-- =====================================================

-- Retrieve active sessions belonging to a user.
CREATE INDEX IF NOT EXISTS app_sessions_user_active_idx
ON public.app_sessions (auth_user_id, absolute_expires_at)
WHERE revoked_at IS NULL;


-- Identify expired sessions for cleanup.
CREATE INDEX IF NOT EXISTS app_sessions_expiry_idx
ON public.app_sessions (expires_at)
WHERE revoked_at IS NULL;


-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;


-- Prevent browser-facing roles from accessing sessions.
REVOKE ALL ON TABLE public.app_sessions
FROM PUBLIC, anon, authenticated;


-- Allow the Express backend to manage sessions.
GRANT ALL ON TABLE public.app_sessions
TO service_role;


-- =====================================================
-- TABLE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.app_sessions IS
'Server-managed opaque browser sessions for LORIS.
Session identifiers are SHA-256 hashed.
Supabase access and refresh tokens are encrypted
using AES-256-GCM before database storage.
Only the server-side service role can access this table.';

COMMENT ON COLUMN public.app_sessions.session_hash IS
'SHA-256 hash of the original opaque browser session identifier.';

COMMENT ON COLUMN public.app_sessions.access_token_ciphertext IS
'AES-256-GCM encrypted Supabase access token.';

COMMENT ON COLUMN public.app_sessions.refresh_token_ciphertext IS
'AES-256-GCM encrypted Supabase refresh token.';

COMMENT ON COLUMN public.app_sessions.expires_at IS
'Idle session expiration timestamp.';

COMMENT ON COLUMN public.app_sessions.absolute_expires_at IS
'Maximum session lifetime regardless of activity.';

COMMENT ON COLUMN public.app_sessions.revoked_at IS
'Timestamp indicating when the session was invalidated.';