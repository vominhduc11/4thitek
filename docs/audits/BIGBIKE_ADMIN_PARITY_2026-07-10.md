# Bigbike Admin Parity — admin-fe shared primitives + UX utilities

**Date:** 2026-07-10
**Scope:** `admin-fe/` only. Pure front-end refactor + additive UX utilities. **No**
backend, API, data, permission, or state-machine change → the Docs-First contract is
**not** triggered (this file is a record, not a source-of-truth change). Related guardrail:
[`FOURTHITEK_BIGBIKE_FEATURE_ADOPTION_AUDIT.md`](./FOURTHITEK_BIGBIKE_FEATURE_ADOPTION_AUDIT.md).

## 1. What we adopted from the bigbike-admin patterns

bigbike-admin centralizes its list screens on a shared table + a shared paginated-list
hook, and standardizes small UX affordances (unsaved-changes guard, save shortcut, export
button, "needs attention" nav badges). We brought the **structure** of those patterns into
4thitek's own design system (ui-kit tokens), **without** copying bigbike classes and
**without** importing any B2C surface. Concretely:

- **`useAdminList`** (already scaffolded in Phase 2) — the shared paginated-list loop:
  `{status, items, setItems, pagination, isFetching, error, page, setPage, refetch}`. No
  react-query (like-for-like with the hand-written `fetchAdmin*` helpers).
- **`AdminTable`** — one generic table rendering both a mobile-card block and a desktop
  `<table>`, with skeleton / empty / error / sort / selection / per-row actions.
- Four UX utilities: `useUnsavedChanges`, `useSaveShortcut`, `ExportButton`, and nav badges.

## 2. Enablers added to the Phase-2 primitives (additive, backward-compatible)

| File | Change | Why |
|---|---|---|
| `src/hooks/useAdminList.ts` | Expose `setItems` | Pages did optimistic in-place list edits (void / status / delete); the hook owned `items` with no setter. Additive; existing tests unaffected. |
| `src/hooks/useAdminList.ts` | Add `resetKey?: string \| number \| null` | Server-filter pages must reload from page 0 on a filter change. Generalizes what was a duplicated per-page effect into the hook (value-compared → **StrictMode-safe**). |
| `src/components/AdminTable.tsx` | `cardBreakpoint?: "md" \| "2xl"` (static class maps) | Returns' 7-col table breaks at `2xl`, not `md`. Preserves its responsive behavior. |
| `src/components/AdminTable.tsx` | Selection checkbox in the mobile card | Orders had per-row mobile checkboxes; AdminTable rendered selection desktop-only. |
| `src/components/AdminTable.tsx` | Keyboard-operable `onRowClick` rows (`role=button`, `tabIndex`, Enter/Space) | Returns rows are navigable by keyboard; preserved through the migration. |

All are guarded by the primitives' own tests (`useAdminList.test.ts`, `AdminTable.test.tsx`).

## 3. Page migrations (Phase 2)

Each page's raw `<table>` + hand-rolled mobile card + skeleton/empty/error was replaced by
`AdminTable`; paged fetching moved to `useAdminList` where it was a clean fit. **No endpoint
or behavior change.** The "code appears exactly twice" test invariant holds naturally because
`AdminTable` renders both a mobile card and a desktop row.

| Page | Fetch model | Notes |
|---|---|---|
| `WarrantiesPageRevamp.tsx` | dual-source (paged + `fetchAll*(token,100)`) | `useAdminList` for paged; kept manual `allItems` for stats/filter; optimistic void via `setItems`+`setAllItems`. Test-pinned calls preserved. |
| `SerialsPageRevamp.tsx` (~1.4k lines) | dual-source | **Kept the shell** (import panel, QR + RMA modals, status-conditional row actions); swapped only the main list table. Added a smoke test. |
| `OrdersPageRevamp.tsx` | server-filter + summary + optimistic-undo + batch + race-guards | **Kept the manual fetch loop** (see §5, decision 1); migrated only the table (selection + row actions). All 3 pinned tests pass. |
| `ReturnsPageRevamp.tsx` | server-filter | `useAdminList` + `resetKey`; `cardBreakpoint="2xl"`; whole-row keyboard nav. Pinned param-object + `RET-11 ×2` preserved. |
| `DealersPageRevamp.tsx` | server-filter + summary | `useAdminList` + `resetKey`; kept summary endpoint; status select with revert. Added a smoke test. |

**Not a tree/nested table anywhere** — all five are flat row lists, so all mapped to a flat
`AdminTable`. Nothing was left un-migrated for structural reasons; the only kept-as-is body is
Serials' surrounding shell (documented above).

## 4. UX utilities (Phase 3)

- **`src/hooks/useSaveShortcut.ts`** — Ctrl/Cmd+S submits the open form. Generalizes the
  ad-hoc handler previously inlined in `BlogDetailPageRevamp`. Applied to Blog, Settings,
  Dealer detail, Product detail.
- **`src/hooks/useUnsavedChanges.tsx`** — `beforeunload` guard when dirty + a
  `confirmDiscard()` built on the existing `useConfirmDialog`. Applied to the same four pages.
  **Router limitation (decision 4):** the app mounts a non-data `<BrowserRouter>`, where
  react-router `useBlocker` is unsupported, so this does **not** intercept in-app `<Link>` /
  sidebar navigation — by design.
