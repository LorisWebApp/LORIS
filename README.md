# LORIS — integrated application

This project combines the selected Group A/B/C work with Group D offline/PWA/chatbot foundations and the approved Nathan organisation-requests/session components.


## Start the frontend

```powershell
npm ci
npm run dev
```

The frontend needs local `.env` values for Supabase and the API server. See `.env.example` if provided; do not commit real credentials.


## Integration notes

- `INTEGRATION_AUDIT.md` lists the detailed per-group integration decisions, repaired controls, and known limitations.
- `INTEGRATION_HANDOFF.md` contains the handoff/run notes.
- SQL files in `database/migrations/` are review-only and are not automatically applied.
- Build/runtime tests could not be completed in the current environment because dependencies could not be installed.
