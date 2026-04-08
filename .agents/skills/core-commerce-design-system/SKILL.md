---
name: 4thitek-unified-design-system
description: Repo-aware design-system and UI implementation guidance for 4thitek main-fe, admin-fe, and dealer app. Use this skill when designing, refactoring, auditing, or standardizing UI/UX across the product family.
license: Proprietary
metadata:
  author: OpenAI
  project: 4thitek
  canonical_brand_surface: main-fe
  canonical_business_contract: BUSINESS_LOGIC.md
---

# 4thitek Unified Design System Skill

## Mission
You are the UI/UX and design-system implementation guide for 4thitek.

Your job is not to generate generic pretty interfaces.
Your job is to produce implementation-ready guidance and code changes that fit the real 4thitek product family:

- `main-fe`: public Next.js website for SEO, trust, product discovery, and conversion
- `admin-fe`: React + Vite internal dashboard for operations, catalog, payments, reports, warranty, and support workflows
- `dealer`: Flutter mobile-first B2B ordering application for dealers

Always optimize for:
- clarity
- trust
- operational safety
- consistency across surfaces
- maintainability in a real production repo

Do not optimize for novelty for its own sake.

---

## Repo Reality and Surface Model

### `main-fe`
- Technology: Next.js App Router
- Role: public storefront, SEO-facing, trust-building, product storytelling, product discovery
- Must preserve:
  - SEO route/slug behavior
  - metadata behavior
  - crawlable DOM content
  - performance and responsive behavior
- UX priority:
  - premium brand feel
  - clear product information
  - smooth conversion path
  - high readability
- Current strong surfaces:
  - `/`
  - `/products`
  - `/products/[id]`
  - `/blogs`
  - `/blogs/[id]`
  - `/about`
  - `/contact`
  - `/certification`
  - `/policy`
  - `/privacy-policy`
  - `/search`
  - `/warranty-check`
  - `/become_our_reseller`

### `admin-fe`
- Technology: React + Vite + TypeScript
- Role: internal operations dashboard
- UX priority:
  - scan speed
  - dense information
  - predictable forms
  - strong state visibility
  - safe destructive actions
- Default interaction model:
  - table-heavy
  - filter-heavy
  - keyboard-friendly
  - multi-step operational flows
- Admin UI must never become decorative or brand-theatrical at the expense of clarity.

### `dealer`
- Technology: Flutter
- Role: dealer ordering and post-sale mobile workflow
- UX priority:
  - fast repeat ordering
  - quantity entry
  - totals clarity
  - payment visibility
  - order status visibility
  - one-handed practicality
  - resilient loading/empty/error states
- Dealer UI should feel compact and practical on list/order flows, and more comfortable on checkout/detail/review surfaces.

---

## Canonical Source-of-Truth Order

When design guidance conflicts, use this precedence:

1. `BUSINESS_LOGIC.md` is the canonical business contract.
2. Current runtime-safe brand behavior of `main-fe` is the canonical visual baseline for public brand expression.
3. Shared cross-surface primitives must be reused where possible.
4. Local convenience shortcuts are not allowed to override canonical business labels or state semantics.

If a requested change conflicts with `BUSINESS_LOGIC.md`, treat it as a product/business decision, not a cosmetic UI change.

If a requested change conflicts with current public SEO behavior in `main-fe`, preserve SEO-safe behavior first.

---

## Brand Foundation for 4thitek

### Brand personality
4thitek should feel:
- premium
- technical
- modern
- trustworthy
- serious
- commerce-ready
- operationally reliable

Avoid:
- playful UI metaphors
- futuristic gimmicks
- cyberpunk excess
- game-like navigation
- neon-overload effects
- ornamental motion with no UX value

### Canonical typography
Use the current 4thitek brand runtime direction:

- Body/UI font: `Source Sans 3`
- Display/accent font: `Montserrat`
- Mono/code/numeric dense contexts: use a practical mono only where needed, not as a brand font

Do not default back to `Inter + Manrope` unless the repo itself is intentionally migrated and all three surfaces are updated together.

### Core brand colors
Use semantic tokens built around the current brand direction:

- primary: `#29ABE2`
- primary-strong: `#0071BC`
- secondary: `#3F4856`
- success: `#16A34A`
- warning: `#F59E0B`
- danger: `#DC2626`
- info: `#2563EB`

Recommended neutrals:
- surface: light neutral with strong readability
- elevated-surface: white or very light elevated background
- border: slate-like neutral with clear separation
- text: very dark slate/navy
- muted-text: medium slate
- inverse-text: near-white

### Visual style
- public storefront: premium, restrained, expressive
- admin-fe: compact, stable, data-first
- dealer: mobile-practical, operationally clear, slightly more branded than admin but less expressive than main-fe

### Spacing scale
Use a stable shared scale:
- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Radius scale
- 8, 12, 16, 20

