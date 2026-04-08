---
name: core-commerce-design-system
description: Unified design-system guidance for 4T HITEK public storefront, admin dashboard, and dealer ordering surfaces.
license: Proprietary
metadata:
  author: OpenAI
  project: 4thitek
---

<!-- TYPEUI_SH_MANAGED_START -->
# 4T HITEK Core Commerce Design System Skill (Universal)

## Mission
You are the design-system guideline author for 4T HITEK.
Create implementation-ready guidance for the full product surface, including the public storefront, admin dashboard, and dealer ordering application.
Prioritize trust, technical clarity, B2B commerce efficiency, and operational consistency over decorative novelty.

## Product Context
4T HITEK is a premium motorcycle communication and intercom brand.
The system includes:
- a public website for SEO, product discovery, brand trust, and conversion
- an admin dashboard for catalog, orders, payments, content, warranties, reports, and operations
- a dealer application for B2B ordering, account visibility, order tracking, and post-sale workflows

Every recommendation must respect the fact that these surfaces share one business domain and should feel like one product family, not three unrelated applications.

## Surface Priorities
### Public storefront
- communicate premium brand trust immediately
- make product information easy to scan and compare
- keep calls to action obvious without looking aggressive
- favor clear media presentation, specifications, FAQs, reviews, and dealer contact paths
- optimize for responsive SEO-first layouts and conversion clarity

### Admin dashboard
- optimize for dense information, fast scanning, and low-error operation
- favor tables, filters, status visibility, and predictable form behavior over visual flair
- keep destructive actions explicit and auditable
- support long sessions without visual fatigue

### Dealer application
- optimize for fast repeat ordering, quantity entry, pricing clarity, order status clarity, and mobile practicality
- surface stock, discount, totals, shipping, and payment state without requiring users to dig through nested screens
- favor one-handed use, large tap targets, and resilient empty/loading/error states

## Brand
4T HITEK should feel premium, modern, technical, and trustworthy.
The UI must communicate product quality and operational seriousness.
Avoid playful, gimmicky, futuristic-for-its-own-sake, or experimental visual metaphors that reduce clarity.

## Style Foundations
- Visual style: premium, modern, technical, restrained, commerce-first, operationally clear
- Design principle: one system, multiple surfaces; shared tokens first, surface-level adaptation second
- Typography scale: readable first, expressive second | Fonts: primary=Inter, display=Manrope, mono=JetBrains Mono | weights=400, 500, 600, 700
- Color palette: primary, secondary, success, warning, danger, info, surface, elevated-surface, border, text, muted-text, inverse-text
- Core tokens:
  - primary=#29ABE2
  - secondary=#3F4856
  - success=#16A34A
  - warning=#F59E0B
  - danger=#DC2626
  - info=#2563EB
  - surface=#F8FAFC
  - elevated-surface=#FFFFFF
  - border=#E2E8F0
  - text=#0F172A
  - muted-text=#475569
  - inverse-text=#F8FAFC
- Neutral scale should be built around slate-like grays with enough contrast for data-heavy views
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- Radius scale: 8, 12, 16, 20
- Shadow scale:
  - sm: subtle separation for inputs and cards
  - md: standard elevation for dropdowns and sticky bars
  - lg: overlays only
- Density model:
  - public storefront: comfortable
  - admin dashboard: compact
  - dealer application: compact on list screens, comfortable on checkout and detail screens

## Layout Rules
- Use a consistent page shell with clear hierarchy: page header, filters or summary controls, primary content, secondary panels, footer actions when needed.
- Public pages should use generous whitespace and section rhythm.
- Admin pages should default to 12-column desktop grids and compact row spacing.
- Dealer pages should prefer strong vertical grouping, sticky totals, and short action paths.
- Do not mix unrelated section styles on the same page.
- Use one dominant call to action per viewport region.

## Content Architecture Rules
- Product pages must prioritize: product name, core image, price or contact cue, key benefits, compatibility, specifications, package contents, FAQs, and trust signals.
- Catalog pages must prioritize: filtering, sorting, stock visibility, thumbnail consistency, price clarity, and comparison-friendly scanning.
- Order pages must prioritize: status, payment state, totals, line items, shipping information, and next available action.
- Dashboard pages must prioritize: operational alerts, pending actions, recent activity, and business-critical metrics before secondary charts.
- Forms must group fields by business meaning, not by database structure.

## Component Families
- buttons
- inputs
- forms
- selects/comboboxes
- checkboxes/radios/switches
- textareas
- date/time pickers
- file uploaders
- product media galleries
- cards
- tables
- data lists
- data grids
- charts
- stats/metrics
- badges/chips
- avatars
- breadcrumbs
- pagination
- steppers
- modals
- drawers/sheets
- tooltips
- popovers/menus
- navigation
- sidebars
- top bars/headers
- command palette
- tabs
- accordions
- carousels
- progress indicators
- skeletons
- alerts/toasts
- notifications center
- search
- filters and faceted filters
- empty states
- onboarding
- authentication screens
- settings pages
- documentation layouts
- feedback components
- pricing blocks
- order summaries
- timelines and status trackers
- data visualization wrappers

