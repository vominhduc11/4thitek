# 4thitek Admin Dashboard

Giao dien quan tri he thong 4thitek, xay dung tren **Vite + React + TypeScript**. Ket noi API backend thong qua co che runtime config linh hoat — URL backend co the doi sau khi build ma khong can rebuild image.

## Co che `runtime-config.js`

### Van de voi bien build-time

Vite bake bien moi truong (`VITE_*`) vao bundle khi build. Dieu nay co nghia la:

- Neu API URL thay doi (doi domain, chuyen sang staging…), ban phai build lai toan bo app.
- Image Docker phu thuoc vao gia tri URL co dinh tai luc build.

### Giai phap: runtime config

File `public/runtime-config.js` duoc nhung vao trang HTML truoc khi app khoi dong:

```js
// File nay duoc ghi de boi entrypoint script khi container khoi dong.
// Gia tri thuc te den tu bien moi truong cua container.
window.__APP_CONFIG__ = {
  apiOrigin: '',
  apiVersion: '',
  apiBaseUrl: '',
}
```

App doc gia tri nay qua `window.__APP_CONFIG__` tai runtime, khong phu thuoc vao bien build-time.

### Quy trinh khi chay container

Khi container nginx khoi dong, script `/docker-entrypoint.d/40-runtime-config.sh` chay truoc va **ghi de** noi dung `runtime-config.js` bang gia tri thuc tu bien moi truong:

```
container start
  → 40-runtime-config.sh chay
  → doc API_ORIGIN / API_VERSION / API_BASE_URL tu env
  → ghi de /usr/share/nginx/html/runtime-config.js
  → nginx phuc vu app voi config moi
```

Do do app phan anh dung URL backend ma khong can build lai.

### Thu tu uu tien bien moi truong

Script entrypoint lay gia tri theo thu tu uu tien sau:

| Bien (uu tien cao) | Bien fallback | Mu dich |
|---|---|---|
| `API_ORIGIN` | `VITE_API_ORIGIN` | Origin cua backend API |
| `API_VERSION` | `VITE_API_VERSION` | Phien ban API (vi du `v1`) |
| `API_BASE_URL` | `VITE_API_BASE_URL` | URL day du (vi du `https://api.4thitek.vn/api/v1`) |

Neu `API_BASE_URL` (va fallback) de trong nhung `API_ORIGIN` co gia tri, script tu dong xay dung:

```
apiBaseUrl = API_ORIGIN + "/api/" + API_VERSION   (mac dinh version = v1)
```

## Chay local

### 1. Tao file bien moi truong local

```bash
cp .env.example .env.local
```

Noi dung mac dinh trong `.env.example`:

```env
VITE_API_ORIGIN=http://localhost:8080
VITE_API_VERSION=v1
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Dieu chinh neu backend cua ban chay o port hoac host khac.

### 2. Cai dat dependency va chay dev server

```bash
npm install
npm run dev
```

Dev server mac dinh o `http://localhost:5173`.

Khi chay local voi Vite dev server, bien `VITE_*` duoc load truc tiep tu `.env.local` ma khong can qua entrypoint script hay `runtime-config.js`.

## Build production

```bash
npm run build
```

Output nam trong `dist/`. Co the truyen URL build-time qua tham so `--build-arg` khi build Docker image:

```bash
docker build \
  --build-arg VITE_API_ORIGIN=https://api.4thitek.vn \
  --build-arg VITE_API_VERSION=v1 \
  --build-arg VITE_API_BASE_URL=https://api.4thitek.vn/api/v1 \
  -t 4thitek-admin-fe .
```

Gia tri build-time chi la fallback mac dinh — co the override hoan toan bang bien moi truong container ma khong can build lai (xem phan du oi).

## Chay container va override runtime config

### Thong qua docker compose (khuyen nghi)

Bien `API_ORIGIN`, `API_VERSION`, `API_BASE_URL` trong `.env` duoc docker compose inject vao container. Xem [docker-compose.yaml](../docker-compose.yaml) va [.env.example](../.env.example) tai root repo.

```yaml
admin-fe:
  environment:
    API_ORIGIN: ${API_ORIGIN}
    API_VERSION: ${API_VERSION}
    API_BASE_URL: ${API_BASE_URL}
```

### Thong qua lenh `docker run` truc tiep

```bash
docker run -d -p 4173:80 \
  -e API_ORIGIN=https://api.4thitek.vn \
  -e API_VERSION=v1 \
  -e API_BASE_URL=https://api.4thitek.vn/api/v1 \
  4thitek-admin-fe
```

### Thong qua mount volume (neu can thay the thu cong)

Neu can ghi de `runtime-config.js` ma khong qua bien moi truong:

```bash
# Tao file config
cat > ./my-runtime-config.js <<'EOF'
window.__APP_CONFIG__ = {
  apiOrigin: 'https://api.4thitek.vn',
  apiVersion: 'v1',
  apiBaseUrl: 'https://api.4thitek.vn/api/v1',
}
EOF

docker run -d -p 4173:80 \
  -v ./my-runtime-config.js:/usr/share/nginx/html/runtime-config.js:ro \
  4thitek-admin-fe
```

Luu y: Mount volume se ghi de entrypoint script — gia tri den tu file mount, bien moi truong bi bo qua.

## Kiem tra nhanh

```bash
# Kiem tra type va lint
npm run lint

# Chay unit tests
npm run test

# Kiem tra build khong loi
npm run build
```

## Luu y quan trong

- **Khong hardcode API URL trong source code.** Toan bo URL phai den tu `window.__APP_CONFIG__` (runtime) hoac bien `VITE_*` (local dev).
- **Khong commit `.env.local`** — file nay luu mat khau va token cuc bo.
- File `public/runtime-config.js` trong repo chi la placeholder voi gia tri rong. Gia tri thuc duoc inject tai runtime boi entrypoint script.
- Khi phat hien admin dashboard tra ve URL sai (vi du van tro ve `localhost`), kiem tra bien moi truong `API_ORIGIN` / `API_BASE_URL` cua container truoc khi debug code.
