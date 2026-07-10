# PROMPT: Redesign toàn bộ 4T HITEK Main Frontend

> **Cách dùng**: Copy toàn bộ file này (hoặc từng section theo lượt) và đưa cho Claude Design. Prompt được viết tự chứa — Claude không cần xem lịch sử hội thoại trước đó.

---

## 0. Vai trò & nhiệm vụ của bạn (Claude Design)

Bạn là **Senior Product Designer + Frontend Engineer** chuyên về thương mại điện tử cao cấp và hệ thống đại lý B2B. Bạn được giao **redesign toàn bộ** website chính (`main-fe`) của **4T HITEK** — nhà phân phối độc quyền hệ thống intercom mũ bảo hiểm **SCS** tại Việt Nam.

Đây không phải là chỉnh sửa nhỏ. Đây là **làm lại toàn bộ**: design system, sitemap, UX flow, mockup từng trang, và code Next.js/Tailwind thực thi vào codebase hiện có.

Bạn phải làm việc trực tiếp trên thư mục: `/root/myproject/4thitek/main-fe/`

---

## 1. Bối cảnh dự án (đọc kỹ trước khi làm)

### 1.1 Doanh nghiệp
- **Thương hiệu**: 4T HITEK
- **Sản phẩm**: Hệ thống liên lạc nội bộ SCS (intercom mũ bảo hiểm Bluetooth, headset không dây cho người đi mô tô) — phân phối độc quyền tại Việt Nam.
- **Khách hàng chính (ƯU TIÊN B2B)**:
  1. **Đại lý / Reseller** — chiếm trọng tâm. Cần tìm hiểu chính sách, đăng ký mở đại lý, xem khu vực còn trống, tra giá sỉ, hỗ trợ kỹ thuật, đào tạo bán hàng.
  2. Rider cá nhân (B2C phụ) — duyệt sản phẩm, tìm đại lý gần nhất, kiểm tra bảo hành.
- **Mục tiêu kinh doanh**: Tăng số lượng đại lý đăng ký mới + củng cố niềm tin thương hiệu là nhà phân phối chính hãng duy nhất.

### 1.2 Tech stack hiện tại (PHẢI GIỮ)
- Next.js 15.5.15 (App Router, Turbopack)
- React 19, TypeScript 5
- Tailwind CSS v4 (PostCSS) — config tại `tailwind.config.js`
- Framer Motion 12 (animation)
- Lottie React, react-icons, @heroicons/react
- Fonts: Montserrat (serif/heading) + Source Sans 3 (sans/body)
- i18n thủ công qua `LanguageContext` (VI/EN, cookie-based)
- Không dùng shadcn/Radix/MUI — components tự build trong `src/components/ui/`

### 1.3 Cấu trúc routes hiện tại
```
src/app/
├── page.tsx                    → redirect đến /home
├── home/                       → trang chủ
├── about/                      → giới thiệu
├── products/                   → danh sách sản phẩm
│   └── [id]/                   → chi tiết sản phẩm
├── blogs/                      → tin tức/blog
│   └── [id]/                   → chi tiết bài
├── certification/              → chứng nhận
├── contact/                    → liên hệ
├── dealer-locator/             → bản đồ đại lý
├── become_our_reseller/        → đăng ký mở đại lý
├── reseller_information/       → thông tin đại lý / chính sách
├── warranty-check/             → tra cứu bảo hành
├── search/                     → kết quả tìm kiếm
├── reset-password/             → đặt lại mật khẩu
├── privacy-policy/, policy/    → trang pháp lý
└── layout.tsx, error.tsx, not-found.tsx, sitemap.ts, robots.ts
```

### 1.4 Design language hiện tại (điểm xuất phát)
- **Theme**: Dark only — nền `#06111B` (navy đen), accent cyan `#29ABE2`.
- **Typography**: Montserrat heading, Source Sans 3 body, scale `xs → 9xl`.
- **Style**: Glass-morphism nhẹ, card bo `1.6rem`, video hero loop, micro-interactions Framer Motion (spring, hover lift).
- **Custom utility classes** trong `globals.css`: `.brand-shell`, `.brand-panel`, `.brand-card`, `.brand-button-primary`, `.brand-badge` — bạn có thể giữ tên, đổi nội dung.
- **Breakpoints**: `xs 480 / sm 640 / md 700 / lg 844 / desktop 1024 / xl 1280 / 2xl 1536 / 3xl 1920 / 4xl 2560 / 5xl 3200`.

