# BRAND_GUIDELINES.md

> Brand guideline for the 4thitek / 4T HITEK system, derived from the TK HiTek brand guideline source document.
>
> This file is intended for AI coding agents and human developers working on `main-fe`, `admin-fe`, `dealer-fe`, and brand-related UI/copy/design work.

---

## 1. Brand Identity

### 1.1 Brand Essence

The brand identity is inspired by **technology, futuristic products, mobility, and freedom on the road**.

Core message:

> **KẾT NỐI MỌI NƠI, THẢNH THƠI THƯỞNG THỨC**

Meaning:
- Enable smooth communication and connection during long rides.
- Communicate a modern, technical, premium, and mobile-first feeling.
- Support riders, bikers, dealers, and customers with a sense of freedom, movement, and confidence.

### 1.2 Brand Personality

Use these traits consistently:

| Trait | Meaning in UI / Content |
|---|---|
| Technology-driven | Clean, precise, modern layouts. No childish visuals. |
| Premium | Dark surfaces, strong hierarchy, restrained effects. |
| Dynamic | Motion, riding, travel, touring, freedom. |
| Youthful | Energetic but not chaotic. |
| Practical | Clear product information, warranty, dealer, order, and support flows. |
| Reliable | Consistent UI states, readable text, trustworthy product presentation. |

### 1.3 Naming Rules

The source brand guideline refers to **TK HiTek**.

For this project, use the active system/business naming from the repository/project context:

- Public/system display name: **4T HITEK**
- Website/domain context: **4thitek.vn**
- Product/channel context: **SCS Vietnam** where appropriate
- Visual guideline source: **TK HiTek brand guideline**

Rules:
- Do not randomly switch between `TK HiTek`, `4T HITEK`, `4thitek`, and `SCS Vietnam`.
- Use `4T HITEK` for company/system identity unless another project file explicitly requires otherwise.
- Use `SCS Vietnam` only for product communication, public channel references, or SCS intercom brand context.
- Do not invent new brand names.

---

## 2. Logo System

### 2.1 Logo Meaning

The brand symbol is built from a combination of:
- The monogram forms **T** and **K**
- The visual association of **bird wings in flight**

Meaning:
- Freedom
- Movement
- Exploration
- Personal expression
- Travel and mobility

In product UI, the logo should reinforce the feeling of **connected riding** and **technical reliability**.

### 2.2 Logo Variants

Allowed logo treatments:

| Variant | Usage |
|---|---|
| Full-color logo | Primary usage on clean light or controlled dark backgrounds |
| Blue symbol + gray wordmark | Use on bright/light backgrounds |
| Blue symbol + white wordmark | Use on dark/tech backgrounds |
| Positive version | One-color light/dark usage when full color is not possible |
| Negative version | Use when background conflicts with the primary logo |
| Symbol-only mark | Favicon, app icon, very small spaces |

### 2.3 Favicon / Small Size Rules

When the logo is too small:
- Remove slogan or small details.
- Prefer symbol-only mark.
- Preserve proportions.
- Do not force the full logo into tiny areas.

Recommended favicon/icon sizes:
- 16px
- 22px
- 36px
- 100px

### 2.4 Logo Safe Area

Rules:
- Keep clear spacing around the logo.
- Do not place text, buttons, icons, or photos too close to the logo.
- Do not crop the logo.
- Do not stretch, skew, rotate, or recolor the logo outside approved variants.
- Do not apply shadows/glows that reduce recognition.

### 2.5 Logo Do / Don't

Do:
- Use original vector/SVG assets.
- Keep logo ratio unchanged.
- Choose logo version based on background contrast.
- Use symbol-only mark for favicons and app icons.

Don't:
- Distort the logo.
- Recreate the logo with plain text.
- Use unsupported colors.
- Put the logo on noisy images without contrast protection.
- Use multiple logo color versions within the same design set unless intentionally required.

---

## 3. Color System

### 3.1 Primary Brand Colors

| Token | HEX | RGB | CMYK | Usage |
|---|---|---|---|---|
| Brand Blue | `#29ABE2` | `41, 171, 226` | `70, 15, 0, 0` | Primary action, highlights, logo flat color |
| Brand Blue Deep | `#0071BC` | — | — | Gradient endpoint |
| Brand Dark Blue | `#3F4856` | `63, 72, 86` | `76, 64, 48, 34` | Wordmark, dark UI surfaces, neutral dark |

Primary gradient:

```css
linear-gradient(135deg, #29ABE2 0%, #0071BC 100%)
```

### 3.2 Recommended Digital Tokens

Use these tokens in UI projects.

