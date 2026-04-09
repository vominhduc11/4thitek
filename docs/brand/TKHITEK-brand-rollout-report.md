# TK HiTek Brand Rollout Report

## 1. Coverage Report - Main FE

| Surface                 | Scope audited                                                                                                                                                                      | Status                   | Notes                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Routes / screens        | `/`, `/home`, `/products`, `/products/[id]`, `/search`, `/warranty-check`, `/reset-password`, `/become_our_reseller`, `/contact`, `/blogs`, `/blogs/[id]`, `/reseller_information` | `done`                   | High-traffic customer surfaces now share the same TK HiTek hero, shell, CTA and typography treatment. |
| Dialogs                 | Search modal                                                                                                                                                                       | `done`                   | Search modal restyled to brand panel, gradient emphasis and Source Sans 3 body hierarchy.             |
| Bottom sheets           | Customer FE does not use dedicated bottom sheets in audited scope                                                                                                                  | `inherits shared system` | Responsive overlays and drawers inherit the common panel, border and spacing rules.                   |
| Drawers                 | Mobile side drawer                                                                                                                                                                 | `done`                   | Drawer shell now matches header/footer/search surfaces and uses the same accent hierarchy.            |
| Shared components       | Header, footer, hero, buttons, cards, inputs, loading, error, typography, globals, tailwind theme                                                                                  | `done`                   | Shared layer is the source of truth for the Main FE brand expression.                                 |
| Tables                  | No primary table-heavy customer route in audited scope                                                                                                                             | `inherits shared system` | Any remaining utility tables inherit global type scale and color tokens.                              |
| Forms                   | Search, warranty form, reset password form                                                                                                                                         | `done`                   | Inputs, helper copy, validation and action buttons now sit on common brand primitives.                |
| Loading / empty / error | Search loading, empty, no-result, warranty errors, global loading/error components                                                                                                 | `done`                   | States use branded panel surfaces instead of isolated cyan/slate palettes.                            |
| Navigation shell        | Header, footer, hero breadcrumb, mobile drawer                                                                                                                                     | `done`                   | Shared shell is consistent across desktop and mobile.                                                 |

## 2. Coverage Report - Dealer FE

| Surface                 | Scope audited                                                                                                                                                         | Status                   | Notes                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Routes / screens        | Launch, login, forgot password, dashboard, product list/detail, cart, checkout, orders, notifications, inventory, warranty hub/activation/export, support history | `done`                   | Material 3 theme now drives the core B2B screens and role-specific widgets. Dealer runtime keeps a single bank-transfer payment model across active transactional flows. |
| Dialogs                 | App-wide dialog theme, form dialogs, system dialogs                                                                                                                   | `inherits shared system` | Dialog styling is controlled from `main.dart` theme primitives.                      |
| Bottom sheets           | Bottom sheet theme, mobile operational sheets                                                                                                                         | `inherits shared system` | Bottom sheets inherit the new brand surface, radius and typography rules.            |
| Drawers                 | Dealer shell / navigation containers                                                                                                                                  | `inherits shared system` | Navigation surfaces inherit theme-level shell styling.                               |
| Shared components       | Brand identity, section card, stock badge, support history chip                                                                                                       | `done`                   | Shared widgets now anchor the Dealer FE expression instead of local hardcoded blues. |
| Tables                  | Operational lists, order history, inventory lists, support history                                                                                                    | `inherits shared system` | Dense views inherit Source Sans 3, spacing and color scheme without over-branding.   |
| Forms                   | Login, forgot password, checkout-adjacent actions                                                                                                                     | `done`                   | Form controls use the updated color scheme, focus ring and button hierarchy.         |
| Loading / empty / error | Launch/loading shell and screen-level indicators                                                                                                                      | `inherits shared system` | Theme-level loading shells and component colors follow the new palette.              |
| Navigation shell        | Home shell, nav rail, bottom nav, app bar                                                                                                                             | `done`                   | Navigation uses the same TK HiTek palette with restrained B2B emphasis.              |

## 3. Coverage Report - Admin FE