### Shadow model
- sm: subtle separation
- md: dropdowns, sticky bars, menus
- lg: overlays only

Do not use heavy glassmorphism, neumorphism, or dramatic layered visual effects in operational surfaces.

---

## Shared Product-Family Rules

### One system, three surfaces
The three products must feel like one family:
- same semantic colors
- same status language
- same spacing rhythm
- same typography roles
- same interaction semantics for shared concepts

But adaptation by surface is required:
- `main-fe`: comfortable, expressive, trust-building
- `admin-fe`: compact, information-dense
- `dealer`: compact on lists, comfortable on checkout/detail

### Shared meaning must not drift
For all shared business concepts, maintain one canonical mapping:
- order status
- payment status
- serial/stock status
- warranty status
- support ticket status
- destructive vs non-destructive actions

Do not let each frontend invent its own labels, colors, icon rules, or tooltip logic.

### Canonical backend shape first
Treat backend response shape as canonical.
If compatibility is needed, use adapters.
Do not casually rename shared fields in one client for convenience.

---

## Canonical State Contract Presentation

### Order status
Canonical order statuses:
- `PENDING`
- `CONFIRMED`
- `SHIPPING`
- `COMPLETED`
- `CANCELLED`

Presentation rules:
- `PENDING`: waiting / neutral warning state
- `CONFIRMED`: approved but not fulfilled yet
- `SHIPPING`: in-progress fulfillment state
- `COMPLETED`: successful terminal positive state
- `CANCELLED`: destructive terminal state

Do not style `CONFIRMED` the same as `COMPLETED`.
Do not style `PENDING` the same as `FAILED` or `CANCELLED`.

### Payment status
Canonical current runtime payment statuses:
- `PENDING`
- `DEBT_RECORDED`
- `PAID`
- `CANCELLED`

Important:
- This reflects current runtime contract.
- If the repo later removes debt officially, this skill must be updated in the same batch.

Presentation rules:
- `PENDING`: unpaid / waiting for payment
- `DEBT_RECORDED`: financial obligation exists, not equivalent to paid
- `PAID`: fully settled
- `CANCELLED`: payment no longer active due to order cancellation with no paid amount

Do not style `PAID` and `DEBT_RECORDED` the same.

### Warranty status
Canonical statuses:
- `ACTIVE`
- `EXPIRED`
- `VOID`

Presentation rules:
- `ACTIVE`: positive service-available state
- `EXPIRED`: neutral/aging state, not destructive by default
- `VOID`: destructive or invalidated state

### Serial / stock status
Canonical statuses:
- `AVAILABLE`
- `RESERVED`
- `ASSIGNED`
- `WARRANTY`
- `DEFECTIVE`
- `RETURNED`
- `INSPECTING`
- `SCRAPPED`

Presentation rules:
- `AVAILABLE`: positive inventory state
- `RESERVED`: held, not yet dealer-owned
- `ASSIGNED`: dealer-owned inventory
- `WARRANTY`: activated lifecycle state
- `DEFECTIVE`, `RETURNED`: problem states requiring action
- `INSPECTING`: in-review operational state
- `SCRAPPED`: terminal retired state

### State UI mapping rule
For every shared business state, define in one shared layer:
- label
- semantic color
- icon rule if used
- tooltip/help-text rule when ambiguity exists

No duplicated hardcoded mappings across multiple clients unless there is a documented compatibility path.

---

## Surface-Specific Design Rules

# 1. Main FE Rules

## Intent
The public website must sell trust before it sells interaction complexity.

## Main FE design priorities
- SEO-safe
- crawlable
- premium visual tone
- media-rich but readable
- product scanning clarity
- trust and conversion support
- mobile-safe and performant

## Route-specific priorities

### `/`
Highest brand-expression route.
This is the strongest place for:
- premium hero
- storytelling sections
- featured products
- newsroom/editorial trust
- carefully controlled motion
- selective enhancement such as 3D or rich media if performance-safe

### `/products`
Search-first listing and scan clarity first.
Do not overload with visual gimmicks.
Focus on:
- product card consistency
- thumbnail/media quality
- stock visibility
- price/contact cue clarity
- sort/filter understanding
- mobile-safe scanning

### `/products/[id]`
Most important conversion/trust detail page.
Prioritize:
- product hero
- specifications
- videos
- compatibility
- warranty
- package/trust information
- related products
- sticky local navigation if helpful

### `/blogs` and `/blogs/[id]`
Editorial/content hierarchy first.
Keep:
- reading comfort
- card hierarchy
- navigation clarity
- related-content continuation
Do not turn these into visually noisy marketing pages.

### `/about`, `/contact`, `/certification`
Trust surfaces.
May carry brand expression, but content clarity must remain primary.

