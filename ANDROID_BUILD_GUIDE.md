# Android Build Guide - Heinicus Mobile Mechanic

This guide covers building the Heinicus Mobile Mechanic app for Android 11+ devices.

## Prerequisites

- Node.js 18+ with Bun
- Android Studio with SDK 35
- Java 17 (required for Android builds)
- EAS CLI installed globally

## Android Configuration

### Target Specifications
- **Minimum SDK**: 30 (Android 11)
- **Target SDK**: 35 (Android 14)
- **Compile SDK**: 35
- **Build Tools**: 35.0.0

### Key Features for Android 11+
- Scoped storage support
- Enhanced location permissions
- Background app restrictions compliance
- Network security configurations
- Modern camera API support

## Build Commands

### Development Build (APK)
```bash
bun run build:android:dev
```

### Preview Build (APK)
```bash
bun run build:android:preview
```

### Production Build (AAB for Play Store)
```bash
bun run build:android:production
```

### Standalone APK (for direct installation)
```bash
bun run build:android:apk
```

## Local Development

### Start Android Emulator
```bash
bun run android
```

### Install APK on Device
```bash
bun run install:android
```

## Permissions

### Required Permissions
- `CAMERA` - Vehicle photo documentation
- `ACCESS_FINE_LOCATION` - Mechanic location services
- `ACCESS_COARSE_LOCATION` - General location services
- `INTERNET` - API communication
- `ACCESS_NETWORK_STATE` - Network status
- `VIBRATE` - Haptic feedback
- `WAKE_LOCK` - Keep screen on during service
- `FOREGROUND_SERVICE` - Background location tracking
- `POST_NOTIFICATIONS` - Job notifications

### Optional Permissions
- `ACCESS_BACKGROUND_LOCATION` - Background location (requested at runtime)
- `WRITE_EXTERNAL_STORAGE` - File storage (scoped storage used instead)
- `READ_EXTERNAL_STORAGE` - File access (scoped storage used instead)

## Android 11+ Compliance

### Scoped Storage
- Uses scoped storage instead of legacy external storage
- Files are stored in app-specific directories
- No `WRITE_EXTERNAL_STORAGE` permission required for app files

### Background Location
- Background location access requires user approval
- Implemented with proper user consent flow
- Complies with Android 11+ background location restrictions

### Network Security
- All network traffic uses HTTPS
- Certificate pinning implemented
- Cleartext traffic disabled

## Build Optimization

### Performance Features
- Hermes JavaScript engine enabled
- New Architecture (Fabric/TurboModules) enabled
- ProGuard enabled for release builds
- Multidex support for large app bundles

### Bundle Size Optimization
- Asset optimization enabled
- Unused code elimination
- Compressed resources

## Testing

### Device Testing
Test on devices running:
- Android 11 (API 30) - Minimum supported
- Android 12 (API 31)
- Android 13 (API 33)
- Android 14 (API 34) - Target version

### Key Test Areas
- Location permissions and background access
- Camera functionality and photo uploads
- Push notifications
- Offline functionality
- Performance on lower-end devices

## Troubleshooting

### Common Issues

#### Build Failures
- Ensure Java 17 is installed and configured
- Clear Metro cache: `bunx expo start --clear`
- Clean prebuild: `bun run prebuild:android`

#### Permission Issues
- Check AndroidManifest.xml for proper permission declarations
- Test permission flows on Android 11+ devices
- Verify background location permission handling

#### Performance Issues
- Enable Hermes in app.config.js
- Check for memory leaks in development
- Profile app performance on target devices

## Deployment

### Google Play Store
1. Build production AAB: `bun run build:android:production`
2. Upload to Google Play Console
3. Complete store listing and compliance checks
4. Submit for review

### Direct Distribution
1. Build standalone APK: `bun run build:android:apk`
2. Enable "Install from Unknown Sources" on target devices
3. Install APK directly: `bun run install:android`

## Security Considerations

- All API endpoints use HTTPS
- Sensitive data encrypted with Android Keystore
- Network security config prevents cleartext traffic
- App signing with proper certificates
- Regular security updates and dependency management