# 4T HITEK Business Identity Sync Report

## Scope Scan

### Main customer-facing FE
- `main-fe/src/lib/site.ts`
- `main-fe/src/lib/seo.ts`
- `main-fe/src/app/layout.tsx`
- `main-fe/src/constants/urls.ts`
- `main-fe/src/context/languageData.ts`
- `main-fe/src/lib/seo.test.ts`
- Metadata/layout files under `main-fe/src/app/**`

### Dealer FE
- `dealer/lib/business_profile.dart`
- `dealer/lib/main.dart`
- `dealer/lib/widgets/brand_identity.dart`
- `dealer/lib/support_screen.dart`
- `dealer/lib/app_router.dart`
- `dealer/lib/l10n/*.arb`
- `dealer/lib/l10n/app_localizations*.dart`
- `dealer/web/index.html`
- `dealer/web/manifest.json`
- `dealer/android/app/src/main/AndroidManifest.xml`
- `dealer/ios/Runner/Info.plist`
- `dealer/windows/runner/Runner.rc`
- `dealer/pubspec.yaml`

### Admin FE
- `admin-fe/src/config/businessProfile.ts`
- `admin-fe/src/context/adminDataTypes.ts`
- `admin-fe/src/pages/LoginPage.tsx`
- `admin-fe/src/pages/ChangePasswordPage.tsx`
- `admin-fe/src/pages/VerifyEmailPage.tsx`
- `admin-fe/src/layouts/AppLayoutRevamp.tsx`
- `admin-fe/index.html`
- `admin-fe/public/logo.png`
- `admin-fe/src/lib/adminDataMappers.test.ts`

### Mobile app
- No standalone mobile app repo was found outside the Flutter-based Dealer app. Dealer FE was treated as the mobile/adaptive surface.

### Backend
- `backend/src/main/java/com/devwonder/backend/config/BusinessIdentity.java`
- `backend/src/main/java/com/devwonder/backend/config/OpenApiConfig.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/site-content.json`
- Mail/notification services under `backend/src/main/java/com/devwonder/backend/service/**`
- Notification helper services under `backend/src/main/java/com/devwonder/backend/service/support/**`
- Selected backend tests with brand string expectations

### Shared config / templates
- `.env`
- `.env.example`
- `.env.production`
- `backend/.env.example`
- `docker-compose.yaml`

## Single Source Of Truth
- Main FE: `main-fe/src/lib/site.ts`
- Dealer FE: `dealer/lib/business_profile.dart`
- Admin FE: `admin-fe/src/config/businessProfile.ts`
- Backend: `backend/src/main/java/com/devwonder/backend/config/BusinessIdentity.java`
- Public content payloads consumed by Main FE: `backend/src/main/resources/site-content.json`

## Information Synced
- Display brand: `4T HITEK`
- Legal company name: `CÔNG TY TNHH 4T HITEK`
- Tax code: `0317535798`
- Registered address: `79/30/52 Âu Cơ, Phương Hoà Bình, TP. Hồ Chí Minh`
- Main phone: `0879689900`
- Official email: `info@4thitek.vn`
- Default automated sender email: `info@4thitek.vn`
- Website / canonical base: `https://4thitek.vn`
- Fanpage / Zalo OA display label: `SCS Vietnam`

## Code Changes

### Main FE
- Replaced legacy brand/contact copy in metadata, SEO structured data, footer/contact/warranty/reseller translations, and public-facing page metadata.
- Centralized business/contact constants in `main-fe/src/lib/site.ts`.
- Updated structured data to expose legal name, phone, email, and registered address.

### Dealer FE
- Added `dealer/lib/business_profile.dart` and wired it into app title, brand fallback text, support contact, and router shell.
- Renamed platform/app metadata from legacy `Dealer Hub` wording to `4T HITEK Dealer`.
- Replaced support placeholder contact values with official phone/email.

### Admin FE
- Added `admin-fe/src/config/businessProfile.ts` for brand/contact defaults.
- Updated login, verify-email, change-password, layout shell, and default email sender values.
- Replaced placeholder favicon reference by copying the existing repo logo asset into `admin-fe/public/logo.png`.

### Backend
- Added `BusinessIdentity` central constants for backend-visible company data.
- Updated OpenAPI contact info and default mail sender config.
- Replaced old brand strings in email subjects/bodies, notification helper text, and public site content JSON.
- Updated tests that asserted old visible brand strings.

### Shared config
- Normalized default sender settings in `.env`, `.env.example`, `.env.production`, `backend/.env.example`, and `docker-compose.yaml`.

## Missing Real Data / Left As-Is
- Official Facebook URL and Zalo OA URL were not provided. Existing social URLs were kept where a URL was already required by the current codebase. The visible label `SCS Vietnam` was updated where it was safe.
- Existing logo/banner binaries were reused. No new logo/banner asset was invented.
- Policy/about copy was only normalized for business identity and stale placeholder names. No new long-form legal or marketing text was fabricated.
- No standalone mobile app beyond Dealer FE was found, so no extra mobile package metadata was changed.

## Manual Risk Checks
- Verify public contact/about/policy pages on Main FE still render content from backend as expected, especially after `site-content.json` updates.
- Verify social links with business stakeholders because only the display label was authoritative in the provided input.
- Verify admin login, verify-email, password-reset, and dealer onboarding emails in a staging mail environment to confirm display sender values are correct.
- Verify platform app names on Android/iOS/Windows installs if packaged binaries are produced from this repo.
- Verify any persisted `admin_settings` rows in existing databases if they already override mail sender values; the code now defaults correctly, but old persisted values may still exist.

## Verification Run
- `main-fe`: `npm run build` passed
- `admin-fe`: `npm run build` passed
- `dealer`: `flutter analyze` passed
- `dealer`: `flutter build web` passed
- `backend`: `./mvnw.cmd -q -DskipTests compile` passed