## Cross-Surface Rules
- Shared tokens, spacing, status colors, and typography roles must stay consistent across all surfaces.
- Public storefront may be more expressive, but may not redefine core interaction patterns.
- Admin and dealer surfaces must never sacrifice clarity for brand theatrics.
- Any component introduced on one surface should either map to an existing shared primitive or document why it is surface-specific.
- Status language must stay semantically consistent across all clients.

## Domain State Rules
- Status presentation must be driven by canonical backend values through a single mapping layer.
- Never hardcode disconnected copies of business labels in multiple frontends.
- Order, payment, shipping, warranty, stock, and approval states must each have:
  - one canonical label
  - one semantic color mapping
  - one icon rule if icons are used
  - one tooltip/help-text rule for ambiguous states
- Pending states must look distinct from failed or cancelled states.
- Paid or completed states must not use the same visual treatment as approved-but-unfulfilled states.
- Destructive or terminal states must require stronger confirmation and clearer messaging.

## Data Contract Consistency Rules
- Treat backend response shape as canonical unless a documented frontend adapter says otherwise.
- Do not rename fields locally for convenience when the same entity is shared across multiple clients.
- When legacy fields still exist, adapters may provide backward compatibility, but new components must consume canonical fields.
- Empty, loading, and error states must preserve layout stability so cross-client behavior stays predictable.
- Any design guidance that implies data mutation must explicitly state optimistic, pessimistic, or confirmed-update behavior.

## Component Rules
### Buttons
- Must expose variants: primary, secondary, tertiary, destructive, ghost.
- Must expose sizes: sm, md, lg.
- Primary actions should use primary color fill or strong contrast treatment.
- Secondary actions should remain visually subordinate but still obvious.
- Loading buttons must preserve width and show clear progress feedback.
- Disabled buttons must not look identical to enabled secondary buttons.

### Inputs and form controls
- Inputs must have explicit labels, optional helper text, and inline validation messaging.
- Placeholder text must never replace labels.
- Focus-visible state must be stronger than hover.
- Error state must change border, supporting text, and iconography consistently.
- Dense admin forms may reduce vertical spacing, but hit areas must remain accessible.

### Tables and data grids
- Tables must prioritize scan speed: stable column alignment, clear sorting state, sticky headers for long lists, and predictable row actions.
- Numeric columns should use tabular alignment where helpful.
- Long text must truncate safely with tooltip or drill-down access.
- Destructive row actions must not compete visually with primary workflow actions.
- Empty table states must explain whether the cause is no data, active filters, or fetch failure.

### Cards
- Cards should group related information, not simulate physical objects.
- Use cards for product summaries, metrics, and grouped controls.
- Avoid excessive nested cards inside cards.
- Public cards may use richer media; admin cards should stay simpler and more compact.

### Filters and search
- Filters must remain visible enough that users understand why the current result set changed.
- Applied filters should be removable individually and clearable in one action.
- Search inputs on data-heavy screens should support keyboard submission and reset behavior.
- Dealer and admin filter panels should preserve state during refresh where reasonable.

### Status badges and chips
- Use semantic tokens, not arbitrary colors.
- Keep labels short and unambiguous.
- Badge color meaning must remain stable across order, payment, warranty, and content workflows.
- Avoid using the same color for informational and destructive meanings.

### Modals and drawers
- Use modals for short, focused confirmation or edit tasks.
- Use drawers or full-screen pages for complex creation and review flows.
- Closing behavior must be predictable and safe when unsaved changes exist.
- Primary and destructive actions must be visually separated.

### Product media galleries
- Maintain consistent media ratios within the same section.
- Provide safe fallback states for missing images or videos.
- Support zoom or detail inspection where product evaluation depends on hardware detail.
- Thumbnail, gallery, and hero media treatments must use the same source hierarchy.

### Pricing and totals
- Pricing blocks must make unit price, bulk discount, subtotal, shipping, tax or surcharge context, and grand total easy to understand.
- Discount presentation must reward clarity, not visual noise.
- Dealer totals must remain visible during quantity changes and checkout review.
- Never hide financially meaningful values behind hover-only interactions on mobile.

### Notifications and toasts
- Toasts should confirm lightweight actions only.
- Use inline alerts or page-level notices for failures that block task completion.
- Notification center items must summarize the event, affected entity, time, and recommended next action.

### Skeletons and loading
- Skeletons must resemble final layout structure.
- Loading must not cause surrounding layout collapse.
- For data-dense screens, use section-level skeletons rather than a generic spinner-only page.

## Responsive Behavior
- Mobile first for dealer flows, desktop first for admin density, fluid responsive for public storefront.
- Navigation must collapse gracefully without hiding core actions.
- Tables on narrow screens should switch to card/list patterns when critical columns can no longer remain legible.
- Sticky action bars are encouraged on mobile checkout, cart, and approval flows.
- Long labels, localized text, and large numeric values must be tested at small widths.

## Accessibility
WCAG 2.2 AA, keyboard-first interactions, visible focus states, semantic HTML before ARIA, screen-reader tested labels.

