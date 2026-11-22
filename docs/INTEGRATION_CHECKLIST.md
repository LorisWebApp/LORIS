# LORIS integration checklist

## Active integration
- [x] Group A role-aware Supabase auth and protected routing retained
- [x] Group B catalogue/material details/upload/material management/members pages routed
- [x] Admin navigation reduced (Materials/Members remain dashboard-card destinations)
- [x] Group B `/manage/table` route compatibility
- [x] Persistent Favourite buttons on Catalogue and Material Details
- [x] Group C reader, bookmarks, notes, highlights, profile, settings, support and My Library
- [x] Dashboard bookmark data, recommendation exclusion and annotation metadata restored
- [x] Reading-progress failed-save recovery restored
- [x] Touch text selection, font-scale bounds and reader protection restored
- [x] Group C offline source no longer active in main routes/data flow
- [x] Group D IndexedDB used by My Library and dashboard
- [x] Group D offline save grant/download flow connected to Material Details
- [x] Offline EPUB reader added
- [x] Group D chatbot and service-worker/app-shell registration retained
- [x] Platform Manager Requests route/navigation and decision-email attempt
- [x] Nathan hybrid session backend/migrations included in isolation

## Still required for verification/completion
- [ ] Install frontend dependencies (`npm ci`)
- [ ] Run TypeScript/Vite production build
- [ ] Test Favourite create/remove/reload across Catalogue, Details, My Library and Dashboard
- [ ] Test bookmark create/remove and Notes/Highlights CRUD against Supabase
- [ ] Test reading progress/activity save and recovery
- [ ] Test EPUB online and offline reading
- [ ] Test offline save permission, download, expiry, storage quota, removal and purge
- [ ] Test native PDF/audio/video/image opening on desktop and mobile
- [ ] Wire Group D sync queue to Group C annotation/progress operations
- [ ] Test Group B uploads, cover replacement cleanup, archive and delete against R2/Supabase
- [ ] Test Group A role routing and pending organisation request handling
- [ ] Test Nathan request approval/rejection and applicant notification
- [ ] Integrate hybrid-session frontend only after auth/data-access architecture is agreed
- [ ] Review and apply SQL migrations in a staging database before production
- [ ] Run browser/device and end-to-end tests
