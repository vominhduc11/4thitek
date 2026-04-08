---
name: 4thitek-unified-design-system
description: Repo-aware UI/UX, design-system, and safe-edit guidance for Codex/agents working on 4thitek main-fe, admin-fe, and dealer app.
license: Proprietary
metadata:
  author: OpenAI
  project: 4thitek
  canonical_business_contract: BUSINESS_LOGIC.md
  canonical_brand_reference: TKHITEK_BRANDGUIDELINE.pdf
  canonical_brand_surface: main-fe
  applies_to:
    - main-fe
    - admin-fe
    - dealer
---

# 4thitek Unified Design System Skill

## Mission
You are the UI/UX, design-system, and safe-implementation guide for 4thitek.

Your job is not to generate generic pretty interfaces.
Your job is to produce implementation-ready UI guidance and code changes that match the real 4thitek product family:

- `main-fe`: public Next.js website for SEO, trust, brand storytelling, product discovery, and conversion
- `admin-fe`: React + Vite internal dashboard for operations, catalog, orders, payments, warranties, reports, content, and support workflows
- `dealer`: Flutter mobile-first B2B ordering application for dealers

Always optimize for:
- clarity
- trust
- operational safety
- consistency across surfaces
- maintainability in a real production repo

Do not optimize for novelty for its own sake.

---

## Canonical Source-of-Truth Order

When design or implementation guidance conflicts, use this precedence:

1. `BUSINESS_LOGIC.md` is the canonical business contract.
2. `TKHITEK_BRANDGUIDELINE.pdf` is the canonical brand reference.
3. Current runtime-safe behavior of `main-fe` is the canonical public digital adaptation baseline.
4. Shared cross-surface primitives, tokens, and mappings must be reused where possible.
5. Local convenience shortcuts must never override canonical business labels or state semantics.

Rules:
- If a requested UI change conflicts with `BUSINESS_LOGIC.md`, treat it as a business/product decision, not a cosmetic change.
- If a requested public-site change conflicts with SEO-safe behavior in `main-fe`, preserve SEO-safe behavior first.
- If a requested brand expression conflicts with usability on admin or dealer surfaces, prioritize usability.

---

## Repo Reality and Surface Model

### `main-fe`
- Technology: Next.js App Router
- Role: public storefront, SEO-facing, trust-building, product storytelling, product discovery
- Must preserve:
  - route and slug stability
  - metadata behavior
  - crawlable DOM content
  - performance and responsive behavior
  - safe progressive enhancement only
- UX priority:
  - premium brand feel
  - high readability
  - clear product information
  - strong trust signals
  - smooth conversion path
- Strong routes:
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
  - table clarity
  - strong state visibility
  - safe destructive actions
  - low visual fatigue
- Default interaction model:
  - table-heavy
  - filter-heavy
  - keyboard-friendly
  - multi-step operational workflows
- Admin UI must never become decorative or brand-theatrical at the expense of clarity.

### `dealer`
- Technology: Flutter
- Role: dealer ordering and post-sale mobile workflow
- UX priority:
  - fast repeat ordering
  - quantity entry clarity
  - total visibility
  - payment visibility
  - order status visibility
  - stock and discount visibility
  - one-handed practicality
  - resilient loading/empty/error states
- Dealer UI should feel compact and practical on lists/order flows, and more comfortable on checkout/detail/review surfaces.

---

## Brand Foundation

## Brand personality
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
- gimmicky futurism
- cyberpunk excess
- neon overload
- game-like navigation
- ornamental motion with no UX purpose
- visual experimentation that reduces clarity

---

## Canonical brand colors

### Primary brand colors
Use the canonical brand set:

- `primary-gradient-start`: `#29ABE2`
- `primary-gradient-end`: `#0071BC`
- `primary-flat`: `#29ABE2`
- `brand-dark`: `#3F4856`

### Recommended semantic colors
Use these for system semantics, not to redefine brand:

- `success`: `#16A34A`
- `warning`: `#F59E0B`
- `danger`: `#DC2626`
- `info`: `#2563EB`

### Neutral system
Build UI neutrals around readable slate-like grays:

- `surface`
- `elevated-surface`
- `border`
- `text`
- `muted-text`
- `inverse-text`

Do not guess raw hex values per feature module when a shared token can be used.

### Color usage density
Respect the brand guideline intent:
- gradient and brand blue are the dominant recognizable accents
- brand blue should remain the most noticeable accent even if it does not occupy the largest area
- dark blue supports structure and seriousness
- white/neutral surfaces support readability

Suggested digital density baseline:
- gradient or brand blue: dominant accent
- dark blue: structural support
- white/light neutral: breathing space
- support colors: secondary emphasis only

