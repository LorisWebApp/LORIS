# LORIS chatbot read-only database queries

This implementation adds a small allowlist of database-backed chatbot intents while retaining the existing keyword knowledge base and offline help answers.

## Apply the database functions

1. Open the Supabase SQL Editor for the LORIS project.
2. Run `read_only_chatbot_queries.sql`.
3. The script creates two `SECURITY INVOKER`, `STABLE` functions:
   - `chatbot_search_materials(text, integer)`
   - `chatbot_count_materials(text)`
4. Only the `authenticated` role receives execute permission. `PUBLIC` and `anon` are explicitly revoked.

The functions accept search text and a bounded result limit, not SQL. They return only published materials that are global or belong to an organisation where the caller has an active membership. Because they are `SECURITY INVOKER`, the caller's existing RLS policies still apply.

## Supported questions

- Search/find materials or books by title, author, or description.
- Count published materials, optionally matching a term.
- List catalogue categories.
- Retrieve the signed-in user's bookmarks, notes, highlights, favourites, reading progress, and offline downloads.

Personal queries explicitly filter by the current Supabase user ID and remain subject to RLS. The chatbot does not expose insert, update, delete, arbitrary SQL, profiles, memberships, organisation requests, or support tickets.

## Offline behaviour

The existing knowledge-base answers continue to work offline. Database-backed questions display a reconnect message while the browser reports itself offline. No existing offline material storage or synchronisation code is changed.

## Files changed for this implementation

- `src/group-d/chatbot/chatbotEngine.ts`
- `src/group-d/chatbot/chatbotData.ts` (new)
- `src/hooks/useChatSession.ts`
- `src/pages/user/ChatInterface.tsx` (chatbot description only)
- `src/components/chatbot/Composer.tsx` (chatbot helper text only)
- `database/chatbot/read_only_chatbot_queries.sql` (new)
- `database/chatbot/README.md` (new)