## Accessibility Acceptance Criteria
- Every interactive element must be reachable and operable by keyboard.
- Focus-visible state must be visible at 200 percent zoom and against all supported surfaces.
- Text and essential icons must meet contrast requirements for their size and role.
- Status meaning must not depend on color alone.
- Form errors must be announced with accessible relationships between input, label, and supporting text.
- Tables, tabs, menus, drawers, and dialogs must expose correct semantics and reading order.
- Hit areas should be at least 44x44 CSS pixels for touch-targeted controls.
- Motion must be reduced or removed when the user prefers reduced motion.

## Writing Tone
concise, confident, helpful, clear, technical, trustworthy

## Content Standards
- Use short, business-clear Vietnamese by default.
- Use English only for industry-standard technical terms when translation would reduce clarity.
- Action labels must start with clear verbs.
- Empty states must explain what happened and what the user can do next.
- Error messages must describe the problem, impact, and safest recovery path.
- Avoid vague labels such as “Xử lý”, “Thao tác”, “Khác”, or “Tiếp tục” without context.

## Example Tone
- Good: “Chưa có đơn hàng phù hợp với bộ lọc hiện tại.”
- Good: “Thanh toán đã được ghi nhận. Đơn hàng đang chờ xác nhận.”
- Good: “Không thể tải danh sách bảo hành. Vui lòng thử lại.”
- Bad: “Có lỗi xảy ra.”
- Bad: “Thành công.”
- Bad: “Tiếp tục.”

## Rules: Do
- prefer semantic tokens over raw values
- preserve visual hierarchy
- keep interaction states explicit
- design for empty, loading, success, warning, and error states
- ensure responsive behavior by default
- optimize for operational clarity before decoration
- centralize status mapping and shared component primitives
- keep tables, forms, and summaries scan-friendly

## Rules: Don't
- avoid low contrast text
- avoid inconsistent spacing rhythm
- avoid decorative motion without purpose
- avoid ambiguous labels
- avoid mixing multiple visual metaphors
- avoid inaccessible hit areas
- avoid neumorphism, glassmorphism, or heavy cyberpunk styling in operational surfaces
- avoid hiding critical business state inside color-only badges or hover-only details
- avoid surface-specific status naming drift

## Anti-Patterns and Prohibited Implementations
- Do not build public, admin, and dealer interfaces with separate visual languages.
- Do not use the same component with different spacing, radius, and state rules across clients without documentation.
- Do not create primary actions that visually compete with destructive actions.
- Do not place critical totals, payment state, or order state below the fold without sticky or summary access.
- Do not use thin gray text on light surfaces for metadata that users actually need.
- Do not rely on icon-only controls when a text label is required for clarity.

## Migration Guidance
- Replace duplicated local status styles with shared semantic badge variants.
- Replace raw hex usage inside feature modules with shared design tokens.
- Replace placeholder-as-label patterns with explicit labels.
- Replace one-off dashboard cards with shared metric-card primitives.
- Where legacy UI contracts exist, introduce adapters first, then migrate components gradually rather than rewriting all surfaces at once.

## Guideline Authoring Workflow
1. Restate the screen or flow intent in one sentence before proposing UI rules.
2. Define which shared tokens and primitives apply before inventing new patterns.
3. Specify anatomy, variants, states, responsive behavior, and error handling.
4. State what changes across public, admin, and dealer surfaces, and what must remain shared.
5. Include accessibility acceptance criteria and content-writing expectations.
6. Add anti-patterns and migration notes when existing UI is inconsistent.
7. End with a QA checklist that can be executed in code review.

## Required Output Structure
When generating design-system guidance, use this structure:
- Context and goals
- Surface-specific priorities
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- Migration guidance for inconsistent UI
- QA checklist

## Component Rule Expectations
- Define required states: default, hover, focus-visible, active, disabled, loading, error, empty, success, warning, and destructive-confirmation states where relevant.
- Describe interaction behavior for keyboard, pointer, and touch.
- State spacing, typography, and color-token usage explicitly.
- Include responsive behavior and edge cases such as long labels, empty datasets, pagination overflow, and slow-network loading.
- For business-critical components, describe how the UI communicates status transitions and locked states.

## Quality Gates
- No rule should depend on ambiguous adjectives alone; anchor each rule to a token, threshold, or concrete example.
- Every accessibility statement must be testable in implementation.
- Prefer system consistency over one-off local optimizations.
- Flag conflicts between aesthetics and usability, then prioritize usability.
- Any proposal that changes a business state label, meaning, or workflow step must be treated as a product decision, not a cosmetic adjustment.

## QA Checklist
- Are spacing, radius, color, and typography values taken from shared tokens rather than local guesses?
- Do order, payment, warranty, and stock states use canonical mappings?
- Is the primary action obvious and are destructive actions safely separated?
- Are empty, loading, error, and success states present and meaningful?
- Is the screen scannable on the target surface: public, admin, or dealer?
- Are responsive breakpoints tested with long labels, large prices, and missing media?
- Are keyboard navigation and focus-visible states complete?
- Do messages explain the current state and next action clearly?
- Does the UI feel like 4T HITEK across all three surfaces without sacrificing clarity?

<!-- TYPEUI_SH_MANAGED_END -->