| Surface                 | Scope audited                                                                                                                            | Status                   | Notes                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Routes / screens        | Login, dashboard, blogs, dealers, orders, reports, payments, settings, users, warranties, support tickets, notifications, route fallback | `done`                   | Admin retains operational density while inheriting the common token system.                |
| Dialogs                 | Confirm dialog                                                                                                                           | `done`                   | Confirm dialog now uses brand border, panel and semantic action styling.                   |
| Bottom sheets           | No dedicated bottom-sheet pattern in audited admin routes                                                                                | `inherits shared system` | Shared overlay and panel tokens cover future sheet surfaces.                               |
| Drawers                 | App layout mobile overlay / sidebar shells                                                                                               | `done`                   | Sidebar and mobile shell now align with the brand but stay productivity-first.             |
| Shared components       | UI kit, toast system, route fallback, layout shell                                                                                       | `done`                   | Shared components are now the admin source of truth for token application.                 |
| Tables                  | Dashboard summaries, revamp pages, CRUD-heavy tables                                                                                     | `inherits shared system` | Table-heavy surfaces inherit colors and type via CSS tokens rather than per-page palettes. |
| Forms                   | Login, CRUD forms, filters, approval flows                                                                                               | `inherits shared system` | Shared input/button tokens in `index.css` and `ui-kit` propagate across forms.             |
| Loading / empty / error | Route fallback, toast states, dashboard empty/loading blocks                                                                             | `done`                   | Status surfaces inherit tokenized backgrounds and controlled alert tones.                  |
| Navigation shell        | App layout, sidebar, topbar, notification/account shell                                                                                  | `done`                   | Light and dark modes now share one TK HiTek layout language.                               |

## 4. Shared Brand System Applied Across All 3 FE

### Color tokens

- Primary gradient: `#29ABE2 -> #0071BC`
- Flat brand blue: `#29ABE2`
- Dark brand neutral: `#3F4856`
- Base dark customer surface: `#06111B`
- Support colors used only when operationally necessary: `#2BE086`, `#BDF919`, `#05A7AF`, `#0B5FF4`
- Error semantics remain tightly scoped to validation and failure surfaces only; they do not replace the blue brand hierarchy.

### Typography tokens

- Primary font runtime: `Source Sans 3` as the safe runtime substitute for `Source Sans Pro`
- Secondary / display font: `Montserrat`
- Display usage: hero titles, section highlights, key shell headings
- Body usage: navigation, forms, tables, helper copy, operational data

### Shape / spacing / elevation

- Main FE: larger hero radius, deeper soft blue shadow, stronger gradient emphasis
- Dealer FE: medium radius and lighter elevation for transactional clarity
- Admin FE: restrained radius and denser shell spacing for scan speed

### Primitive patterns

- Buttons: gradient primary, restrained secondary outline, consistent rounded-full CTA
- Cards / panels: dark layered panel with controlled blue border emphasis
- Inputs: same border, focus ring and placeholder hierarchy across web surfaces
- Chips / badges: brand blue as primary identifier, support colors only for status semantics
- Dialogs / drawers / overlays: shared blur + panel language, no isolated palette islands
- Loading / empty / error: tokenized states instead of one-off cyan/slate compositions

### Icon / logo / imagery rules

- Icons limited to blue, white, neutral dark and tightly scoped status tones
- Existing logo assets preserved; contrast handled by surface/background, not by inventing new logos
- Imagery treated with dark overlay, gradient edge treatment and blue emphasis where relevant

## 5. Brand Consistency Audit

### Main FE

- Brand strength is now highest here: hero video overlays, footer, search experience, product hero and CTA components consistently lead with the TK HiTek gradient/blue pair.
- Typography is now coherent: Source Sans 3 carries body copy while Montserrat/serif display usage stays reserved for titles and storytelling blocks.
- Customer UX keeps trust and conversion priority: search, warranty and reset flows were visually upgraded without changing fetch, routing or submit logic.

### Dealer FE

- Dealer no longer looks like a separate product family. It shares the same blue gradient DNA but keeps calmer surfaces and more compact emphasis for catalog, order, inventory and support workflows.
- Theme-driven Flutter styling replaces scattered hardcoded blues in widgets and operational surfaces.
- Support and stock states remain readable without turning the B2B app into a marketing-heavy customer surface.

### Admin FE

- Admin now reads as the same brand family while preserving utility-first behavior.
- Layout, dashboard, toasts and dialogs inherit tokens centrally from `index.css` and the `ui-kit`, reducing per-page drift.
- Gradient is intentionally restrained to CTA, active state and shell highlights so tables and forms remain fast to scan.

## 6. File List by FE

### Main FE

