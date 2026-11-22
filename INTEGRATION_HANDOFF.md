# LORIS integration handoff

See `INTEGRATION_AUDIT.md` for the group-by-group audit and integration decisions.


## What was repaired in this pass

- Persistent Favourite buttons on Catalogue cards and Material Details.
- The Catalogue's My saved resources button now navigates to My Library.
- Group B's removed Materials/Members navigation tabs are applied; their pages remain accessible from Library Management.
- Group B's `/manage/table` route is supported.
- Group B's image viewing/open-download behavior is adapted without removing authentication.
- Materials edit form is isolated from the parent so the modal does not lose focus while typing; cover upload uses authenticated organisation headers and best-effort object cleanup if metadata update fails.
- Archive/delete report no-op or blocked database writes rather than falsely claiming success.
- Group C dashboard bookmark/recommendation/annotation data, reader save recovery, text selection/protection, and bounded font scaling are restored.
- Group D offline storage is now the active offline source for My Library and dashboard summaries; a Save offline action is connected to the server-issued grant/download flow. EPUBs saved offline open in the new offline EPUB reader.
- Platform Manager Requests is linked from navigation and sends applicant notification after an approve/reject decision when the server notification endpoint succeeds.
- Reading activity migration added.


## Important integration boundaries

- Nathan hybrid sessions remain a separate backend service and are not activated in the frontend auth flow.
- Group D sync queue is not yet wired to Group C annotation/progress write operations.
- Group C's old offline implementation remains as legacy source code in the module tree but is not the main application's offline route or data source.
- Online Reader's structured PDF document endpoint must exist on the server for online PDF reading. Group D offline files open in the browser's native viewer; EPUBs use the offline EPUB route.


## Test status

- Relative import scan: 0 missing paths.
- Node syntax check for both Express servers: passed.
- TypeScript/build could not be completed because project dependencies were not installed. `npm ci` timed out; an offline install failed because `epubjs` was not cached. No browser, Supabase, R2, or end-to-end verification was performed.


## Run

From the frontend project root:


```powershell
npm ci
npm run dev
```

Review SQL migrations before applying them to Supabase. Keep environment secrets local and out of source control.
