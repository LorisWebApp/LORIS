# Button audit (static code inspection only – no browser run)
Legend: "Static" = handler and destination read in code; nothing here was clicked in a browser.
| Page | Button | Action | Backend | Persists | Status |
|---|---|---|---|---|---|
| Platform dashboard | Manage Organisations | navigate /platform/organisations | – | – | Wired (was dead in Group A) |
| Platform dashboard | Review Requests | navigate /platform/requests | – | – | Wired (was dead in Group A) |
| Platform dashboard | Manage Users | **removed** – no users page exists/approved | – | – | Removed, documented |
| Platform nav | Dashboard / Organisations / Requests | routes | – | – | Wired. Group A's Users, Activity, Profile entries removed (no pages) |
| Platform dashboard | Stats cards | RPC get_platform_dashboard_stats | Supabase RPC (needs new migration) | n/a | Static; fails with visible error if migration not applied |
| Requests | Details | opens details modal | – | – | Static |
| Requests | Approve / Reject | confirm modal → RPC `loris_review_organisation_request` (+ notes; rejection requires reason) → email endpoint | Yes | Yes | Static; double-submit blocked; RPC rejects non-pending |
| Requests | tabs, search, sort, pagination, Refresh | filter/refetch | Supabase | – | Static |
| Org Admin nav | Dashboard → /manage, Catalogue, Upload | routes | – | – | Fixed (Dashboard previously → end-user-only route) |
| Org dashboard | Go to uploads / materials / members | /upload, /manage/table, /manage/members | – | – | Static |
| Material details | Read Document (PDF) | opens Reader (text, bookmarks, notes, highlights, progress) | API file + Supabase | Yes | New |
| Material details | View pages (PDF) | controlled canvas viewer | API file | – | New |
| Material details | Download / Open File | removed (exposed raw storage URL) | – | – | Removed |
| Material details | Save offline | grant → blob → IndexedDB | Yes | IndexedDB | Static |
| Catalogue / Details / Dashboard / My Library | Favourite (FavouriteToggle) | favourites.service setFavourite | Supabase | Yes | Present in code; not click-tested |
| Reader | Bookmark, prev/next, page input, font +/-, contents | Group C reader hooks | Supabase | Yes | Present in code; not click-tested |
| Offline Library | Open / Remove / Purge | /offline-viewer or /offline-reader; IndexedDB delete | – | IndexedDB | Static |
Not audited this pass: Profile, Settings, Support, Notes & Bookmarks, Upload, Manage Materials, Members, auth pages, chatbot.
