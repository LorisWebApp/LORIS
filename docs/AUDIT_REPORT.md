# LORIS production-readiness audit (2026-11-15)

Scope: static + build verification of the integrated project, plus a runtime test of the new server
endpoints against a **stub** Supabase. No live Supabase, Cloudflare R2 or browser was available, so
nothing below marked WORKING was exercised end-to-end against real infrastructure.

Status key: WORKING (verified) · PARTIAL · BROKEN · NOT IMPLEMENTED · NOT VERIFIED (needs live env)

## Verification results
| Check | Result |
|---|---|
| `tsc -b` (before and after changes) | PASS, 0 errors |
| `vite build` (dummy env vars) | PASS |
| `node --check server/index.js` | PASS |
| `oxlint` | 0 errors, 42 warnings (pre-existing style warnings) |
| New server endpoints vs stub Supabase | PASS: 401 w/o token, permission allow/deny, wrong-org deny, sync synced/conflict/failed, replay deduped (1 DB write for 2 submissions), disallowed origin 403 |
| Live auth / RLS / R2 / browser flows | NOT VERIFIED |
| Automated test suite | NONE EXISTS in the project |

## Findings
| # | Feature | Status | Problem / root cause | Files | Sev | Action |
|---|---|---|---|---|---|---|
| 1 | Login redirect | BROKEN → FIXED | `Login.tsx` always `navigate('/')` after a 2 s timeout, so every role landed on the landing page | `group-a/pages/auth/Login.tsx` | Critical | Resolve role first, then route: PM→`/platform`, active org admin→`/manage`, else `/dashboard` |
| 2 | Role resolution race | BROKEN → FIXED | Profile loaded asynchronously after `SIGNED_IN`; `GlobalLayout` and `RequireRole` each fetched memberships separately, producing "Access denied"/wrong-nav flashes | `AuthContext.tsx`, `GlobalLayout.tsx` | High | Single source: AuthContext loads Profiles+Memberships, `loading` covers both; guards wait on it |
| 3 | Route guards | PARTIAL → FIXED | Wrong-role users hit a dead "Access denied"; signed-in users could open login pages | `GlobalLayout.tsx`, `App.tsx` | Medium | Redirect to own home; `PublicOnly` wrapper on login/register |
| 4 | `/organisation/login` | BROKEN → FIXED | Linked from landing page, no route (fell through to `/`) | `App.tsx` | Medium | Routed to the same role-aware login |
| 5 | Registration | PARTIAL → FIXED | No `emailRedirectTo`; duplicate email silently "succeeded" (Supabase returns empty identities) | `Register.tsx` | Medium | Redirect to `/personal/login`; detect duplicate |
| 6 | Unverified email | PARTIAL → FIXED | Raw Supabase error shown | `Login.tsx` | Low | Friendly message |
| 7 | Missing profile row | PARTIAL → FIXED | Users created before the trigger had no Profiles row and could not log in usefully | `AuthContext.tsx` | Medium | Self-heal insert (RLS only allows own row, `end_user`) |
| 8 | Offline permission/sync/download/renew endpoints | NOT IMPLEMENTED → FIXED | Group C/D call `/api/materials/offline-permission`, `/api/offline/sync`, `/api/offline/materials/:id/download`, `/api/offline/renew`, none existed | `server/index.js` | High | Implemented; authorised with the **caller's JWT** so RLS decides, service role only used for the grant audit row |
| 9 | API base URLs | BROKEN → FIXED | Group D adapter had no base URL (hit the static host); Group C appended paths to the server origin without `/api` | `integration/loris.ts`, `group-c/services/userApi.ts` | High | Both resolve to `VITE_API_BASE_URL` (+`/api`) |
| 10 | Offline download auth | BROKEN → FIXED | Group C fetched the grant URL with no bearer token | `offlineStorage.ts` | High | Sends token; new authenticated `GET /api/materials/:id/file` |
| 11 | Offline library duplication | PARTIAL | Two disjoint stores: Group D `loris-offline` (nothing ever calls `saveMaterialForOffline`; `queueOfflineChange` never called) and Group C `library-offline` (encrypted, actually fed by Favourites downloads). The routed `/offline-library` page reads only the Group D store, so it is always empty | `group-d/offline/*`, `group-c/services/offline/*`, `App.tsx` | High | Group C page now routed at `/offline-library/downloads`. **Not unified**: see recommendation |
| 12 | Platform approval workflow | NOT IMPLEMENTED → FIXED (needs migration) | Dashboard read-only; no approve/reject; stats counted only last 10 rows | `PlatformDashboard.tsx`, new migration | High | Atomic `loris_review_organisation_request` RPC + buttons + real counts + organisation list |
| 13 | Material management scoping | PARTIAL → FIXED | Fetched all materials, relying solely on RLS (which also exposes org-less published rows) | `ManageMaterials.tsx` | Medium | Filter to administered organisations |
| 14 | Archive | BROKEN → FIXED | DB error ignored; always showed success | `ManageMaterials.tsx` | Medium | Check error |
| 15 | Member management | PARTIAL → FIXED | Admin could suspend/demote self, orphaning the org | `Members.tsx` | Medium | Guard |
| 16 | AI assistant | PARTIAL | UI is complete (floating bubble, ~33vw panel, blurred overlay, history, loading). Replies come from a **client-side rule-based FAQ engine**; `VITE_ASSISTANT_API_URL`/`/assistant/query` has no backend. It is not an AI model. Hidden for admins/PMs | `components/assistant/*`, `group-d/chatbot/*` | Medium | Not changed; needs a real service |
| 17 | File URLs | PARTIAL (security) | Uploads return public bucket URLs; these bypass RLS entirely | `server/index.js`, `MaterialDetails.tsx` | High | New authenticated file route works with **private** buckets; UI still uses `file_url`. Make buckets private, then switch the viewers to `/api/materials/:id/file` |
| 18 | Org registration / invitation codes | PARTIAL | Registration (auth required) writes `organisation_requests`. Code entry, `ManageUsers`, other Nathan pages exist but are not routed and call non-existent REST contracts. No invitation table, so a user has no way to join an organisation (no pending-membership path) | `modules/nathan/*` | High | Needs schema + flow design |
| 19 | Multi-organisation admin upload | NOT IMPLEMENTED | `getUploadAuthContext` throws if the admin has >1 org and no selector exists | `uploadAuth.ts` | Low | Add selector |
| 20 | Reader | PARTIAL | Expects a parsed `ReaderDocument` endpoint that does not exist | `readerContent.service.ts` | High | Needs backend or direct PDF/EPUB rendering |
| 21 | Notifications / support | PARTIAL | Notifications are empty by design (no table). Support tickets save initial request only; no replies/admin queue | `integration/loris.ts`, `support.service.ts` | Medium | Needs schema |
| 22 | Group B delete order | PARTIAL | R2 objects removed before DB row; if the DB delete fails the row points at deleted files | `ManageMaterials.tsx` | Low | Server verifies against the row, so order is constrained; consider soft delete |
| 23 | Rate limiting | PARTIAL | In-memory, single process | `server/index.js` | Low | Redis/gateway for multi-instance |
| 24 | Secrets | WORKING (reviewed) | No service-role or R2 keys in frontend source; server reads them from env | repo-wide grep | — | — |
| 25 | Service worker | PARTIAL | Registered only in production builds; caches app shell, never `/api/`. Not exercised in a browser | `public/service-worker.js` | — | NOT VERIFIED |
| 26 | Offline encryption | PARTIAL | Group C AES-GCM with non-extractable device key is implemented and used for its store. Group D store is unencrypted blobs. Encryption is not DRM | `offlineEncryption.ts` | Low | Unify on Group C store |

