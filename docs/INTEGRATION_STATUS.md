# LORIS integrated status

The current integration is based on the main `LORIS-main` application. Group A's role-aware Supabase auth remains the active auth system; Group B's secured upload/material management remains the active organisation-admin system; Group C's end-user library and reader features remain active; Group D's IndexedDB/PWA/offline library is the canonical offline implementation. Nathan's organisation requests are active, while hybrid sessions remain isolated.


## Current integration repairs

- Admin global navigation no longer exposes separate Materials or Members tabs; the Library Management dashboard still links to both protected pages.
- Group B's `/manage/table` route is supported. Catalogue cards and Material Details have persistent Favourite controls. Material Details supports image viewing, generic file opening and offline saving.
- The edit form is isolated to preserve focus while typing, and uses the authenticated organisation-scoped cover upload flow. Archive/delete check affected rows.
- Group C dashboard bookmark/annotation data and reader save recovery are restored. Reading activity is recorded with a new additive migration.
- Group C's offline storage is not active. My Library and Dashboard use Group D IndexedDB. The legacy Group C offline route redirects to Group D.
- Group D's Offline Library opens PDFs/images/audio/video in the browser viewer and EPUBs in a dedicated offline EPUB route.
- Platform Manager Requests is routed and visible in navigation. Approve/reject uses the existing RPC and attempts applicant notification.

## Remaining integration boundaries

- Nathan hybrid sessions are included as a separate service but are not active in the frontend auth flow.
- Group D's sync queue is not yet wired to Group C annotation/progress writes; those still need an online session.
- Group C online PDF reading still requires the server's structured reader-document endpoint; the database stores material metadata/file references rather than parsed pages.
- Offline EPUB is handled locally with epubjs. Other offline formats use browser-native viewers; browser popup policy may affect opening.
- Organisation registration/invitation backend completeness and support-ticket reply threads are not verified.


## Verification

- Relative import-path scan: 0 missing paths.
- Node syntax checks for `server/index.js` and `server/hybrid-sessions/index.js`: passed.
- TypeScript/build was blocked by missing installed dependencies. `npm ci` timed out and offline installation could not find cached `epubjs`.
- No live Supabase, R2, email, browser or end-to-end tests were performed.
- SQL migrations are included but not executed. Review RLS/policies against the current database before applying.

See `INTEGRATION_AUDIT.md` for group-by-group decisions and details.
