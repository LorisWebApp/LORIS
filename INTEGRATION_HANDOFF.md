# LORIS selective integration handoff

This archive is a selective integration based on `LORIS-main` and the group submission ZIP. It was packaged without running build or workflow tests, per the handoff request.


## Included changes

- Added the Platform Manager **Organisation Requests** route (`/platform/requests`) and page. It uses the existing Supabase client and `loris_review_organisation_request` RPC to list/filter request status and approve/reject pending requests.
- Added Requests to the Platform Manager navigation.
- Integrated Group C's EPUB reading service into the existing Reader document loader and copied the EPUB reader component.
- Updated Group B's Material Details page to open EPUB files in the existing Reader route.
- Added Nathan's hybrid-session backend as a separate `server/hybrid-sessions` service, with its SQL migrations in `database/migrations/hybrid-sessions`.
- Added `epubjs` to the frontend dependencies.

## Important session integration note

The hybrid-session backend is included as a separate service so it does not replace the currently used Supabase client/authentication flow. The frontend authentication context and existing direct Supabase data access were not switched to cookie-based hybrid sessions. The session service therefore requires frontend/auth-flow integration and configuration before it can be used as the application's active session system.

## Database migrations

Review the SQL files under `database/migrations/hybrid-sessions` before applying them. Do not apply migrations against production without confirming schema, Supabase configuration, and service secrets.


## Dependencies

Run `npm install` in the frontend project to refresh the dependency lockfile for the added EPUB dependency. The lockfile refresh attempt could not complete in this environment. The frontend project was not build-tested.
