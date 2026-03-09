# 4thitek Dealer Hub

Flutter dealer application cho he thong 4thitek.

## Che do du lieu

- App yeu cau `API_BASE_URL` de dang nhap va thao tac voi backend that.
- Socket mac dinh di qua `WS_BASE_URL` neu duoc cung cap, neu khong se fallback ve `API_BASE_URL + /ws`.
- Link quay lai main site/public reseller page lay tu `PUBLIC_SITE_BASE_URL`.
- San pham, gio hang, don hang, warranty, thong bao va profile dealer deu lay tu backend.
- `SharedPreferences` chi duoc dung de cache mot so state cuc bo va token, khong cung cap mock data.

## Chay local

```bash
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8080 --dart-define=PUBLIC_SITE_BASE_URL=http://localhost:3000
```

Neu chay Android emulator, dung:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080 --dart-define=PUBLIC_SITE_BASE_URL=http://10.0.2.2:3000
```

Neu can test socket qua domain rieng tren production build:

```bash
flutter build web --release --dart-define=API_BASE_URL=https://api.4thitek.vn --dart-define=WS_BASE_URL=https://ws.4thitek.vn --dart-define=PUBLIC_SITE_BASE_URL=https://4thitek.vn
```

## Android release signing

Play Console se tu choi APK/AAB neu ban ky bang debug key. Repo da duoc cau hinh de build `release` chi khi co keystore that.

1. Tao release keystore:

```bash
keytool -genkeypair -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. Copy [dealer/android/key.properties.example](android/key.properties.example) thanh `dealer/android/key.properties` va dien gia tri that:

```properties
storeFile=../../upload-keystore.jks
storePassword=your_store_password
keyAlias=upload
keyPassword=your_key_password
```

3. Build Android release:

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.4thitek.vn --dart-define=WS_BASE_URL=https://ws.4thitek.vn --dart-define=PUBLIC_SITE_BASE_URL=https://4thitek.vn
```

Hoac:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.4thitek.vn --dart-define=WS_BASE_URL=https://ws.4thitek.vn --dart-define=PUBLIC_SITE_BASE_URL=https://4thitek.vn
```

Neu chua cau hinh `key.properties`, Gradle se fail som thay vi am tham dung debug key.

## Tai khoan demo

- `daily.hn@4thitek.vn` / `123456`
- `duc123@gmail.com` / `123456`

## Kiem tra nhanh

```bash
flutter analyze
flutter test
```
