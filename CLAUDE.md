# CLAUDE.md

> Read this before changing anything in this repository.
> Auto-loaded by Claude Code at the start of every conversation in this repo.

4thitek is a **B2B distributor / dealer platform** for SCS motorcycle intercom products.
It is not a B2C store — end-customers are not accounts; they appear only in public surfaces
(warranty lookup, content).

## Monorepo layout

| Path | Surface | Stack |
|---|---|---|
| `backend/` | Business authority: REST API, scheduling, webhook, persistence | Spring Boot 3.4.3 / Java 17, PostgreSQL 16, Flyway, Redis |
| `admin-fe/` | Internal operations dashboard | Vite + React 18 + TypeScript + Tailwind |
| `main-fe/` | Public SEO website | Next.js 15 (App Router, ISR) |
| `dealer/` | Dealer-facing mobile app | Flutter (GoRouter, l10n vi/en) |

Actors: **Admin / internal staff**, **Dealer**, **System**. End-customers only appear in
secondary use cases (public warranty lookup, public content).

## ⚠️ Docs-First Contract

These documents are the **source of truth**. Code is built from them, not the reverse.

| Source of truth | Covers |
|---|---|
| [`BUSINESS_LOGIC.md`](BUSINESS_LOGIC.md) | Runtime business contract: order/payment, serial lifecycle, warranty, returns, support, roles |
| [`docs/engineering/API_CONTRACT.md`](docs/engineering/API_CONTRACT.md) | Endpoints, auth, response envelope |
| [`docs/engineering/DATA_CONTRACT.md`](docs/engineering/DATA_CONTRACT.md) | Entities, enums, money shape, the `Product` jsonb columns |
| [`docs/engineering/PERMISSION_MATRIX.md`](docs/engineering/PERMISSION_MATRIX.md) | Roles, permission codes, role×permission matrix, endpoint gating |
| [`docs/business/STATE_MACHINES.md`](docs/business/STATE_MACHINES.md) | Every status enum and its allowed transitions |
| [`docs/audits/`](docs/audits/) | Audit reports — read the relevant one before "fixing" something already flagged there |

### Before changing any source file

1. **Read the relevant doc section first** — only the part you are touching.
2. If a change affects a **business rule, API contract, data shape, permission, state machine,
   workflow, or deployment env**, update the doc **first**, then the code, in the same change.
3. **Cite evidence** (file path) when describing a change.
4. **Do not invent rules.** If a doc says `NEEDS_VERIFICATION` / `NEEDS_CONFIRMATION` and you
   need that answer to proceed — stop and ask the user.
5. Pure refactors and style/token-only changes that touch none of the above do not need a
   doc update.

### Quick mapping — what you touch → what to read

| Changing | Read |
|---|---|
| Backend controller / endpoint | `API_CONTRACT.md` + `BUSINESS_LOGIC.md` |
| Backend entity / DTO / enum / migration | `DATA_CONTRACT.md` |
| Any status / transition change | `STATE_MACHINES.md` + `BUSINESS_LOGIC.md` |
| Order / payment / serial / warranty / return logic | `BUSINESS_LOGIC.md` + `STATE_MACHINES.md` |
| Permission / role / `@PreAuthorize` | `PERMISSION_MATRIX.md`, migration `V42` |
| Frontend API call / response shape | `API_CONTRACT.md` + `DATA_CONTRACT.md` |
| Deployment / Docker / env | `docs/DEPLOYMENT_GUIDE.md`, `docs/RUNBOOK.md` |

## ⚠️ Runtime invariants (do not regress)

- New orders are **`BANK_TRANSFER` only**; a new order starts `PENDING` / `paymentStatus=PENDING`.
- Order workflow: `PENDING → CONFIRMED → PROCESSING → SHIPPING → COMPLETED`. A dealer cannot
  cancel directly — it raises `CANCEL_REQUESTED`; an admin approves (`CANCELLED`) or rejects
  (`CANCEL_REJECTED`). Cancellation side effects fire only on `→ CANCELLED`.
- The backend is the business authority for order, payment, serial, warranty, reconciliation
  and notification side effects.
- Admin endpoints are gated by granular permission codes (`V42`); `SUPER_ADMIN`/`ADMIN` hold
  all codes. Admin users, settings, and audit logs are `SUPER_ADMIN`-only.
- SePay webhook reconciliation is bank-transfer only and idempotent on `transactionCode`.
- There is **no dealer credit/debt** module — do not assume one exists.

## Backend Java

- Use **Lombok** (`@Getter/@Setter`, `@RequiredArgsConstructor`, `@Slf4j`, `@Builder`) — never
  hand-write boilerplate. Do not put `@Data` on JPA entities.
- Use **Bean Validation** (`@NotNull`, `@Size`, `@Valid`, …) for request shape/syntax at the
  controller boundary; keep DB / permission / state-machine / stock rules in the service layer.
- DTO mapping is currently hand-written under `service/support/*ResponseMapper.java`. MapStruct
  is not yet adopted — keep new mappers consistent with the existing hand-written style unless
  a migration to MapStruct is explicitly agreed.

## Encoding & Vietnamese

- All files are **UTF-8**. Vietnamese text must keep **full diacritics** — never "viet khong dau".
- No mojibake (`ThÃ nh toÃ¡n`). Applies to JSX/Dart strings, placeholders, aria-labels, comments,
  logs, toasts.

## Tests & quality gate

| Surface | Command |
|---|---|
| backend | `cd backend && ./mvnw test` |
| admin-fe | `cd admin-fe && npm test -- --run` |
| main-fe | `cd main-fe && npm test` |
| dealer | `cd dealer && flutter test` (and `flutter analyze`) |

After a business-contract change, keep the tests in `BUSINESS_LOGIC.md` §7 protective.

## Docker / operations

- Allowed to read running containers for diagnosis (`docker ps`, `docker logs`, `docker exec`
  read-only, `SELECT`). If a needed container is not running, **ask the user to start it** —
  do not run `up/down/restart/rm/prune` (shared state).
- Any write/destructive DB or container operation needs explicit user approval.

## Prohibited

- ❌ Changing code without reading the related doc section.
- ❌ Shipping code whose contract change is not reflected in the docs.
- ❌ Re-introducing B2C concepts (customer accounts, guest checkout, wishlist, POS retail) —
  see `docs/audits/FOURTHITEK_BIGBIKE_FEATURE_ADOPTION_AUDIT.md`.
- ❌ "Fixing" something already flagged in `docs/audits/` as a tracked task.
