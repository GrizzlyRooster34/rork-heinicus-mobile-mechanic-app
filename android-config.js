// Android-specific configuration for React Native
export const androidConfig = {
  // Performance optimizations for Android 11+
  performance: {
    // Enable Hermes for better performance
    hermes: true,
    // Enable new architecture
    newArchEnabled: true,
    // Optimize bundle size
    enableProguardInReleaseBuilds: true,
    // Enable multidex for large apps
    multiDexEnabled: true,
  },
  
  // Android 11+ specific features
  android11Plus: {
    // Target SDK 30+ (Android 11)
    targetSdkVersion: 35,
    compileSdkVersion: 35,
    // Scoped storage support
    requestLegacyExternalStorage: false,
    // Package visibility
    queriesPackages: [
      'com.google.android.apps.maps',
      'com.android.vending'
    ],
  },
  
  // Security configurations
  security: {
    // Network security
    cleartextTrafficPermitted: false,
    // Backup settings
    allowBackup: false,
    // Certificate pinning
    networkSecurityConfig: true,
  },
  
  // Permissions for mobile mechanic app
  permissions: {
    required: [
      'CAMERA',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'VIBRATE',
      'WAKE_LOCK',
      'FOREGROUND_SERVICE',
      'POST_NOTIFICATIONS'
    ],
    optional: [
      'ACCESS_BACKGROUND_LOCATION',
      'WRITE_EXTERNAL_STORAGE',
      'READ_EXTERNAL_STORAGE'
    ],
    blocked: [
      'SYSTEM_ALERT_WINDOW'
    ]
  }
};

export default androidConfig;