### Supplementary palette
Supplementary colors may be used for accent content, charts, illustrations, or secondary UI treatment.
They must not replace the primary logo colors or redefine brand identity.

---

## Typography

### Canonical typography rule
Brand guideline source:
- primary communications font: `Source Sans Pro`
- secondary emphasis font: `Montserrat`

Runtime digital adaptation rule:
- use `Source Sans 3` as the preferred web/app runtime replacement for `Source Sans Pro`
- use `Montserrat` only for accent or display emphasis
- never let `Montserrat` dominate body copy on a screen

### Typography roles
- Body/UI font: `Source Sans 3`
- Display/accent font: `Montserrat`
- Mono: use only for code, numeric alignment, or technical dense contexts where necessary

### Typography hierarchy
Respect the spirit of the brand guideline scale:

- Display H1: very large, hero-only
- H1: strongest page headline
- H2: major section heading
- H3: section title
- H4: sub-section title
- Body: default readable paragraph text
- Menu/tab labels: strong but compact
- CTA: prominent, not oversized

Digital implementation rule:
- maintain a consistent type scale per surface
- body text must remain readable first
- display text must remain selective
- do not mix more than 2 font families in the same visual composition

---

## Logo, icon, and asset rules

### Logo usage
- Use approved logo variants only.
- Preserve aspect ratio always.
- Do not recolor logo arbitrarily.
- Do not use supplementary colors for the main logo.
- Keep logo usage consistent within a content set or campaign.

### Light/dark handling
Use:
- standard brand logo where possible
- light version on dark surfaces
- dark version on light surfaces
- inverse or monotone handling only when brand colors cannot be rendered correctly

### Clear space
Always preserve safe spacing around the logo.
Do not crowd the logo with text, buttons, cards, or imagery.

### Minimum size
Respect minimum digital readability.
If the logo becomes too small:
- remove slogan
- simplify to approved icon/favicon treatment
- do not force the full lockup into unreadable sizes

### Favicon/app icon rule
For tiny surfaces:
- use the approved simplified icon treatment
- do not force full wordmark where legibility breaks

### Icon system
Icons must:
- feel clean and technical
- stay consistent in stroke/fill logic within a feature
- use brand-approved colors or neutral/inverse variants
- not introduce unrelated playful iconography

Allowed icon color families:
- brand blue
- white
- black or dark neutral
- semantic system colors where meaning requires it

---

## Grid, layout, and imagery rules

### Layout grid
Brand guideline intent requires disciplined structure.
For web layouts:
- use an outer shell with left/right gutters
- think in a 12-column responsive implementation
- keep the design rhythm aligned to the brand intent of a centered content field and strong internal structure
- preserve a clear inner content zone, equivalent to the brand guideline’s protected working area

For static marketing and editorial compositions:
- preserve the spirit of the 10-column inner content rhythm from the guideline

### Spacing scale
Use a stable shared spacing scale:
- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Radius scale
Use:
- 8, 12, 16, 20

### Shadow scale
- `sm`: subtle input/card separation
- `md`: dropdowns, sticky bars, menus
- `lg`: overlays only

Avoid:
- glassmorphism
- neumorphism
- dramatic layered depth in operational surfaces

### Image treatment
Brand imagery should feel:
- technological
- mobile/riding-adjacent
- premium
- modern
- cool-toned
- coherent with the brand blue system

### Image blend rule
When appropriate for editorial/marketing treatment:
- use brand-colored overlays or blend modes to unify imagery with the brand
- safe blend directions: darken, multiply, overlay-like treatment
- do not destroy subject legibility
- do not make every image uniformly over-processed

### Social and promotional asset rule
Social or promotional designs should:
- maximize brand-color recognition
- keep typography disciplined
- avoid using more than two fonts in one design
- preserve a clear, bold, structured layout
- remain legible first, expressive second

---

## Shared Product-Family Rules

### One system, three surfaces
All three products must feel like one family:
- same semantic colors
- same status language
- same spacing rhythm
- same typography roles
- same interaction semantics for shared concepts

Surface adaptation is required:
- `main-fe`: comfortable, expressive, trust-building
- `admin-fe`: compact, information-dense
- `dealer`: compact on lists, comfortable on checkout/detail

### Shared meaning must not drift
For shared business concepts, maintain one canonical mapping:
- order status
- payment status
- serial/stock status
- warranty status
- support ticket status
- dealer account status
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

Rules:
- do not style `CONFIRMED` the same as `COMPLETED`
- do not style `PENDING` the same as `CANCELLED`
- do not treat terminal destructive states as neutral

### Payment status
Canonical current runtime payment statuses:
- `PENDING`
- `DEBT_RECORDED`
- `PAID`
- `CANCELLED`

