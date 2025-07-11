// Android Build Configuration for Heinicus Mobile Mechanic
// Optimized for Android 11+ devices

module.exports = {
  // Build configuration
  build: {
    // Target Android 11+ (API 30+)
    minSdkVersion: 30,
    targetSdkVersion: 35,
    compileSdkVersion: 35,
    buildToolsVersion: '35.0.0',
    
    // Performance optimizations
    performance: {
      // Enable Hermes for better performance
      hermes: true,
      // Enable new architecture
      newArchEnabled: true,
      // Enable ProGuard for release builds
      enableProguardInReleaseBuilds: true,
      // Enable multidex for large apps
      multiDexEnabled: true,
      // Optimize bundle size
      enableSeparateBuildPerCPUArchitecture: true,
      // Universal APK (includes all architectures)
      universalApk: false,
    },
    
    // Android 11+ specific configurations
    android11Plus: {
      // Scoped storage (no legacy external storage)
      requestLegacyExternalStorage: false,
      // Network security
      usesCleartextTraffic: false,
      // Package visibility for Android 11+
      queriesPackages: [
        'com.google.android.apps.maps',
        'com.android.vending',
        'com.google.android.gms'
      ],
      // Backup configuration
      allowBackup: false,
      // Resizable activity support
      resizeableActivity: true,
      // Picture-in-picture (disabled for mechanic app)
      supportsPictureInPicture: false,
    }
  },
  
  // Permissions configuration
  permissions: {
    // Core permissions required for app functionality
    required: [
      'CAMERA',                    // Vehicle photo documentation
      'ACCESS_FINE_LOCATION',      // Precise location for mechanics
      'ACCESS_COARSE_LOCATION',    // General location services
      'INTERNET',                  // API communication
      'ACCESS_NETWORK_STATE',      // Network status monitoring
      'VIBRATE',                   // Haptic feedback
      'WAKE_LOCK',                 // Keep screen on during service
      'FOREGROUND_SERVICE',        // Background location tracking
      'POST_NOTIFICATIONS',        // Job and service notifications
      'RECORD_AUDIO',              // Voice notes (optional feature)
      'MODIFY_AUDIO_SETTINGS',     // Audio management
      'READ_PHONE_STATE',          // Device identification
    ],
    
    // Runtime permissions (requested when needed)
    runtime: [
      'ACCESS_BACKGROUND_LOCATION', // Background location (requires special handling)
      'WRITE_EXTERNAL_STORAGE',     // File storage (for older Android versions)
      'READ_EXTERNAL_STORAGE',      // File access (for older Android versions)
    ],
    
    // Blocked permissions (security)
    blocked: [
      'SYSTEM_ALERT_WINDOW',       // Overlay permissions (security risk)
    ]
  },
  
  // Security configuration
  security: {
    // Network security
    networkSecurity: {
      cleartextTrafficPermitted: false,
      certificatePinning: true,
      trustUserCerts: false,
    },
    
    // App security
    appSecurity: {
      allowBackup: false,
      debuggable: false, // Only for release builds
      extractNativeLibs: true,
      largeHeap: true, // For image processing
    },
    
    // Data protection
    dataProtection: {
      encryptedStorage: true,
      biometricAuth: true,
      screenRecordingBlocked: false, // Allow for support purposes
    }
  },
  
  // Feature configuration
  features: {
    // Hardware features
    hardware: {
      camera: {
        required: true,
        autofocus: true,
        flash: false, // Optional
      },
      location: {
        required: true,
        gps: true,
        network: true,
      },
      telephony: {
        required: false, // App works without phone features
      }
    },
    
    // Software features
    software: {
      maps: true,
      notifications: true,
      backgroundServices: true,
      fileAccess: true,
    }
  },
  
  // Build variants
  buildTypes: {
    debug: {
      debuggable: true,
      minifyEnabled: false,
      proguardFiles: [],
      signingConfig: 'debug',
    },
    
    release: {
      debuggable: false,
      minifyEnabled: true,
      proguardFiles: [
        'proguard-android-optimize.txt',
        'proguard-rules.pro'
      ],
      signingConfig: 'release',
    }
  },
  
  // Gradle configuration
  gradle: {
    // Android Gradle Plugin version
    androidGradlePluginVersion: '8.1.0',
    // Gradle wrapper version
    gradleWrapperVersion: '8.0',
    // Compile options
    compileOptions: {
      sourceCompatibility: 'JavaVersion.VERSION_17',
      targetCompatibility: 'JavaVersion.VERSION_17',
    },
    // Kotlin options
    kotlinOptions: {
      jvmTarget: '17',
    }
  },
  
  // Asset optimization
  assets: {
    // Image optimization
    images: {
      webpEnabled: true,
      pngCrunchEnabled: true,
      jpegQuality: 85,
    },
    
    // Resource optimization
    resources: {
      shrinkResources: true,
      removeUnusedResources: true,
      keepOnlyDefaultAndDensityResources: true,
    }
  },
  
  // Testing configuration
  testing: {
    // Unit testing
    unitTests: {
      includeAndroidResources: true,
      returnDefaultValues: true,
    },
    
    // Instrumentation testing
    instrumentationTests: {
      testInstrumentationRunner: 'androidx.test.runner.AndroidJUnitRunner',
      testApplicationId: 'com.heinicus.mobilemechanic.test',
    }
  }
};