- `main-fe/tailwind.config.js`
- `main-fe/src/app/layout.tsx`
- `main-fe/src/app/globals.css`
- `main-fe/src/styles/typography.ts`
- `main-fe/src/components/ui/button.tsx`
- `main-fe/src/components/ui/input.tsx`
- `main-fe/src/components/ui/card.tsx`
- `main-fe/src/components/ui/Hero.tsx`
- `main-fe/src/components/ui/Loading.tsx`
- `main-fe/src/components/ui/Error.tsx`
- `main-fe/src/components/ui/SearchModal.tsx`
- `main-fe/src/components/layout/Header.tsx`
- `main-fe/src/components/layout/Footer.tsx`
- `main-fe/src/components/layout/SideDrawer.tsx`
- `main-fe/src/app/home/components/HeroSection.tsx`
- `main-fe/src/app/products/[id]/components/ProductHero.tsx`
- `main-fe/src/app/search/page.tsx`
- `main-fe/src/app/warranty-check/components/WarrantyForm.tsx`
- `main-fe/src/app/warranty-check/components/WarrantyResult.tsx`
- `main-fe/src/app/reset-password/page.tsx`

### Dealer FE

- `dealer/lib/main.dart`
- `dealer/lib/app_router.dart`
- `dealer/lib/login_screen.dart`
- `dealer/lib/forgot_password_screen.dart`
- `dealer/lib/dashboard_screen.dart`
- `dealer/lib/widgets/brand_identity.dart`
- `dealer/lib/widgets/section_card.dart`
- `dealer/lib/widgets/stock_badge.dart`
- `dealer/lib/widgets/support_ticket_history.dart`

### Admin FE

- `admin-fe/src/index.css`
- `admin-fe/src/components/ui-kit.tsx`
- `admin-fe/src/components/RouteFallback.tsx`
- `admin-fe/src/context/ToastContext.tsx`
- `admin-fe/src/hooks/useConfirmDialog.tsx`
- `admin-fe/src/layouts/AppLayoutRevamp.tsx`
- `admin-fe/src/pages/LoginPage.tsx`
- `admin-fe/src/pages/DashboardPageRevamp.tsx`

## 7. Code Changes by FE

### Main FE

- Rebuilt the shared web token layer in `globals.css`, `tailwind.config.js` and typography utilities.
- Reworked customer shell surfaces: header, footer, side drawer, search modal, hero, loading and error.
- Rebranded high-impact conversion/support routes: product hero, search page, warranty check result and reset password.
- Added missing semantic token coverage for destructive validation/error usage in the web layer.

### Dealer FE

- Promoted `main.dart` into the single Material 3 source of truth for color, typography, shape and component themes.
- Updated dealer brand widgets so catalog/order/support surfaces inherit the same visual language.
- Removed remaining old blue/cyan remnants from login/forgot password/support history operational widgets.

### Admin FE

- Centralized dual-theme tokens in `index.css` so revamp pages inherit one brand vocabulary in light and dark mode.
- Updated shared admin shells and systems: layout, UI kit, toast, confirm dialog, login, route fallback.
- Tightened dashboard fallback palette so charts and cards resolve to TK HiTek accent values even if CSS vars are absent.

## 8. Short Explanation for Major Changes

- Shared token-first rollout: brand rules now live in shared theme layers first, so each FE inherits the same foundation before any role-specific expression is added.
- Role-based expression: Main FE gets the strongest storytelling and gradient presence, Dealer FE stays operational-first, Admin FE stays productivity-first.
- Safety-first implementation: only presentation-layer code was changed. No API, route contract, controller signature, backend, database or infra contract was modified.

## 9. Final Regression Checklist

### Main FE

- [x] `npm run build` succeeds in `main-fe`
- [ ] Header, footer, search modal and mobile drawer render correctly on desktop and mobile
- [ ] Product detail hero keeps navigation, shuffle and reseller CTA behavior unchanged
- [ ] Search query, result filtering and deep links still behave correctly
- [ ] Warranty lookup, error handling and export still behave correctly
- [ ] Reset password request / validate / save flows still call the same endpoints and handle the same response shapes

### Dealer FE

- [x] `flutter analyze` succeeds in `dealer`
- [ ] Launch/login/forgot password shells still navigate and validate correctly
- [ ] Dashboard, order, inventory, cart and checkout flows retain behavior
- [ ] Nav rail / bottom nav / dialogs / bottom sheets still render without overflow regressions
- [ ] Support history and stock badges display the intended status semantics

### Admin FE

- [x] `npm run build` succeeds in `admin-fe`
- [ ] Light and dark themes both render with acceptable contrast
- [ ] Sidebar, topbar, confirm dialog, toast and route fallback inherit the new tokens
- [ ] Dashboard and CRUD screens retain layout density, sort/filter behavior and action clarity
- [ ] Theme fallback values still resolve to TK HiTek accent tones if CSS vars are unavailable

## Constraints Preserved

- Brand audit này không thay đổi backend invariants đã đúng
- Runtime order mới vẫn là `BANK_TRANSFER` only
- Dealer/admin/payment copy now reflects the active bank-transfer-only runtime
- Brand accent priority remains blue / gradient first across all three FE