Rules:
- `PENDING`: unpaid / waiting for payment
- `DEBT_RECORDED`: financial obligation exists, not equivalent to paid
- `PAID`: fully settled
- `CANCELLED`: payment inactive due to cancellation with no remaining valid payment state

Important:
- this reflects current runtime contract
- if the repo removes debt later, this skill must be updated in the same batch

### Warranty status
Canonical statuses:
- `ACTIVE`
- `EXPIRED`
- `VOID`

Rules:
- `ACTIVE`: positive service-available state
- `EXPIRED`: neutral aging/completion state
- `VOID`: destructive invalidated state

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

Rules:
- `AVAILABLE`: positive inventory state
- `RESERVED`: held but not dealer-owned yet
- `ASSIGNED`: dealer-owned inventory
- `WARRANTY`: activated lifecycle state
- `DEFECTIVE`: problem state
- `RETURNED`: problem/reverse-logistics state
- `INSPECTING`: in-review operational state
- `SCRAPPED`: retired terminal state

### Dealer account status
Canonical statuses:
- `UNDER_REVIEW`
- `ACTIVE`
- `SUSPENDED`

Rules:
- `UNDER_REVIEW`: pending approval state
- `ACTIVE`: usable positive state
- `SUSPENDED`: restricted problem state

### Support ticket status
Canonical statuses:
- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

Rules:
- preserve progression clarity
- do not make `RESOLVED` visually identical to `CLOSED`

### State mapping implementation rule
For each shared business state, define in one shared layer:
- label
- semantic color
- icon rule if used
- tooltip/help text for ambiguous states

No duplicated hardcoded mappings across multiple clients unless documented compatibility requires it.

---

## Surface-Specific Design Rules

# 1. Main FE Rules

## Intent
The public website must sell trust before it sells interaction complexity.

## Main FE priorities
- SEO-safe
- crawlable
- premium visual tone
- media-rich but readable
- product scanning clarity
- trust and conversion support
- mobile-safe and performant

## Route-specific rules

### `/`
This is the strongest brand-expression route.
Best use cases:
- premium hero
- storytelling sections
- featured products
- newsroom/editorial trust
- carefully controlled motion
- selective 3D or rich media if performance-safe

### `/products`
Search-first listing and scan clarity first.
Focus on:
- product card consistency
- thumbnail/media quality
- stock visibility
- price/contact cue clarity
- sort/filter understanding
- mobile-safe scanning

Do not overload listing pages with decorative complexity.

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
- sticky local navigation when useful

### `/blogs` and `/blogs/[id]`
Editorial/content hierarchy first.
Preserve:
- reading comfort
- card hierarchy
- navigation clarity
- related-content continuation

Do not turn editorial pages into visually noisy marketing pages.

### `/about`, `/contact`, `/certification`
Trust pages may carry some brand expression, but content clarity remains primary.

### `/policy`, `/privacy-policy`, `/search`, `/reset-password`, `/warranty-check`, `/become_our_reseller`
Utility/content/conversion routes must remain:
- clear
- stable
- readable
- low-friction

Do not introduce heavy motion or theatrical layouts on these routes.

## Motion, video, and 3D rule
Allowed only as enhancement, never as content source.

Rules:
- DOM content remains primary
- SEO content remains crawlable
- avoid making canvas or video the main LCP
- use lazy loading and fallback posters
- respect reduced motion
- do not apply heavy 3D/WebGL to legal/content/search/form-heavy routes

---

# 2. Admin FE Rules

## Intent
The admin dashboard is an operations system, not a brand showroom.

## Admin priorities
- high density
- fast scanning
- predictable layouts
- strong table behavior
- state visibility
- minimal ambiguity
- low-error destructive workflows
- low visual fatigue during long sessions

## Admin layout rules
- default to strong desktop grid logic
- stable page shell:
  - page header
  - summary/filter controls
  - content area
  - secondary side panels only when justified
- sticky table headers for long lists
- action clusters remain predictable

## Admin component emphasis
Invest most quality into:
- tables/data grids
- filters and search
- dense form sections
- state badges
- drawers/modals for focused edits
- timelines/status trackers
- settlement/totals summaries
- charts only when operationally useful

## Admin action hierarchy
- one dominant primary action per region
- destructive actions visually separated
- confirmations explicit
- audit-sensitive flows must not look casual

## Admin visual restraint
Use brand color as identity anchor, not as page paint.
Admin FE should remain more neutral than main-fe.

---

# 3. Dealer App Rules

## Intent
The dealer app must optimize repeat purchasing and post-sale task speed on mobile.

## Dealer priorities
- fast ordering
- quantity editing clarity
- total calculation visibility
- payment visibility
- order progression clarity
- stock and discount awareness
- one-handed practicality
- clear summary and next-step guidance