```css
:root {
  --brand-blue: #29ABE2;
  --brand-blue-deep: #0071BC;
  --brand-dark-blue: #3F4856;

  --brand-bg-primary: #07111C;
  --brand-bg-secondary: #0B1724;
  --brand-surface: #101D2B;
  --brand-surface-elevated: #152436;

  --brand-text-primary: #F5FAFF;
  --brand-text-secondary: #B7C5D6;
  --brand-text-muted: #7F90A3;

  --brand-border-subtle: rgba(41, 171, 226, 0.18);
  --brand-border-strong: rgba(41, 171, 226, 0.38);

  --brand-gradient-primary: linear-gradient(135deg, #29ABE2 0%, #0071BC 100%);
}
```

### 3.3 Brand Color Density

Recommended visual density:
- Gradient: **40%**
- Brand Blue: **40%**
- Dark Blue: **10%**
- White / Grey: **10%**

Interpretation for UI:
- Blue or gradient should be the strongest recognizable accent.
- Blue does not need to occupy most of the screen.
- Dark backgrounds are acceptable and recommended for premium tech interfaces.
- Use white/grey for readability and content hierarchy.

### 3.4 Supporting Colors

Supporting colors may be used for data visualization, badges, highlights, or controlled visual accents.

| Color | HEX | RGB | CMYK | Usage |
|---|---|---|---|---|
| Tech Green | `#2BE086` | `43, 224, 134` | `64, 0, 69, 0` | Success, active, positive states |
| Lime Accent | `#BDF919` | `189, 249, 25` | `30, 0, 100, 0` | Promotional highlight, limited use |
| Cyan Teal | `#05A7AF` | `5, 167, 175` | `77, 12, 33, 0` | Secondary technical accent |
| Electric Blue | `#0B5FF4` | `11, 95, 244` | `82, 64, 0, 0` | Alternative link/highlight, charts |

Rules:
- Do not use supporting colors for the primary logo.
- Do not make supporting colors dominate the brand blue.
- Use supporting colors sparingly for semantic UI states.

### 3.5 UI Semantic Colors

```css
:root {
  --color-success: #2BE086;
  --color-warning: #BDF919;
  --color-info: #29ABE2;
  --color-danger: #FF5A65;

  --status-pending: #BDF919;
  --status-processing: #29ABE2;
  --status-shipping: #05A7AF;
  --status-completed: #2BE086;
  --status-cancelled: #7F90A3;
  --status-error: #FF5A65;
}
```

---

## 4. Typography

### 4.1 Primary Typeface

Primary font:

```txt
Source Sans Pro
```

Recommended web fallback:

```css
font-family: "Source Sans 3", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Usage:
- Body text
- Product descriptions
- Admin tables
- Form fields
- Dealer app content
- Website content
- Documents and business UI

### 4.2 Secondary Typeface

Secondary/accent font:

```txt
Montserrat
```

Usage:
- Display headlines
- CTA text
- Marketing banners
- Promotional social content
- Strong section titles

Rule:
- Montserrat must not dominate Source Sans Pro across the same design.
- Use Montserrat to add emphasis, not to replace the main type system.

### 4.3 Font Weight

Recommended weights:
- Black
- Bold
- Semibold
- Regular
- Light

UI usage:
- H1/H2: Bold or Black
- H3/H4: Semibold or Bold
- Body: Regular
- Metadata/helper text: Regular or Light
- CTA: Semibold or Bold

### 4.4 Type Scale

| Element | Size | Usage |
|---|---:|---|
| H1 | 60px | Main hero headline / display title |
| H2 | 45px | Large section title |
| H3 | 36px | Section headline |
| H4 | 26px | Card/feature group title |
| CTA / Website Button | 24px | Large CTA, hero action |
| Menu / Tab Bar | 18px | Navigation |
| Footer / Bottom Website | 18px | Footer text |
| Body Text | 16px | Paragraph, product copy, admin/dealer content |

Responsive rule:
- On mobile, reduce H1/H2 while keeping hierarchy.
- Do not let headings wrap awkwardly.
- Prefer readable line-height over visual compression.

Recommended CSS:

```css
:root {
  --font-primary: "Source Sans 3", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-display: "Montserrat", "Source Sans 3", sans-serif;

  --text-h1: clamp(40px, 6vw, 60px);
  --text-h2: clamp(34px, 5vw, 45px);
  --text-h3: clamp(28px, 4vw, 36px);
  --text-h4: clamp(22px, 3vw, 26px);
  --text-body: 16px;
  --text-menu: 18px;
  --text-cta: 24px;

  --leading-tight: 1.05;
  --leading-heading: 1.15;
  --leading-body: 1.6;
}
```

---

## 5. Layout & Grid

### 5.1 Grid Principle

The visual system should be:
- Simple
- Clean
- Professional
- Balanced
- Structured

The brand guideline recommends a grid system to organize layout, information, and images consistently.

### 5.2 Recommended Grid

For web and large layouts:
- Use a 12-column grid.
- Left and right outer columns act as margins.
- Main content should sit inside the 10 inner columns.

Implementation:

```css
.container-brand {
  width: min(100% - 32px, 1200px);
  margin-inline: auto;
}

