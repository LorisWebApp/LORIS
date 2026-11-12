# Group D API contracts to agree with Groups A, B, and C

These are proposed contracts for integration discussion, not assertions about routes already implemented by other groups.

## 1. Validate offline material permission (Groups A + B)

`POST /api/materials/offline-permission`

Request:
```json
{
  "materialId": "material-id",
  "organisationId": "optional-organisation-id"
}
```

Success response:
```json
{
  "allowed": true,
  "offlineAllowedUntil": "2026-11-15T23:59:59.000Z",
  "validatedAt": "2026-11-10T10:00:00.000Z"
}
```

Denied response:
```json
{
  "allowed": false,
  "reason": "Your organisation access has expired."
}
```

The server must identify the user from the authenticated token/session. The client must not be able to choose another user.

## 2. Synchronise offline changes (Groups A + C)

`POST /api/offline/sync`

Request:
```json
{
  "operations": [
    {
      "operationId": "stable-uuid",
      "entity": "bookmark",
      "action": "upsert",
      "materialId": "material-id",
      "payload": { "page": 12 },
      "clientUpdatedAt": "2026-11-10T10:00:00.000Z"
    }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "operationId": "stable-uuid",
      "status": "synced"
    }
  ]
}
```

Allowed result statuses: `synced`, `conflict`, `forbidden`, `failed`.

The server should process each operation independently, deduplicate by `operationId`, validate ownership and permissions, and return a result for every submitted operation.

## 3. Material file retrieval (Group B)

Group B should provide an authenticated endpoint or short-lived authorised URL for the material file. Group D should download the response as a Blob and store it in IndexedDB only after permission validation succeeds.

The service worker intentionally does not cache `/api/` responses. Offline material files belong in IndexedDB and must be subject to the offline permission expiry policy.
