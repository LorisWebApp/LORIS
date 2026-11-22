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

---
# Addendum: Copyright protection & restricted material access (this pass)

Verification level: `tsc -b` and `vite build` pass (run in this pass). No browser, Supabase, R2 or device testing was performed; everything below marked "static" was inspected/compiled only.

| Area | Change | Status |
|---|---|---|
| Online PDF viewing | Replaced native `<iframe src=file_url#toolbar=0>` (toolbar flag is advisory) with canvas-rendered `ProtectedPdfViewer` (pdfjs-dist 4.10.38): no text layer, no native download/print/save UI | Static |
| Online audio/video/image | Now fetched via authenticated `GET /api/materials/:id/file` (bearer token) into a blob; `controlsList=nodownload`, context menu/drag blocked | Static |
| "Download / Open File" button | Removed from Material Details (opened the raw public storage URL) | Static |
| Offline PDF/media | `/offline-viewer/:id` (new) renders from IndexedDB via the same controlled viewer; no more blob URL opened in a native tab. EPUB keeps `/offline-reader/:id` | Static |
| `openInReader` fallback | Native-viewer fallback removed | Static |
| Catalogue cover | No longer falls back to the original `file_url` as image | Static |
| File endpoint headers | Added `Content-Disposition: inline`, `X-Content-Type-Options: nosniff` (already `private, no-store`, authenticated, RLS-checked) | Static |
| Global deterrents | Existing `ContentProtection` (copy/cut/contextmenu/dragstart/Ctrl+P/S/U) retained; added print-hiding CSS and touch-callout/drag CSS for media. Selection stays enabled so Group C highlights/notes (`PageText`, which also blocks copy/cut/drag/context menu) keep working | Static |

## Known limitations (must be addressed outside this code pass)
1. **Public storage URLs still exist.** `materials.file_url` stores the public R2 URL (`URL_PDF`, etc.) and authenticated clients can still read that column. Frontend no longer uses it for viewing, but anyone with the URL can fetch the file. Real enforcement requires making the R2 buckets private (disable public access/custom domain) and relying only on `/api/materials/:id/file`, plus restricting the `file_url` column from client SELECT. This is an infrastructure change and was NOT performed. Admin pages (ManageMaterials) and the upload response still use these URLs.
2. Online EPUB reader (Group C `EpubReader`/`PageText`) was not re-audited in this pass beyond confirming copy/cut/drag/contextmenu handlers exist in `PageText`; the structured online PDF endpoint noted in INTEGRATION_HANDOFF.md is still absent, so PDFs are shown by the new viewer from MaterialDetails rather than the Group C Reader.
3. The new PDF viewer has no highlights/notes/bookmarks (those remain EPUB/text-reader features).
4. Screenshots, screen recording, devtools network inspection and memory extraction cannot be prevented; the blob is in browser memory while viewing. This is deterrence, not DRM.
5. Large PDFs/videos are fully downloaded into memory before display (no range streaming).
6. Not tested: mobile long-press/touch behaviour, Ctrl+C/right-click behaviour in real browsers, offline open of PDFs end-to-end.

---
# Addendum 2: integration corrections (this pass)
**Group A.** Previous `PlatformDashboard` was a custom table page, not Group A's. Replaced with Group A's actual `platform-manager/Dashboard.tsx` (same layout/colours/cards/Platform Overview/Quick Actions). Changes: nav bar moved to the shared layout, debug `console.log` removed, Quick Actions wired, dead "Manage Users" button and "will become available" note removed, uses integrated auth/supabase. It calls RPC `get_platform_dashboard_stats`, which did not exist anywhere; added additive migration `20261124_platform_dashboard_stats.sql` (not executed). Platform nav = Dashboard, Organisations (new `/platform/organisations`, real data), Requests. Group A's Users/Activity/Profile entries had no pages or backend and expanded Platform Manager scope is not approved, so they are omitted.
**Nathan / Requests.** Nathan's page depends on his own service layer and `accepted/more_details` schema; kept the integrated `organisation_requests` + `loris_review_organisation_request` backend and added what was missing: details modal, confirm modal with notes (required for rejection), search, sort, pagination, duplicate-submit guard. Sessions backend remains NOT wired to the frontend.
**Group B navigation.** Group B's sidebar: Browse library, Admin Dashboard (/manage), Upload Material. Main had Dashboard, Library management, Materials, Members, Upload. Org Admin nav is now Dashboard (→/manage, previously the "Dashboard" tab pointed at the end-user dashboard and bounced), Catalogue, Upload. Library management/Materials/Members tabs are consolidated into the dashboard's cards (routes retained). Dashboard breadcrumb fixed (`/` → `/catalogue`). Interpretation of "which tabs" is derived from Group B's sidebar; please confirm.
**PDF reading.** Server has no `reader-document` endpoint, so PDFs could not use the Group C Reader. Added client-side `pdfContent.service.ts` (authenticated fetch + pdf.js text extraction) so PDFs get bookmarks/notes/highlights/progress; scanned PDFs report no text and can use "View pages".
**Group C diff.** Only 5 Group C files differ from the originals; all differences are the intentional Group D offline substitution plus the restored dashboard data. Favourite/Bookmark components are Group C's own.
**Still not done / unverified:** every browser journey; Profile/Settings/Support/Notes pages not re-audited; Group D sync queue not connected to notes/progress; hybrid sessions inactive; chatbot not audited; mobile layout not checked; Org Admin dashboard queries rely on RLS for org scoping.