.grid-brand-12 {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;
}
```

Usage:
- Public website sections
- Product pages
- Landing pages
- Brand visuals
- Marketing layouts
- Admin dashboard cards

### 5.3 Spacing

Recommended spacing scale:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

Rules:
- Use consistent spacing instead of arbitrary pixel values.
- Admin screens may use denser spacing but must remain readable.
- Dealer mobile screens need generous tap targets and clear content separation.

---

## 6. Imagery & Visual Treatment

### 6.1 Image Direction

Preferred image style:
- Technology
- Futuristic
- Motorcycle touring
- Road movement
- Blue-hour / night / dark premium mood
- Rider communication and connected mobility
- Product close-ups with clean lighting
- Subtle blue glow, not cheap neon overload

Avoid:
- Random stock photos with no tech/rider relevance
- Overly bright lifestyle images that dilute the premium tech mood
- Cartoonish or childish visuals
- Excessive visual noise behind important text

### 6.2 Image Blend Treatment

Brand images should visually connect with the brand color.

Recommended method:
- Add a brand blue overlay.
- Use blend modes such as:
  - Darken
  - Multiply
  - Overlay

Example CSS:

```css
.brand-image-wrap {
  position: relative;
  overflow: hidden;
  background: #07111C;
}

.brand-image-wrap::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(41, 171, 226, 0.35);
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

Rules:
- Do not make product images inaccurate.
- Do not reduce readability of important product details.
- Use overlays for mood, not to hide poor image quality.

---

## 7. Iconography

### 7.1 Icon Style

Icons are used for:
- Name cards
- Website contact blocks
- Product features
- CTA sections
- Dealer app navigation
- Admin dashboard actions

Allowed icon colors:
- Brand Blue `#29ABE2`
- White
- Black / Dark
- Positive / Negative versions when required

Rules:
- Prefer simple geometric icons.
- Keep stroke width consistent.
- Avoid decorative icon sets that clash with the technical brand.
- Do not use multi-color random icon packs.
- Icons must support brand recognition and UI clarity.

### 7.2 Recommended UI Icon Behavior

| Context | Icon Style |
|---|---|
| Primary CTA | Brand blue / white |
| Admin dashboard | Neutral + blue accent |
| Dealer app | Clear, high-contrast, mobile readable |
| Product feature | Blue line/solid icon |
| Error/danger | Use semantic danger, not brand blue |

---

## 8. Application Rules by Product

### 8.1 Main FE / Public Website

Goal:
- SEO-friendly public product and marketing website.
- Premium technical first impression.
- Strong product storytelling.

Rules:
- Use dark premium background with brand blue accents.
- Use hero visuals with motorcycle touring / SCS intercom / futuristic connection mood.
- Keep product information structured and readable.
- Do not overload pages with gradients.
- Preserve brand consistency across homepage, product pages, warranty pages, policy pages, and blog/SEO pages.
- Use canonical product media fields from `DATA_CONTRACT.md`.

### 8.2 Admin FE

Goal:
- Back-office operational efficiency.
- Data clarity and predictable workflows.

Rules:
- Prioritize readability, table density, search/filter controls, status clarity.
- Use brand blue for active states, primary actions, and key metrics.
- Avoid overly decorative marketing visuals inside admin screens.
- Keep forms aligned, labels clear, error states visible.
- Critical actions must be visually distinct and confirmation-driven.

### 8.3 Dealer FE / Mobile App

Goal:
- Fast mobile ordering, product browsing, warranty/support access.

Rules:
- Mobile-first layout.
- Clear product cards.
- Easy quantity adjustment and cart access.
- Status badges must be readable.
- Support/warranty/order flows must feel trustworthy and direct.
- Brand blue should guide action, not decorate everything randomly.

---

## 9. Social Media & Marketing Assets

### 9.1 Direction

Social Media designs must optimize:
- Brand color usage
- Typeface consistency
- Technology feeling
- Youthful / bold / dynamic expression
- Professional presentation

### 9.2 Font Rule

Use maximum **2 fonts** on one design:
- Source Sans Pro / Source Sans 3
- Montserrat

Do not mix multiple unrelated fonts.

### 9.3 Social Layout Rules

Do:
- Use brand blue and gradient as visual anchors.
- Use strong text hierarchy.
- Keep CTA clear.
- Keep contact/domain info readable.
- Use tech/rider/product images with brand overlay.