### 1.5 Assets có sẵn (xem `/public/`)
- Logo: `/logo-4t.png`, `/logo.png`
- Video hero loop (đã có, tận dụng): `hero-road-tech-loop.mp4`, `hero-product-tech-road-loop.mp4`, `hero-brand-network-service-loop.mp4`, `brand-values-dealer-network-loop.mp4`, `newsroom-editorial-cover-loop.mp4`, `hero-newsroom-editorial-loop.mp4`.
- ⚠️ File `futuristic-background-2022-08-04-19-57-56-utc.mp4` (56MB) — đề xuất loại bỏ hoặc nén lại.

---

## 2. Định hướng thiết kế mới

### 2.1 Mood & cảm hứng
**Dark Premium / Luxury Tech** — nâng cấp từ dark hiện tại lên đẳng cấp brand cao cấp. Tham chiếu trực tiếp:
- **Cardo Systems** (cardosystems.com) — đối thủ trực tiếp ngành intercom: cách họ trình bày product hero, spec sheet, dealer locator.
- **Sena** (sena.com) — competitor: cấu trúc product family, comparison table.
- **Bang & Olufsen** (bang-olufsen.com) — cảm giác premium audio, typography lớn, ảnh đặt trang trọng.
- **Leica Camera** (leica-camera.com) — minimalism + warmth, không lạnh lùng.
- **Porsche Design** (porsche-design.com) — dark luxury với accent kim loại.

### 2.2 Nguyên tắc design
1. **Trust-first cho B2B**: mọi trang phải có tín hiệu uy tín (logo SCS, certification badge, số đại lý hiện có, năm thành lập, hotline).
2. **Density hợp lý**: B2B reseller cần xem được nhiều thông tin (giá, tồn, chính sách) — không "minimal đến trống rỗng" như B2C luxury thuần.
3. **Cinematic nhưng nhanh**: giữ video hero, nhưng *lazy-load*, có poster fallback, tổng JS ban đầu < 250KB gzipped.
4. **Accessibility AA**: contrast ratio ≥ 4.5:1 cho body text trên nền dark, focus ring rõ, reduced-motion support đầy đủ.
5. **Mobile-first nghiêm túc**: > 60% traffic là mobile. Layout phải sang khi xem trên iPhone, không chỉ trên desktop 27".
6. **Bilingual VI/EN**: chừa chỗ cho text tiếng Việt dài hơn tiếng Anh ~20%. Không break layout khi switch ngôn ngữ.

### 2.3 Visual upgrade so với hiện tại
| Aspect | Hiện tại | Mục tiêu |
|---|---|---|
| Color depth | 2 tone (navy + cyan) | Thêm 1 accent kim loại (vd: champagne `#D4B675` hoặc platinum `#C8CDD3`) cho CTA cao cấp |
| Typography | Montserrat khá phổ thông | Cân nhắc thay heading bằng font display sang hơn (vd: PP Neue Montreal, Söhne, Inter Display, hoặc giữ Montserrat nhưng dùng weight 200/800 contrast mạnh) |
| Surface | Glass-morphism nhẹ | Thêm layer texture: noise grain (1-2% opacity), subtle radial gradient, hairline border `rgba(255,255,255,0.06)` |
| Motion | Spring hover | Thêm scroll-driven reveal (Framer `useScroll`), parallax product image, kinetic typography cho hero |
| Imagery | Video loop chung | Bổ sung "studio shot" sản phẩm trên nền tối, lifestyle rider Việt Nam (không stock photo Tây) |

---

## 3. Yêu cầu sản phẩm bàn giao (Deliverables)

Bạn phải bàn giao **4 nhóm** sau, theo đúng thứ tự:

### Deliverable 1: Information Architecture & Sitemap mới
File: `docs/redesign/01-sitemap.md`

- Vẽ sitemap mới dạng cây (markdown). Phân biệt rõ:
  - **B2B hub** (ưu tiên cao): trang đại lý, đăng ký reseller, chính sách giá, tài liệu hỗ trợ, đào tạo.
  - **B2C hub**: sản phẩm, blog, warranty, dealer locator.
  - **Brand/Trust**: about, certification, news.
