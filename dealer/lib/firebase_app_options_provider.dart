import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DealerFirebaseOptionsProvider {
  const DealerFirebaseOptionsProvider._();

  static Future<bool> ensureInitialized() async {
    if (kIsWeb) {
      return false;
    }
    if (Firebase.apps.isNotEmpty) {
      return true;
    }

    final options = currentPlatform;
    try {
      await Firebase.initializeApp();
      return true;
    } catch (_) {
      if (options == null) {
        return false;
      }
    }

    try {
      await Firebase.initializeApp(options: options);
      return true;
    } catch (_) {
      return false;
    }
  }

  static FirebaseOptions? get currentPlatform {
    if (kIsWeb) {
      return null;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return _buildAndroidOptions();
      case TargetPlatform.iOS:
        return _buildIosOptions();
      default:
        return null;
    }
  }

  static FirebaseOptions? _buildAndroidOptions() {
    const apiKey = String.fromEnvironment('FIREBASE_ANDROID_API_KEY');
    const appId = String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
    const senderId = String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
    const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
    const storageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET');
    if (!_hasRequiredBaseConfig(
      apiKey: apiKey,
      appId: appId,
      senderId: senderId,
      projectId: projectId,
    )) {
      return null;
    }
    return FirebaseOptions(
      apiKey: apiKey,
      appId: appId,
      messagingSenderId: senderId,
      projectId: projectId,
      storageBucket: storageBucket.isEmpty ? null : storageBucket,
    );
  }

  static FirebaseOptions? _buildIosOptions() {
    const apiKey = String.fromEnvironment('FIREBASE_IOS_API_KEY');
    const appId = String.fromEnvironment('FIREBASE_IOS_APP_ID');
    const senderId = String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
    const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
    const storageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET');
    const bundleId = String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID');
    if (!_hasRequiredBaseConfig(
      apiKey: apiKey,
      appId: appId,
      senderId: senderId,
      projectId: projectId,
    )) {
      return null;
    }
    return FirebaseOptions(
      apiKey: apiKey,
      appId: appId,
      messagingSenderId: senderId,
      projectId: projectId,
      storageBucket: storageBucket.isEmpty ? null : storageBucket,
      iosBundleId: bundleId.isEmpty ? null : bundleId,
    );
  }

  static bool _hasRequiredBaseConfig({
    required String apiKey,
    required String appId,
    required String senderId,
    required String projectId,
  }) {
    return apiKey.isNotEmpty &&
        appId.isNotEmpty &&
        senderId.isNotEmpty &&
        projectId.isNotEmpty;
  }
}