Don't:
- Fill the design with too much text.
- Use random colors outside the palette.
- Use low-resolution product images.
- Use inconsistent logo placement across a campaign set.

---

## 10. Accessibility & Readability

### 10.1 Contrast

Rules:
- Text must remain readable on dark backgrounds.
- Do not place small text directly over busy images.
- Use overlays, scrims, or surface cards when text appears over images.
- Primary CTA must have strong contrast against the background.

### 10.2 Interaction States

Every interactive element must include:
- Default state
- Hover/focus state
- Active/pressed state
- Disabled state
- Loading state when async
- Error state when relevant

### 10.3 Motion

Motion should feel technical and premium:
- Smooth fade/slide
- Subtle parallax
- Product reveal
- Lightweight hover effects

Avoid:
- Bouncy childish animation
- Excessive glow
- Motion that blocks user action
- Animation without purpose

---

## 11. Implementation Tokens

### 11.1 Tailwind Theme Extension

Use this as a starting point for Next.js / React / Vite projects.

```ts
export const brandTheme = {
  colors: {
    brand: {
      blue: "#29ABE2",
      blueDeep: "#0071BC",
      darkBlue: "#3F4856",
      bg: "#07111C",
      bgSecondary: "#0B1724",
      surface: "#101D2B",
      surfaceElevated: "#152436",
      text: "#F5FAFF",
      textSecondary: "#B7C5D6",
      textMuted: "#7F90A3",
      border: "rgba(41, 171, 226, 0.18)",
    },
    semantic: {
      success: "#2BE086",
      warning: "#BDF919",
      info: "#29ABE2",
      danger: "#FF5A65",
    },
  },
  fontFamily: {
    sans: ['"Source Sans 3"', '"Source Sans Pro"', "system-ui", "sans-serif"],
    display: ['"Montserrat"', '"Source Sans 3"', "sans-serif"],
  },
};
```

### 11.2 Flutter Theme Tokens

Use this as a starting point for the dealer app.

```dart
import 'package:flutter/material.dart';

class BrandColors {
  static const blue = Color(0xFF29ABE2);
  static const blueDeep = Color(0xFF0071BC);
  static const darkBlue = Color(0xFF3F4856);

  static const bgPrimary = Color(0xFF07111C);
  static const bgSecondary = Color(0xFF0B1724);
  static const surface = Color(0xFF101D2B);
  static const surfaceElevated = Color(0xFF152436);

  static const textPrimary = Color(0xFFF5FAFF);
  static const textSecondary = Color(0xFFB7C5D6);
  static const textMuted = Color(0xFF7F90A3);

  static const success = Color(0xFF2BE086);
  static const warning = Color(0xFFBDF919);
  static const info = Color(0xFF29ABE2);
  static const danger = Color(0xFFFF5A65);
}

class BrandGradients {
  static const primary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [BrandColors.blue, BrandColors.blueDeep],
  );
}
```

---

## 12. AI Agent Rules

When modifying UI, copy, design tokens, layouts, or marketing assets:

1. Read this file before changing visual design.
2. Do not introduce a new color palette.
3. Do not change the brand typography without updating this file.
4. Do not add light/dark theme switching unless explicitly required.
5. Keep dark premium tech style as the default system direction.
6. Keep brand blue as the main recognizable accent.
7. Use Source Sans Pro / Source Sans 3 as primary UI font.
8. Use Montserrat only as secondary/accent/display font.
9. Preserve logo proportions and approved logo variants.
10. Use consistent spacing, grid, and hierarchy.
11. Keep admin practical, dealer mobile-first, main-fe premium/SEO-friendly.
12. Do not hardcode real private business, payment, or personal data into UI.
13. If a UI change conflicts with this file, update this file and explain the reason.

---

## 13. Quick Checklist

Before marking a design/UI task complete:

- [ ] Brand blue `#29ABE2` is used consistently.
- [ ] Gradient uses `#29ABE2 -> #0071BC`.
- [ ] Dark blue `#3F4856` is used appropriately.
- [ ] Typography follows Source Sans Pro / Source Sans 3 + Montserrat.
- [ ] Logo is not distorted or recolored incorrectly.
- [ ] Layout uses consistent grid/spacing.
- [ ] Images match tech / futuristic / rider / mobility direction.
- [ ] UI has readable contrast.
- [ ] Buttons, cards, badges, tables, forms are visually consistent.
- [ ] Admin/dealer/main app styles remain related but optimized for their use case.
- [ ] No secret, private, or fake business data was introduced.

---

## 14. Source Reference

This file is derived from the uploaded TK HiTek Brand Guideline PDF, including:
- Creative inspiration
- Logo meaning
- Logo variants
- Brand colors
- Typography
- Grid system
- Image blending
- Icon system
- Social media direction