- Đề xuất navigation chính mới (top nav + mega menu nếu cần). Giải thích lý do gom/tách.
- Đề xuất CTA chính trên header (ví dụ: nút "Trở thành đại lý" nổi bật).
- Liệt kê route mới cần thêm và route cũ cần gộp/xóa. Nếu xóa, ghi rõ redirect đi đâu.

### Deliverable 2: Design System mới
Thư mục: `docs/redesign/02-design-system/`

- `tokens.md`: bảng color/typography/spacing/radius/shadow/motion tokens. Format: tên token + giá trị + use case. Ví dụ:
  ```
  color.surface.base      #06111B   nền trang
  color.surface.elevated  #0E1B27   card nổi 1 cấp
  color.accent.primary    #29ABE2   CTA chính
  color.accent.premium    #D4B675   CTA B2B / VIP
  ```
- `typography.md`: font family, scale, line-height, letter-spacing, sample render cho display/heading/body/caption/code.
- `components.md`: spec từng component cốt lõi với variants + states (default/hover/active/focus/disabled/loading):
  - Button (primary, secondary, ghost, premium, destructive)
  - Input, Select, Checkbox, Radio, Switch
  - Card (product card, dealer card, blog card, stat card)
  - Badge / Tag / Chip
  - Modal, Drawer, Toast
  - Tabs, Accordion, Stepper (cho form đăng ký reseller nhiều bước)
  - Navigation (header, mega menu, mobile drawer, breadcrumb, pagination, footer)
  - Data display: table (cho bảng giá sỉ, so sánh sản phẩm), comparison card
  - Form patterns: multi-step form, file upload, OTP input
  - Empty states, Loading states, Error states
- `motion.md`: nguyên tắc easing, duration scale, scroll-driven patterns, reduced-motion fallback.

### Deliverable 3: Mockup high-fidelity từng trang
Thư mục: `docs/redesign/03-mockups/`

Với **MỖI** route dưới đây, tạo file `<route>.md` chứa:
- Mô tả mục tiêu trang (1-2 câu).
- ASCII wireframe **desktop** (1440px) và **mobile** (390px).
- Liệt kê section theo thứ tự từ trên xuống, mỗi section ghi: nội dung, component dùng, animation/interaction, dữ liệu cần.
- Edge cases: loading, empty, error.
- Note SEO: title, meta, structured data cần thiết.

Danh sách trang **bắt buộc**:
1. `home.md` — trang chủ (2 entry point: B2B + B2C)
2. `products-list.md` — danh sách sản phẩm với filter
3. `product-detail.md` — chi tiết sản phẩm (tab spec / video / so sánh / dealer gần nhất)
4. `become-reseller.md` — **TRANG QUAN TRỌNG NHẤT** — form đăng ký nhiều bước, có hero kể câu chuyện cơ hội + bảng so sánh quyền lợi các tier đại lý.
5. `reseller-information.md` — hub thông tin cho đại lý (chính sách, tài liệu, đào tạo, FAQ, hotline B2B riêng).
6. `dealer-locator.md` — bản đồ + danh sách + filter theo tỉnh/quận.
7. `warranty-check.md` — tra cứu serial, hiển thị trạng thái bảo hành.
8. `blogs-list.md` + `blog-detail.md`
9. `about.md`, `certification.md`, `contact.md`
10. `search.md`, `404.md`, `error.md`
11. `header-footer.md` — chi tiết header (có mega menu cho B2B) và footer (3 cột: brand / B2B quick links / B2C quick links).

### Deliverable 4: Code Next.js/Tailwind thực thi
- Cập nhật `tailwind.config.js` với token mới.
- Viết lại `src/app/globals.css` và `src/styles/*` cho design system mới.
- Viết lại / tạo mới `src/components/ui/*` và `src/components/layout/*` theo design system.
- Refactor từng `src/app/<route>/page.tsx` (và `components/` con) theo mockup tương ứng.
- **Không phá** logic data fetching, i18n, analytics, SEO (JsonLd) hiện có — chỉ thay UI/UX.
- Giữ tương thích TypeScript strict (`tsconfig.json` hiện có).
- Đảm bảo `npm run build` PASS, `npm run lint` PASS, `npm test` PASS.
- Mỗi PR/commit nhóm theo deliverable, message rõ ràng (ví dụ: `feat(design-system): new color tokens & typography scale`).

---

## 4. Ràng buộc kỹ thuật bắt buộc

