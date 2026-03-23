# 4thitek Dealer Hub

Flutter dealer application cho he thong 4thitek.

## Che do du lieu

- App mac dinh dung `https://api.4thitek.vn`; co the override bang `API_BASE_URL` khi chay local hoac build theo moi truong khac.
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

## Cau hinh Firebase FCM

Push notification nen chi hoat dong khi app duoc build voi Firebase config that. Android uu tien `google-services.json`; neu khong co file nay thi app co the fallback sang `--dart-define`. Khong commit service account secret vao repo.

Android theo cach chuan Firebase:

1. Copy file `google-services.json` vao:

```text
dealer/android/app/google-services.json
```

2. Chay app Android. Khi file nay ton tai, Gradle se tu ap dung Google Services plugin va app se khoi tao Firebase bang config trong file, khong can `FIREBASE_ANDROID_*` dart-define nua.

Android local/dev khong co `google-services.json`:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080 --dart-define=PUBLIC_SITE_BASE_URL=http://10.0.2.2:3000 --dart-define=FIREBASE_PROJECT_ID=your-project-id --dart-define=FIREBASE_MESSAGING_SENDER_ID=your-sender-id --dart-define=FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app --dart-define=FIREBASE_ANDROID_API_KEY=your-android-api-key --dart-define=FIREBASE_ANDROID_APP_ID=your-android-app-id
```

Neu build iOS, bo sung:

```bash
--dart-define=FIREBASE_IOS_API_KEY=your-ios-api-key --dart-define=FIREBASE_IOS_APP_ID=your-ios-app-id --dart-define=FIREBASE_IOS_BUNDLE_ID=vn.4thitek.dealer
```

Neu khong truyen cac `FIREBASE_*` value nay, app van chay binh thuong nhung se khong dang ky push token va khong nhan FCM notification.

Luu y iOS can them buoc Xcode/APNs tren may Mac: bat `Push Notifications`, bat `Background Modes > Remote notifications`, cau hinh APNs key/certificate cho Firebase, va cap provisioning profile co `aps-environment`. Repo nay moi wire phan code Flutter va `Info.plist`. Neu muon iOS dung setup chuan nhu Android, can them `GoogleService-Info.plist` trong Xcode.

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
