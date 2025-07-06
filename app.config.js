export default {
  expo: {
    name: "Heinicus Mobile Mechanic",
    slug: "heinicus-mobile-mechanic",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "heinicus",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a1a"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.heinicus.mobilemechanic",
      buildNumber: "1"
    },
    android: {
      compileSdkVersion: 35,
      targetSdkVersion: 35,
      minSdkVersion: 30, // Android 11 (API 30)
      buildToolsVersion: "35.0.0",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#1a1a1a"
      },
      package: "com.heinicus.mobilemechanic",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION", 
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "VIBRATE",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "FOREGROUND_SERVICE",
        "ACCESS_BACKGROUND_LOCATION",
        "POST_NOTIFICATIONS",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "READ_PHONE_STATE"
      ],
      blockedPermissions: [
        "SYSTEM_ALERT_WINDOW"
      ],
      allowBackup: false,
      networkSecurityConfig: {
        cleartextTrafficPermitted: false
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      // Android 11+ specific configurations
      requestLegacyExternalStorage: false,
      usesCleartextTraffic: false,
      // Scoped storage support for Android 11+
      usesNonSdkApi: false,
      // Target Android 11+ features
      resizeableActivity: true,
      supportsPictureInPicture: false
    },
    web: {
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://rork.com/"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Heinicus needs location access to connect you with nearby mechanics and provide accurate service locations.",
          locationAlwaysPermission: "Heinicus needs background location access to send you notifications about nearby mechanics and job updates.",
          locationWhenInUsePermission: "Heinicus needs location access to show your current location and find nearby mechanics.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Heinicus needs camera access to take photos of vehicle issues, parts, and completed work for service documentation."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Heinicus needs photo access to upload images of vehicle issues and service documentation."
        }
      ],
      [
        "expo-haptics"
      ],
      [
        "@react-native-async-storage/async-storage",
        {
          "exclude": ["LocalStorage"]
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "your-project-id"
      }
    }
  }
};