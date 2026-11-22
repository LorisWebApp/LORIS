# Migration review (none were executed against any database)
| File | Purpose | Tables / functions / policies | Additive? | Destructive? | Manual review |
|---|---|---|---|---|---|
| 20261115_security_rls_and_org_ownership.sql | RLS, org ownership, organisation_requests table, role helper functions | materials, organisation_requests, Profiles, Memberships; policies; `loris_is_platform_manager()` etc. | Mostly (policies are replaced) | No drops of tables/columns found by this pass | **Yes** – policy replacement must be checked against live policies |
| 20261116_platform_request_review.sql | Atomic approve/reject of requests | fn `loris_review_organisation_request`; writes Organisation, Memberships, organisation_requests | Yes (create or replace function) | No | **Yes** – verify quoted Organisation column names against live table |
| 20261123_reading_activity.sql | Reading-activity recording | reading_activity | Yes | No | Yes (not re-reviewed line by line in this pass) |
| **20261124_platform_dashboard_stats.sql (new)** | `get_platform_dashboard_stats()` RPC required by Group A's dashboard | fn only; read-only counts of Organisation, Profiles, organisation_requests; guarded by `loris_is_platform_manager()` | Yes | No | Light – apply after 20261115 |
| hybrid-sessions/* | Nathan session tables | not applied; backend not wired to the frontend | – | – | Yes, only if sessions are activated |
