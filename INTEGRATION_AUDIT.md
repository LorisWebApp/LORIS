# LORIS integration audit and repair handoff

This archive is the repaired integration of the submitted Group A, Group B, Group C, and Nathan work into the `LORIS-main` application. The integration keeps the main application's shared layout, Supabase/RLS architecture, role-aware routes, and protected upload/file-service contracts as the base. Group submissions were not copied wholesale where they contained mock data, unprotected API calls, placeholder buttons, or duplicate architecture.


## Group A — authentication, registration, and role routing

**Retained:** the integrated role-aware Supabase Auth context, profile/membership resolution, protected routes, public catalogue access, organisation registration, role-specific login routing, and the existing public landing/auth pages.

**Retained over the Group A submission:** the integrated AuthContext and login/register flow are more complete than the submitted standalone version. The standalone version omits membership resolution/pending-request blocking and has simpler routing. Those regressions were not adopted.

**Added route compatibility:** `/platform/dashboard` now aliases the protected Platform Manager dashboard, while `/platform` remains the integrated route.

## Group B — catalogue, material details, uploads, organisation admin

**Applied in the integrated app:**
- Removed separate `Materials` and `Members` items from the organisation-admin global navigation. Both pages remain reachable from the Library Management dashboard cards and remain role-protected.
- Added `/manage/table` as an alias for the protected materials-management page, matching Group B's dashboard link.
- Catalogue material cards now have persistent Favourite controls for book/ebook, audio, video, and visual material cards, using Group C's favourites service/table rather than local-only React state.
- Material Details now has the persistent Favourite control.
- Material Details supports image viewing and an open/download action for unsupported browser-reader formats.
- The “My saved resources” action navigates to My Library instead of showing a placeholder toast.
- Materials editing is isolated in a child form so typing does not recreate the modal/focus trap. Cover uploads use the existing authenticated, organisation-scoped upload service. Failed metadata updates trigger best-effort cleanup of the newly uploaded cover object.
- Archive and delete operations now check whether Supabase actually returned an affected record, so blocked/no-op writes are not reported as success.

**Not adopted:** Group B's mock Members/invitation behavior, fake catalogue controls, and upload flow that omits the integrated authentication/organisation headers. The integrated Members page and secured UploadMaterial flow are retained.

## Group C — end-user library and reader

**Retained:** dashboard, reading shelf, My Library, Favourites, reader controls, page navigation, bookmarks, notes, highlights, reading progress, reading history, profile, settings, and support tickets.

**Repaired/restored from the Group C source:**
- Full dashboard service: bookmarked materials are populated; recommendations exclude bookmarked materials; recent notes/highlights retain material title, page, text/quote, colour, and timestamps.
- Reader save recovery: a failed reading-progress save retains the pending progress instead of silently discarding it.
- Reader text selection support on touch screens, font-scale bounds, and the submitted text-protection handlers are restored.
- Reading activity is recorded when reading progress saves. An additive migration `database/migrations/20261123_reading_activity.sql` creates the supporting table, unique user/day index, RLS owner policy, and authenticated grants.
- Favourite controls were added to the Catalogue and Material Details, not just to My Library/dashboard cards.

**EPUB:** the online Reader service continues to parse EPUBs through the submitted EPUB service. Group C's separate EPUB component is retained as source, but the main Reader route uses the integrated Reader service.

**Offline:** Group C's offline storage is not active in the main application. My Library's offline filter and dashboard offline summary now read Group D's IndexedDB store. The legacy Group C offline page route redirects to Group D's Offline Library.

## Group D — chatbot, PWA, and offline files

**Retained:** the rule-based LORIS assistant, service-worker/app-shell registration, IndexedDB offline material store, offline permission/expiry checks, storage summary, removal/purge controls, and sync queue/server endpoints.

**Reconnected:** Material Details now provides a `Save offline` action. It obtains an authenticated server-issued offline grant, retrieves the protected file with the user's access token, and stores the Blob/metadata in Group D IndexedDB. The Group D Offline Library opens PDFs/images/audio/video through the browser's native viewer and routes EPUBs to the new offline EPUB reader.

**Limitation:** the Group D sync queue is not yet connected to Group C notes/bookmarks/highlights/reading-progress write operations. Those Group C annotation writes still require an online Supabase session. Offline file saving/opening is integrated; annotation sync is not complete.

## Nathan — organisation requests and hybrid sessions

**Active/retained:** the Platform Manager organisation-request review page, pending/approved/rejected filters, approve/reject RPC, route, and global navigation entry. Successful decisions attempt to notify the applicant using the existing server endpoint; email failure is reported separately from the saved decision.

**Hybrid sessions:** Nathan's hybrid-session backend and migrations are included under `server/hybrid-sessions/` and `database/migrations/hybrid-sessions/`, but they are **not activated in the frontend auth flow**. Group A currently uses the Supabase client session and direct RLS-scoped queries. Replacing it with cookie-based sessions without adapting those query flows would break authentication/data access. The session backend is therefore isolated pending an explicit auth architecture integration.

**Not integrated:** extra Nathan Platform Manager pages, alternative auth architecture, expanded chatbot/database work, and mock or duplicate backend flows outside the approved scope.

## Database changes

All migrations in the archive are included for review, not automatically applied. The new reading-activity migration is additive. Nathan's hybrid-session migrations create the session table/add lock columns and indexes/policies; they do not delete application data. The broader security/organisation migrations change RLS policies and permissions and must be reviewed against the current Supabase schema before execution.

## Verification performed

- Relative source import-path scan: **0 missing relative imports**.
- `node --check server/index.js`: passed.
- `node --check server/hybrid-sessions/index.js`: passed.
- TypeScript check was attempted but could not complete because this working container has no installed project dependencies/type packages (`react`, `vite/client`, `node` types, etc.).
- `npm ci` could not complete in this environment; offline install failed because the `epubjs` package was not cached. The root lockfile was updated from the submitted Group C lockfile so it includes `epubjs` and its dependency graph.
- **No browser, Supabase, R2, email, or end-to-end tests were run.** The archive is repaired and statically checked to the extent possible, but is not build/runtime-verified.

## First-run commands

From `LORIS-main/`:


```powershell
npm ci
npm run dev
```

For the Express service, install and run from `server/` using its package scripts. Keep secrets in local environment files and do not commit them. Review/apply the database migrations separately; they are not executed by the application.
