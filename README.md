# LORIS – Consolidated Integration Workspace

This workspace uses Group D's root Vite project as the canonical frontend shell and visual reference. It contains one application entry point, one Group A Supabase client/AuthProvider, one global navigation shell, Group B catalogue/admin pages, Group C user pages, Group D offline/chatbot functionality, and Nathan's original source retained under `src/modules/nathan`.

## Start

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Install frontend dependencies with `npm install`.
3. Run `npm run dev`.
4. For the R2 API, copy `server/.env.example` to `server/.env`, fill the server-only credentials, then run `cd server && npm install && npm start`.

The service-role key belongs only in `server/.env`; never expose it to Vite.

## Important implementation status

This is an integration work-in-progress, not a claim that every business workflow is production-ready. See `docs/INTEGRATION_STATUS.md` and `docs/SECURITY_HARDENING.md`.

The additive database migration is provided for review only. It has not been applied. Do not run it until its policies and assumptions have been reviewed against the live Supabase schema and existing data.
