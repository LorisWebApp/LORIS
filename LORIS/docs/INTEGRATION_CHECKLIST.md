# Group D integration checklist

## Group D implementation
- [x] LORIS web app manifest
- [x] Service worker app-shell/static asset caching
- [x] Avoid caching API responses
- [x] Service worker registration helper
- [x] Online/offline React hook
- [x] IndexedDB material store
- [x] IndexedDB sync queue
- [x] Offline material save/list/open/remove helpers
- [x] Offline permission expiry checks
- [x] Sync batching and per-operation result handling
- [x] Rule-based chatbot response engine and knowledge base

## Still requires collaboration/integration
- [ ] Group A confirms authentication token access and membership/expiry rules.
- [ ] Group B confirms authorised material download and offline permission endpoint.
- [ ] Group C confirms bookmark/note/highlight/reading-progress payload formats.
- [ ] Backend implements the agreed sync endpoint and idempotency.
- [ ] Claude-created UI imports these modules and presents loading/error/empty/conflict states.
- [ ] Test with real organisation accounts and materials.
- [ ] Test permission revocation and expiry while the device is offline.
- [ ] Test storage quota limits on supported browsers/devices.
- [ ] Test sync conflicts, duplicate requests, logout, and multiple accounts on one device.
- [ ] Run a production build and verify installability over HTTPS.

## Important note about logout
Call `clearUserData(userId)` when the authenticated user logs out if the product decision is to remove that user's local offline files and pending changes. If LORIS intends to retain downloaded files across sessions, define a safe user-partitioning and re-authentication policy first.