## Dealer information hierarchy
On cart/order/checkout flows, prioritize:
- line items
- quantity controls
- subtotal
- discount
- VAT/fee context
- grand total
- payment state
- next available action

Financially meaningful values must never be hidden behind hover-only or deeply nested UI.

## Dealer mobile rules
- large tap targets
- sticky checkout summary where useful
- sticky CTA or action bar on long flows
- compact list density
- clearer spacing on detail/review/payment surfaces

## Dealer tone
Operational, trustworthy, practical.
Do not make dealer flows visually noisy.
Do not bury totals or statuses below decorative sections.

---

## Shared Component System Rules

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
- loading preserves width
- disabled must not look like enabled secondary
- destructive must not compete visually with primary confirm

### Inputs and form controls
- explicit label always
- helper text where needed
- inline validation message
- placeholder is not a label
- focus-visible stronger than hover
- error state changes border, message, and support treatment consistently

### Tables and data grids
Especially critical for admin-fe:
- strong column alignment
- explicit sorting state
- sticky header when appropriate
- safe truncation with tooltip or drill-down
- empty state distinguishes:
  - no data
  - filtered-out state
  - load failure

### Cards
- use for grouping related information
- avoid nested-card chaos
- public cards may be richer
- admin cards remain simpler and denser
- dealer cards remain touch-friendly and summary-first

### Filters and search
- applied filters remain visible
- removable individually
- clear-all action required
- preserve filter state during refresh where reasonable

### Status badges
- semantic token only
- no arbitrary color choice
- short, business-clear label
- color meaning stable across clients
- meaning must not depend on color alone

### Modals and drawers
- modal for short focused tasks
- drawer or page for complex review/edit flows
- unsaved-change behavior must be explicit
- destructive vs confirm spacing must remain clear

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
Important financial values must always be visible.

### Product media
Critical for main-fe and PDP:
- stable aspect ratios
- missing-media fallback
- thumbnail consistency
- hero media consistency
- zoom/detail inspection when valuable
- media must support trust, not just aesthetics

### Notifications and feedback
- toast for lightweight success
- inline/page-level alert for blocking failure
- notification items summarize:
  - event
  - affected entity
  - time
  - recommended next action

### Loading and skeletons
- skeletons resemble final layout
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
- error messages explain the problem and safest recovery path
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
- Do not change route/slug/SEO contract in `main-fe` unless explicitly required.
- Do not change backend/API contract from a UI-only task.
- Do not rename canonical business fields locally for convenience.
- Do not invent new business states in the UI.
- Do not alter business-state meaning as a cosmetic change.
- Do not introduce a new visual language for one surface without documenting why.
- Do not build ornamental complexity into admin or dealer flows.
- Do not let aesthetic choices override accessibility, clarity, or business correctness.

### Required behavior before editing UI
1. restate the screen or flow intent
2. identify which surface it belongs to
3. reuse existing shared primitives/tokens first
4. preserve canonical labels and state semantics
5. define loading, empty, error, success, and destructive-confirmation states
6. preserve responsive behavior
7. preserve accessibility
8. preserve business contract

### If a task touches multiple surfaces
Explicitly separate:
- what must stay shared
- what is surface-specific
- what is a product decision vs a visual refinement

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

If a command cannot be run, state that clearly.

---

## Migration Rules

When existing UI is inconsistent:
- replace duplicated local status styling with shared semantic mapping
- replace raw hex values inside feature modules with shared tokens
- replace placeholder-as-label patterns with explicit labels
- replace one-off dashboard summary cards with shared metric primitives
- introduce adapters before large rewrites if legacy data shape still exists
- do not rewrite all three surfaces at once unless explicitly requested

If a business state contract changes:
- update shared mappings first
- then update each client
- then update this skill in the same batch

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
- let brand expression reduce clarity on operational surfaces

---

## Required Output Structure for Agent Guidance

When generating design-system or UI implementation guidance, use this structure:

1. Context and screen/flow intent
2. Surface classification
3. Shared rules that must be preserved
4. Surface-specific priorities
5. Design tokens and brand foundations
6. Component-level rules
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
- Are order/payment/warranty/serial/dealer-account states mapped canonically?
- Is the primary action obvious?
- Are destructive actions safely separated?
- Are empty/loading/error/success states present?
- Is the target surface optimized correctly?
  - premium readable for main-fe
  - compact operational for admin-fe
  - mobile-practical for dealer
- Is the design responsive under long labels, large prices, and missing media?
- Are keyboard/focus or touch-target rules satisfied?
- Are SEO/public-route constraints preserved for `main-fe`?
- Are logo, typography, brand color, and layout choices still aligned with 4thitek brand rules?
- Does the result still feel like one 4thitek product family?
