# LORIS integration status – implementation pass 1

## Consolidated application foundation implemented

- Group D root `src/` selected as the canonical application shell and visual-system source; the nested `loris-frontend` copy was not made a second app.
- Missing Group D chatbot UI modules (`Composer`, `useChatSession`, `useSpeechInput`, `ChatInterface`) copied from the nested copy into the canonical tree.
- One Vite entry point and router established.
- Group A Supabase client and AuthProvider used as the only active authentication provider.
- Group B, Group C and Nathan source trees retained under `src/modules/` so their existing source is preserved.
- Group B catalogue, material details, organisation overview, material management, members and upload pages connected to routes.
- Group C dashboard, favourites, notes/bookmarks, profile, settings, support and reader pages connected to routes; Group C's separate navigation layout is now content-only so the global shell owns navigation.
- Group D offline library, showcase, PWA and floating assistant retained; only the canonical Group D service-worker registration is called from the application entry point.
- A single global navigation component added. Its visible tabs derive from `Profiles.platform_role` and active `Memberships.role` values.
- A live-data Platform Manager dashboard added for organisations and organisation registration requests.
- Group C favourites, reading progress, notes, bookmarks, highlights, library and profile service paths moved away from their former mock-first/API-stub implementations toward the supplied Supabase tables. End-user support requests now use the additive `support_tickets` table migration.
- Group C mock mode hard-disabled; its old mock data modules remain in the source tree for historical reference but are not selected by runtime service branches.
- Atlas user-facing references replaced with LORIS in the consolidated source tree.
- Group D demo seed helper removed from the runtime/source bundle.
- Nathan's old `AuthContext` is no longer used; its retained `useAuth` hook adapts to Group A's Supabase session and maps the database roles. Nathan's mock HTTP fallback and mock server were removed.
- The expressly out-of-scope Nathan pages listed in the user-approved removal list were removed; `ManageUsers`, organisation overview, registration, code entry and the four retained Platform Manager pages remain in the source tree.

## Security hardening included

- Group B R2 server hardened with Supabase Auth token validation (`/auth/v1/user`), server-side profile and membership checks, allow-listed CORS, per-IP and per-user rate limiting, request limits, MIME/signature validation, organisation-prefixed object keys, protected delete checks and security headers.
- Group B upload and material-management pages updated to send bearer tokens and organisation IDs, save `uploaded_by` and `organisation_id`, and clean up R2 objects if metadata insertion fails.
- Additive SQL migration prepared for `materials.organisation_id`, `organisation_requests`, support tickets, permission helpers, profile creation trigger and RLS policies for the supplied tables.
- Migration has NOT been run. No database records were modified.

## Still incomplete – do not treat this package as production complete

1. Nathan's organisation registration and organisation-code pages are retained but are not yet connected to a completed public registration/invitation backend. The provided schema has no invitation-code table; a reviewed migration and backend flow are still needed.
2. Nathan's four retained Platform Manager pages and `ManageUsers` remain in source but are not yet fully wired into the active router/data layer. The active Platform Manager dashboard is the new direct-Supabase dashboard. The other pages still contain old API-contract assumptions.
3. Group C's reader still expects a structured `ReaderDocument` endpoint. The current database stores file URLs and metadata but does not store parsed page text; PDF/EPUB parsing and a secure material-file delivery strategy remain unresolved.
4. Group C offline permissions/synchronisation still references `/api/materials/offline-permission` and `/api/offline/sync`; those endpoints are not implemented in the included R2 server. Group D IndexedDB/PWA foundations remain, but end-to-end offline permission and sync are not verified.
5. Group C support response threads are not represented in the supplied schema; the added `support_tickets` table stores initial requests/status only. A ticket-replies table/workflow is still needed if threaded support responses must persist.
6. Full visual redesign of every Group B and Nathan page to Group D's system is not finished. The global shell is in place, but some Group B pages retain their original internal headers, styles and page-level navigation elements.
7. Organisation ownership migration is nullable by design. Existing materials remain `organisation_id = NULL` until manually verified and backfilled.
8. The R2 API's in-memory rate limiter is single-process only. Use Redis or an API gateway for multi-instance production deployment.
9. Supabase Auth project-level rate limits, CAPTCHA, leaked-password protection, MFA and production redirect/origin settings must be configured in the Supabase dashboard.
10. Private R2 object delivery or short-lived signed URLs are still needed if materials must be restricted. Public R2 URLs are not protected by database RLS.

## Verification performed

- `node --check server/index.js` passed.
- The frontend dependency installation timed out in this environment. `node_modules` was not available, so TypeScript and production Vite build could not be run.
- No Supabase or R2 credentials were present. No live authentication, database, upload, deletion, RLS or offline-sync workflow was tested.
- SQL migration was inspected as a file only; it was not executed.

## Database migration safety

The migration uses additive table/column/function/trigger/policy creation and only drops/recreates the specifically named LORIS policies to make reruns idempotent. It does not drop tables, truncate data or reset the database. Review existing policies and grants before applying because permissive RLS policies combine with OR semantics.