1. **Không thêm dependency nặng** mà không hỏi: KHÔNG cài shadcn, MUI, Chakra, styled-components, emotion, redux, zustand mới. Tailwind + Framer Motion + react-icons là đủ. Nếu thật sự cần lib mới (vd: `cmdk` cho command palette, `react-hook-form` cho form B2B), liệt kê trong `docs/redesign/00-dependencies.md` kèm lý do và đợi xác nhận trước khi cài.
2. **Giữ App Router** — không chuyển sang Pages Router.
3. **Giữ i18n hiện tại** (LanguageContext + cookie) — không thay bằng next-intl/i18next.
4. **Images**: dùng `next/image` cho mọi ảnh tĩnh. Video dùng `<video>` HTML5 với `preload="metadata"`, `poster`, `playsInline`, `muted`, `loop`.
5. **Performance budget**:
   - LCP < 2.5s trên 4G
   - Total JS < 250KB gzipped (initial)
   - CLS < 0.1
   - Lighthouse Performance ≥ 85 mobile
6. **Accessibility**:
   - Keyboard nav đầy đủ (Tab order, focus visible, Escape đóng modal)
   - `prefers-reduced-motion` tắt mọi animation > 200ms
   - Alt text mọi ảnh, aria-label mọi icon button
   - Form: label rõ ràng, error message liên kết bằng `aria-describedby`
7. **SEO**: giữ và mở rộng `sitemap.ts`, `robots.ts`, JsonLd component. Mỗi trang phải có metadata Next.js (title/description/openGraph).
8. **Không xóa** test hiện có. Nếu refactor component có test, cập nhật test tương ứng.

---

## 5. Quy trình làm việc đề xuất

1. **Khảo sát thêm** (30 phút): đọc `src/app/home/HomePageContent.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/app/globals.css`, `src/styles/`, `src/context/LanguageContext.tsx`, `src/constants/languageData.ts` để hiểu pattern hiện có.
2. **Bàn giao Deliverable 1** (sitemap) — checkpoint với owner.
3. **Bàn giao Deliverable 2** (design system) — checkpoint.
4. **Bàn giao Deliverable 3** (mockups) — checkpoint.
5. **Bàn giao Deliverable 4** (code) — chia thành nhiều commit nhỏ theo nhóm: `(a) tokens + globals.css`, `(b) UI primitives`, `(c) layout (header/footer)`, `(d) home`, `(e) products`, `(f) reseller hub`, `(g) các trang còn lại`.
6. Sau mỗi commit code: chạy `npm run build && npm run lint` để chắc chắn không vỡ.

---

## 6. Định nghĩa "Done"

Redesign được coi là hoàn tất khi:
- [ ] 4 deliverables ở mục 3 đều bàn giao đầy đủ vào đúng đường dẫn.
- [ ] `npm run build` PASS không warning nghiêm trọng.
- [ ] `npm run lint` PASS.
- [ ] `npm test` PASS (test cũ vẫn xanh).
- [ ] Mở `npm run dev` xem được tất cả route, không lỗi console.
- [ ] Lighthouse mobile ≥ 85 Performance, ≥ 95 Accessibility, ≥ 95 SEO cho trang home và become_our_reseller.
- [ ] Switch ngôn ngữ VI ↔ EN không vỡ layout ở mọi trang.
- [ ] Trang `/become_our_reseller` là điểm nhấn cao nhất về visual & UX của toàn site (vì đây là mục tiêu kinh doanh số 1).

---

## 7. Khi gặp quyết định mơ hồ

Mặc định: ưu tiên **B2B reseller experience** > B2C shopping > brand storytelling.

Nếu phải chọn giữa "đẹp hơn nhưng phức tạp" vs "đơn giản nhưng hiệu quả cho đại lý xem trên Chrome cũ" — chọn vế sau.

Nếu không chắc về copywriting, dùng placeholder rõ ràng dạng `[TODO copy: mô tả slot này dài ~40 từ về cam kết chính hãng]` để owner điền sau.

Nếu cần asset (ảnh, video, icon) chưa có, tạo placeholder SVG có ghi rõ kích thước và mô tả, và liệt kê tất cả trong `docs/redesign/04-assets-needed.md`.

---

**Bắt đầu bằng cách đọc các file đã liệt kê ở mục 5.1, sau đó bàn giao Deliverable 1 (sitemap mới). Đừng viết code trước khi sitemap được xác nhận.**
