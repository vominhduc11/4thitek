# Admin Fetch Strategy Follow-up

Status: deferred by design

This note captures the approved follow-up for issue A after the repo audit. It is intentionally a design and rollout document, not a hot-fix plan. The current admin UI remains backward compatible until the backend contracts below exist.

## Current behavior

### AppLayoutRevamp search and alerts
- `admin-fe/src/layouts/AppLayoutRevamp.tsx` builds the global search index in memory from `orders`, `products`, `dealers`, `posts`, `discountRules`, and `users`.
- Opening search triggers `ensureResourceLoaded("orders" | "dealers" | "posts" | "discountRules" | "users")`.
- Opening alerts triggers `ensureResourceLoaded("orders" | "dealers" | "posts" | "users")`.
- `admin-fe/src/context/AdminDataContext.tsx` only preloads route-specific resources by default, but the layout still pulls full datasets when search or alerts open.

Why this does not scale:
- Search latency grows with total record count because indexing stays client-side.
- Alerts cost scales with full-array fetches even though the UI only needs a few counters.
- Memory pressure rises with every preloaded collection kept in context.

### SupportTicketsPageRevamp
- Default page load uses `fetchAdminSupportTickets(page, size)`.
- Any non-empty search query or status filter switches the screen to `fetchAllAdminSupportTickets(...)` and then filters client-side.

Why this partially scales:
- Default browsing is paged and acceptable.
- Filtered/search states degrade to fetch-all, which becomes expensive for large ticket history.

### NotificationsPageRevamp
- Default page load uses `fetchAdminNotifications(page, size)`.
- Any non-empty search query triggers `fetchAllAdminNotifications(...)` and client-side filtering.

Why this partially scales:
- Default browsing is paged and acceptable.
- Search cost becomes proportional to the full notification history.

### WarrantiesPageRevamp
- Page rows load through `fetchAdminWarranties(page, size)`.
- The screen also always calls `fetchAllAdminWarranties(...)` to compute stats and to support client-side filtering.

Why this does not scale:
- Every visit pays for both the paged dataset and the global dataset.
- Stats and filters are tied to a full client-side copy of the warranty table.

### SerialsPageRevamp
- Page rows load through `fetchAdminSerialsPaged(page, size)`.
- The screen also always calls `fetchAllAdminSerials(...)` to compute stats and support client-side filtering.

Why this does not scale:
- Serial inventory is one of the datasets most likely to grow large.
- Pulling the full table for stats is the wrong long-term contract.

## Affected screens

- `admin-fe/src/layouts/AppLayoutRevamp.tsx`
- `admin-fe/src/pages/SupportTicketsPageRevamp.tsx`
- `admin-fe/src/pages/NotificationsPageRevamp.tsx`
- `admin-fe/src/pages/WarrantiesPageRevamp.tsx`
- `admin-fe/src/pages/SerialsPageRevamp.tsx`

## Priority classification

### Change soon
- App layout alerts: currently uses full datasets for a small counter payload.
- App layout global search: current client-side indexing will not age well.
- Warranties page: always fetches all items just to compute stats.
- Serials page: always fetches all items just to compute stats and filter.

### Accept temporarily
- Support tickets default page load: already paged.
- Support tickets filtered mode: acceptable short term only if ticket volume stays moderate.
- Notifications default page load: already paged.
- Notifications search mode: acceptable short term only if notification volume stays moderate.

### Already on the right track
- Orders page: paged rows plus summary endpoint.
- Dealers page: paged rows plus summary endpoint.
- Dashboard page: summary-first contract.

## Backend contract additions needed

### Layout and cross-screen contracts
- `GET /api/v1/admin/search?q=<query>&limit=<n>`
  Purpose: server-side global search across the small set of entities exposed in the admin quick search.
- `GET /api/v1/admin/layout/alerts-summary`
  Purpose: return alert counters only, without full order/dealer/post/user payloads.

### Support tickets
- Extend existing paged endpoint to accept `query` and `status`.
  Target shape: `GET /api/v1/admin/support-tickets?page=<p>&size=<s>&query=<q>&status=<status>`
- Optional later: summary endpoint if dashboard-like counters are still needed independently.

### Notifications
- Extend existing paged endpoint to accept `query`.
  Target shape: `GET /api/v1/admin/notifications?page=<p>&size=<s>&query=<q>`
- Optional later: summary endpoint for unread/promotions/current-page counts if they should represent global totals.

### Warranties
- Add summary endpoint.
  Target shape: `GET /api/v1/admin/warranties/summary`
- Extend paged endpoint to accept `query` and `status`.
  Target shape: `GET /api/v1/admin/warranties?page=<p>&size=<s>&query=<q>&status=<status>`

### Serials
- Add summary endpoint.
  Target shape: `GET /api/v1/admin/serials/summary`
- Extend paged endpoint to accept `query` and `status`.
  Target shape: `GET /api/v1/admin/serials?page=<p>&size=<s>&query=<q>&status=<status>`

## Rollout order

1. Add `alerts-summary` and `admin search` endpoints, then migrate `AppLayoutRevamp`.
2. Add `warranties/summary` and server-side warranty filters, then remove warranty fetch-all.
3. Add `serials/summary` and server-side serial filters, then remove serial fetch-all.
4. Extend support tickets paged search/filter contract, then remove `fetchAllAdminSupportTickets`.
5. Extend notifications paged search contract, then remove `fetchAllAdminNotifications`.

## What should not be changed yet

- Do not increase page size as a substitute for server-side search.
- Do not add more client-side caches or preload more resources into context.
- Do not remove the current `allItems` paths before the matching backend summary/filter contracts exist.
- Do not change existing admin API response shapes in a breaking way.
- Do not refactor `AdminDataContext` into a global preload layer. The current route-scoped loading is the safer baseline.

## Minimal success criteria for the later implementation

- Opening admin search must not require loading whole orders/dealers/posts/users tables.
- Opening alerts must depend on a summary payload only.
- Support, notifications, warranties, and serials must stay paged under both browse and filtered states.
- Stats cards must come from summary endpoints, not from client-side scans of full datasets.
