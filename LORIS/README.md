# LORIS – Group D implementation package

This package contains the **non-visual implementation** for Group D. It deliberately does not include page layouts, styling, or finished React screens; those can be created by Claude and connected to these modules.

## Included

1. PWA manifest and production service worker.
2. Service-worker registration helper.
3. Online/offline detection hook and browser utility.
4. IndexedDB storage for offline library materials and queued changes.
5. Offline material download, retrieval, removal, and storage-usage helpers.
6. Permission-validation adapter with an explicit offline-access policy.
7. Sync queue and sync runner for bookmarks, notes, highlights, and reading progress.
8. Rule-based library chatbot knowledge base and response engine.
9. TypeScript API contracts and integration notes.

## Important integration boundary

The project is being developed by separate groups. Group D cannot safely guess the final API routes or database schema owned by Groups A, B, and C. The package therefore uses a configurable API adapter and documents the expected request/response contracts. Replace the example routes or adapt the functions when the groups agree on their API contracts.

This package is implementation-ready as a Group D module, but it is **not a claim that the complete multi-group LORIS application has been integrated or production-tested**.

## Suggested placement in the main Vite + React + TypeScript application

Copy/merge the contents into the matching locations:

- `public/manifest.webmanifest`
- `public/service-worker.js`
- `src/group-d/hooks/useNetworkStatus.ts`
- `src/group-d/pwa/registerServiceWorker.ts`
- `src/group-d/offline/*`
- `src/group-d/chatbot/*`
- `src/group-d/types/*`

Do not overwrite the existing `App.tsx`, `main.tsx`, global CSS, or other groups' files. Import the utilities into the screens Claude creates.

## Dependencies

The modules use browser APIs and TypeScript. The React hook requires the application's existing `react` dependency. No IndexedDB wrapper library is required.

Recommended TypeScript compiler settings include:
- `target`: `ES2022` or later
- `lib`: `["ES2022", "DOM", "DOM.Iterable"]`
- `strict`: `true`

## Setup

### 1. PWA manifest

Merge `public/manifest.webmanifest` into the project's `public` folder. Ensure the root `index.html` includes:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0f766e" />
```

Keep the existing viewport tag if it is already present.

### 2. Register the service worker

In `src/main.tsx`, after the React root has been rendered, call:

```ts
import { registerServiceWorker } from "./group-d/pwa/registerServiceWorker";

registerServiceWorker();
```

The helper registers only in production by default. To test the service worker locally, build and run the Vite preview:

```powershell
npm run build
npm run preview
```

### 3. Offline material flow

When an authorised user selects **Save offline**, call:

```ts
import { saveMaterialForOffline } from "./group-d/offline/offlineMaterials";

await saveMaterialForOffline({
  material: {
    id: "material-id-from-api",
    title: "Example title",
    author: "Example author",
    category: "Reference",
    fileName: "example.pdf",
    mimeType: "application/pdf",
    fileSize: 123456,
    sourceUrl: "https://your-authorised-file-endpoint",
  },
  fileBlob: downloadedBlob,
  permission: permissionResult,
});
```

The UI should obtain `downloadedBlob` from the authorised file endpoint. Do not bypass Group B's access checks or expose private R2 URLs in the client.

Retrieve the saved file for the reader:

```ts
const saved = await getOfflineMaterial("material-id-from-api");
if (saved) {
  const objectUrl = URL.createObjectURL(saved.fileBlob);
  // Open objectUrl in the existing PDF/EPUB reader.
  // Revoke it when no longer needed: URL.revokeObjectURL(objectUrl)
}
```

### 4. Permission policy

Offline access must not become a way to retain content after an organisation membership or material permission expires.

The default policy requires:
- A successful online permission validation before saving.
- A server-supplied `offlineAllowedUntil` timestamp.
- A local check before opening the saved file.
- Revalidation when connectivity returns.

The server must remain authoritative. The client-side check is a usability/security layer, not a substitute for server authorisation.

### 5. Sync flow

The sync runner sends queued changes to the configured API adapter. Call it after authentication is ready and when the browser returns online:

```ts
import { syncPendingChanges } from "./group-d/offline/sync";

const result = await syncPendingChanges();
```

The default adapter expects `POST /api/offline/sync`. Adjust `src/group-d/offline/apiAdapter.ts` to match the final backend contract.

Each queued operation includes a stable `operationId` for server-side idempotency. The backend should:
- Authenticate the user.
- Verify the user's current organisation membership and material permissions.
- Validate the operation and ownership.
- Deduplicate by `operationId`.
- Return per-operation success/conflict/forbidden status.

### 6. Chatbot

Use the rule-based response engine:

```ts
import { getChatbotReply } from "./group-d/chatbot/chatbotEngine";

const reply = getChatbotReply("How do I save a book for offline reading?");
```

The chatbot is intentionally rule-based. It does not call an LLM, external AI service, or RAG system. Add or refine answers in `knowledgeBase.ts`.

## Offline sync conflict behaviour

The client sends a `clientUpdatedAt` timestamp and an operation ID. It does not silently overwrite server data. The server should return `conflict` when a safe merge cannot be performed. The UI can then explain the conflict and allow the user to retry or resolve it.

## Security and production checklist

- Enforce all authorisation on the server; never trust client-supplied user or organisation IDs.
- Return short-lived authorised download URLs or stream files through an authorised endpoint.
- Define the offline access policy with the project owner and Groups A/B.
- Consider encrypting sensitive local data if the threat model requires it. Browser-side encryption only helps when key management is designed correctly.
- Do not cache authenticated API responses in the service worker.
- Ensure logout clears user-specific local data or securely partitions it by user.
- Test permission expiry, account revocation, storage quota errors, offline/online transitions, duplicate sync requests, and conflicts.
- Serve the application over HTTPS in production (localhost is treated as a secure context for development).