### `/policy`, `/privacy-policy`, `/search`, `/reset-password`, `/warranty-check`, `/become_our_reseller`
Utility/content/conversion routes.
Must remain:
- clear
- stable
- readable
- low-friction
Do not introduce heavy motion or theatrical layouts here.

## Main FE motion and 3D rule
Allowed only as enhancement, never as content source.

If using motion, video, or 3D:
- DOM content remains primary
- SEO content remains crawlable
- avoid making canvas/video the main LCP
- use lazy loading and fallback posters
- do not apply heavy 3D to content/legal/search/form routes

---

# 2. Admin FE Rules

## Intent
The admin dashboard is an operations system, not a brand showroom.

## Admin design priorities
- high density
- fast scanning
- predictable layouts
- strong table behavior
- state visibility
- minimal ambiguity
- low-error destructive workflows
- low visual fatigue during long sessions

## Admin layout rules
- default to 12-column desktop logic where useful
- page shell should be stable:
  - page header
  - summary controls / filters
  - content area
  - secondary side panels only when justified
- use sticky table headers for long lists
- action clusters must remain predictable

## Admin component emphasis
Highest-quality components should include:
- tables/data grids
- filters and search
- form sections
- status badges
- drawers/modals for focused actions
- timelines/status trackers
- totals/settlement summaries
- charts only when they help operations, not as decoration

## Admin action hierarchy
- one dominant primary action per region
- destructive actions visually separated
- confirmations explicit
- audit-sensitive flows must not look casual

## Admin visual restraint
Use brand color as identity anchor, not as page paint.
Admin FE should be more neutral than main-fe.

---

# 3. Dealer App Rules

## Intent
The dealer app must optimize repeat purchasing and post-sale action speed on mobile.

## Dealer priorities
- fast ordering
- quantity editing clarity
- total calculation visibility
- payment visibility
- order progression clarity
- stock and discount awareness
- one-handed mobile practicality
- clear summary and next-step guidance

## Dealer information hierarchy
On order/cart/checkout flows, prioritize:
- line items
- quantity controls
- subtotal
- discount
- VAT/fees context
- grand total
- payment state
- next available action

Important financial values must never be hidden behind hover-only or deeply nested UI.

## Dealer mobile rules
- large tap targets
- sticky checkout summary where useful
- sticky CTA or action bar on long flows
- compact list density
- clearer spacing on detail/review/payment surfaces

## Dealer UX tone
Operational, trustworthy, and practical.
Do not make dealer flows visually noisy.
Do not bury totals or statuses below decorative sections.

---

## Component System Rules

### Buttons
Required variants:
- primary
- secondary
- tertiary
- destructive
- ghost

Required sizes:
- sm
- md
- lg

Rules:
- primary must be obviously primary
- loading must preserve width
- disabled must not look like secondary enabled
- destructive must not visually compete with primary confirm

### Inputs and form controls
- explicit label always
- helper text where needed
- inline validation message
- placeholder is not a label
- focus-visible stronger than hover
- error state changes border, message, and supporting icon treatment consistently

### Tables and data grids
Especially critical for admin-fe:
- strong column alignment
- sortable headers with explicit state
- sticky header where appropriate
- truncation safe with tooltip or detail access
- empty state must distinguish:
  - no data
  - filtered out
  - failed to load

### Cards
- use for grouping related information
- avoid nested-card chaos
- public cards may be richer
- admin cards should remain simpler and denser
- dealer cards should remain touch-friendly and summary-first

### Filters and search
- applied filters must remain visible
- removable individually
- clear-all action required
- preserve filter state during data refresh where reasonable

### Status badges
- semantic token only
- no random color choice
- labels short and business-clear
- color meaning stable across all clients
- meaning must not depend on color alone

### Modals and drawers
- modal for short focused tasks
- drawer or page for complex review/edit flows
- unsaved-change behavior must be explicit
- destructive vs confirm action spacing must be clear

### Pricing blocks and totals
Critical for dealer and commerce surfaces:
- unit price
- subtotal
- discount
- VAT or surcharge context
- grand total
- payment state
- outstanding or settlement context where relevant

Discounts must feel clear, not noisy.
Financially meaningful values must always be visible.

### Product media
Critical for main-fe and product detail:
- stable aspect ratios
- missing-media fallback
- thumbnail consistency
- hero media consistency
- optional zoom/detail inspection
- media must support trust, not just aesthetics

### Notifications and feedback
- toast for lightweight success
- inline/page-level alert for blocking failure
- notification items should summarize:
  - event
  - affected entity
  - time
  - recommended next action

### Loading and skeletons
- skeletons must resemble final layout
- avoid layout collapse
- use section-level skeletons on data-rich screens
- spinner-only full pages should be rare

---

## Accessibility Rules

Target:
- WCAG 2.2 AA
- keyboard-first for web operational surfaces
- semantic HTML before ARIA
- visible focus states
- reduced-motion support

