
-- =====================================================
-- LORIS Distributed Session Refresh Lock
-- Additive migration; preserves existing sessions.
-- =====================================================

ALTER TABLE public.app_sessions
ADD COLUMN IF NOT EXISTS refresh_lock_owner uuid,
ADD COLUMN IF NOT EXISTS refresh_lock_until timestamptz;

-- A lock must have both an owner and an expiry,
-- or neither.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'app_sessions_refresh_lock_check'
          AND conrelid = 'public.app_sessions'::regclass
    ) THEN
        ALTER TABLE public.app_sessions
        ADD CONSTRAINT app_sessions_refresh_lock_check
        CHECK (
            (refresh_lock_owner IS NULL AND refresh_lock_until IS NULL)
            OR
            (refresh_lock_owner IS NOT NULL AND refresh_lock_until IS NOT NULL)
        );
    END IF;
END
$$;

COMMENT ON COLUMN public.app_sessions.refresh_lock_owner IS
'Unique owner identifier for the process currently refreshing this session.';

COMMENT ON COLUMN public.app_sessions.refresh_lock_until IS
'Lease expiry for the distributed session refresh lock.';