## Unified offline recommendation
Use Group C's encrypted IndexedDB store as the single store (it is the one actually populated, is encrypted, and
carries an expiry). Port Group D's Offline Library UI (visual reference) onto Group C's `useOfflineLibrary`, route the
Group D permission/sync calls through the endpoints now provided, and retire `loris-offline` once migrated.
Nothing was deleted in this pass.

## Outstanding / manual
1. Apply, in order, after review: `20261115_security_rls_and_org_ownership.sql`, `20261116_platform_request_review.sql`.
   Neither was run. Confirm the `Organisation` column names (`"organisation name"`, `"province/state"`, `"city/town"`, `"postal code"`) against the live table; the migration also needs table GRANTs for `authenticated` verified.
2. The new server routes depend on that RLS migration for authorisation. Without it they only rely on whatever policies exist.
3. Supabase dashboard: add production Site URL and redirect URLs (`/personal/login`, `/reset-password`), enable email confirmation, CAPTCHA, leaked-password protection, MFA.
4. Set `VITE_API_BASE_URL` (server origin) and server env incl. `FRONTEND_ORIGIN`, `OFFLINE_ACCESS_DAYS`.
5. Create at least one `platform_manager` profile manually in SQL (by design no UI can promote).
6. Backfill `materials.organisation_id` for existing rows.
7. Make R2 buckets private and move viewers to the authenticated file route.
8. Browser testing of login by role, email confirmation, PWA install/offline, and the assistant layout is still required.