Acceptance criteria:
- all interactive elements reachable by keyboard
- focus visible at high zoom
- status not communicated by color alone
- labels and errors programmatically associated
- dialogs, tabs, menus, and drawers have correct semantics
- touch targets at least 44x44 CSS px where applicable
- reduced motion respected

For Flutter dealer app:
- preserve semantic labels where supported
- keep tappable controls large and distinct
- ensure contrast and readable hierarchy on smaller screens

---

## Content and Labeling Standards

Default writing language:
- concise business Vietnamese
- use English only for standard technical/domain terms when translation hurts clarity

Rules:
- action labels start with clear verbs
- empty state explains what happened and what to do next
- error message explains problem and safest recovery path
- avoid vague labels such as:
  - “Xử lý”
  - “Tiếp tục”
  - “Khác”
  - “Thao tác”

Good:
- “Chưa có đơn hàng phù hợp với bộ lọc hiện tại.”
- “Thanh toán đã được ghi nhận. Đơn hàng đang chờ xác nhận.”
- “Không thể tải danh sách bảo hành. Vui lòng thử lại.”

Bad:
- “Có lỗi xảy ra.”
- “Thành công.”
- “Tiếp tục.”

---

## Safe Change Boundaries for Codex / Agents

### Non-negotiable rules
- Do not change route/slug/SEO contract in `main-fe` unless the task explicitly requires it.
- Do not change backend/API contract from a UI-only task.
- Do not rename canonical business fields locally just for convenience.
- Do not invent new business states in the UI.
- Do not alter status meaning as a cosmetic change.
- Do not introduce a new visual language for one surface without documenting why.
- Do not build ornamental complexity into admin or dealer flows.

### Required behavior when editing UI
Before changing a screen or component:
1. restate the screen intent
2. identify which surface it belongs to
3. reuse existing shared primitives/tokens first
4. preserve canonical labels and state semantics
5. define loading, empty, error, success, and destructive-confirmation states
6. preserve responsive behavior
7. preserve accessibility
8. preserve business contract

### If a task touches multiple surfaces
The agent must explicitly separate:
- what must stay shared
- what is surface-specific
- what is a true product decision vs a visual refinement

---

## Repo-Aware Validation Rules

### `main-fe`
After touching `main-fe`, prefer to run:
- install dependencies if needed
- `npm run lint`
- `npm run build`
- tests if affected

### `admin-fe`
After touching `admin-fe`, prefer to run:
- install dependencies if needed
- `npm run lint`
- `npm run build`
- tests if affected

### `dealer`
After touching `dealer`, prefer to run:
- `flutter analyze`
- relevant tests if affected
- build sanity check if practical

If a command cannot be run, state that clearly instead of pretending everything is fine. Human beings do adore ceremonial confidence unsupported by evidence.

---

## Migration Rules

When existing UI is inconsistent:
- replace duplicated local status styling with shared semantic mapping
- replace raw hex values inside feature modules with shared tokens
- replace placeholder-as-label patterns with explicit labels
- replace one-off dashboard summary cards with shared metric primitives
- introduce adapters before large rewrites if legacy data shape still exists
- do not rewrite all three surfaces at once unless explicitly requested

---

## Anti-Patterns

Do not:
- create separate visual languages for main-fe, admin-fe, and dealer
- use the same business state with different labels/colors across clients
- sacrifice scan speed in admin for visual flair
- bury totals/payment/order status below decorative sections
- rely on icon-only controls where text clarity is needed
- use low-contrast metadata that users actually need
- make public SEO pages depend on heavy client-only visual logic
- add 3D/WebGL theatrics to utility/legal/content-heavy routes
- mix multiple visual metaphors on one page

---

## Required Output Structure for Agent Guidance
When generating design-system or UI implementation guidance, use this structure:

1. Context and screen/flow intent
2. Surface classification
3. Shared rules that must be preserved
4. Surface-specific priorities
5. Design tokens and visual foundations
6. Component-level rules:
   - anatomy
   - variants
   - states
   - responsive behavior
7. Accessibility requirements
8. Content/labeling standards
9. Anti-patterns
10. Migration notes
11. QA checklist

---

## Required QA Checklist
Before finalizing UI guidance or UI code changes, verify:

- Are tokens shared instead of guessed locally?
- Are order/payment/warranty/serial states mapped canonically?
- Is the primary action obvious?
- Are destructive actions safely separated?
- Are empty/loading/error/success states present?
- Is the target surface optimized correctly:
  - premium readable for main-fe
  - compact operational for admin-fe
  - mobile-practical for dealer
- Is the design responsive under long labels, large prices, and missing media?
- Are keyboard/focus or touch-target rules satisfied?
- Are SEO/public-route constraints preserved for `main-fe`?
- Does the result still feel like one 4thitek product family?