- **`src/components/ExportButton.tsx`** — busy state + `aria-busy` + error toast. Adopted in
  `ProductsPage` (previously a bare CSV button). `ReportsPageRevamp` keeps its own control (its
  per-card XLSX/PDF pair + single-job queue exceed this single-button shape).
- **Nav badges** (`src/hooks/useNavBadges.ts` + `AppLayoutRevamp.tsx`) — "needs attention"
  counts, **only queried for modules the user may see**; failures/no-permission → no badge.
  - Orders `PENDING` and Users `PENDING` (SUPER_ADMIN-only) are derived in-layout from the
    already-loaded `AdminDataContext` lists (no extra fetch, live-updating).
  - Returns: cheap `size:1, status:SUBMITTED` count.
  - **Support tickets: intentionally deferred** — `/admin/support-tickets` has no
    status-filtered count endpoint, so counting "open" would require a full client-side scan
    on every layout mount. Add it once the backend exposes a cheap status count (that would be
    an API change → Docs-First).

## 5. Decisions locked

1. **Orders keeps its manual fetch loop.** Its optimistic-undo + batch + stat-deltas +
   request-id race guards + 3 param-pinned tests make `useAdminList` a poor fit; forcing it
   risked behavior change for no benefit. Only the table was migrated.
2. **`setItems` + `resetKey` + `cardBreakpoint` + mobile-selection + keyboard-onRowClick** are
   additive, backward-compatible extensions to the "done" Phase-2 primitives — chosen so the
   migration is a true no-behavior-change refactor.
3. **`PAGE_SIZE` preserved per page:** Warranties/Serials/Orders/Dealers = 25, Returns = 20.
4. **Unsaved-changes guard = `beforeunload` + guarded Cancel/back** via `useConfirmDialog`,
   keeping `BrowserRouter` (no data-router migration). Sidebar-link clicks are not intercepted
   — an accepted trade-off.
5. **Order/Return _detail_ pages are intentionally excluded** from the shortcut/unsaved guard:
   they are multi-action workflows (payment / status / adjustment / serial forms), not a single
   dirty record — a `beforeunload`-on-any-field-text would be noisy, and there is no single save
   to bind Ctrl+S to.

## 6. Deliberately NOT done (B2C guardrail)

Nothing added touches customer accounts, guest checkout, wishlist, or POS retail. The nav-badge
counts and list migrations operate purely over existing B2B admin data and existing permission
gating. No B2C concept was reintroduced (per
[`FOURTHITEK_BIGBIKE_FEATURE_ADOPTION_AUDIT.md`](./FOURTHITEK_BIGBIKE_FEATURE_ADOPTION_AUDIT.md)).

## 7. Permission decisions (carried from Phase 1, unchanged)

- Nav visibility + badge fetching gate through the existing `canAccessPath` / `hasRole` — **no
  new permission code was invented.** Orders → `orders.read`, Returns → `returns.read`, Users →
  SUPER_ADMIN-only. No route was found missing a `read` code within this scope.
- Users / Audit-logs / Settings remain SUPER_ADMIN-only.

## 8. Code review (high effort) — findings & resolutions

| # | Finding | Resolution |
|---|---|---|
| 1 (HIGH) | Orders select-all: `AdminTable`'s header checkbox is `checked` by membership, but `toggleSelectAll` decided by size → an unchecked box could clear selection. | **Fixed** — `toggleSelectAll(ids)` is now membership-based over the displayed rows. |
| 2 (altitude) | The filter-watch effect was byte-identical in Returns + Dealers. | **Fixed** — generalized into `useAdminList`'s `resetKey`; both pages now pass a serialized key. |
| 3 (dev-only) | `isFirstFilterRun` ref defeated under StrictMode → extra dev refetch. | **Fixed** by #2 — `resetKey` is compared by value (StrictMode-safe). |
| 4 (efficiency) | `useNavBadges` full-scanned all support tickets to count "open". | **Fixed** — support badge dropped/deferred (see §4); only the cheap returns count remains. |
| 5 (minor) | `ExportButton` doc comment overstated "consolidation". | **Fixed** — comment softened. |
| — | `refetch()` resolves before the network reload completes. | **Kept by design** — the `reloadToken` pattern enables the batched `setPage(0)`+reload; no call site reads `items` after `await refetch()` (only an info toast in Returns). |
| — | Nav badges (returns) refresh on remount/reload, not live. | **Accepted** for an at-a-glance hint; documented in the hook. |

## 9. Quality gate

- `admin-fe`: `tsc -b` clean; `npm test -- --run` → **142 passed, 1 failed**; `npm run build` OK.
  - The **1 failure** — `DashboardPageRevamp.test.tsx > routes stale-order alerts` — is
    **pre-existing on HEAD**, unrelated to this work (that file is not in the diff). Left as-is
    per the standing "don't fix flagged/out-of-scope" rule.
- `backend`: **untouched** (0 backend files in the diff). `./mvnw test` (H2 in-memory) →
  **434 tests, 0 failures, 6 errors**. The 6 errors are all backend test-setup / referential-
  integrity issues in `FinancialSettlementResolutionDashboardStateTests` (1) and
  `OrderAdjustmentRecalculationTests.setUp` (5) — `ProductSerial` FK-on-delete / transient-
  instance problems. These are **pre-existing on HEAD**: a front-end-only (TypeScript) change
  cannot affect Java tests. Not fixed here (backend untouched, out of scope).
