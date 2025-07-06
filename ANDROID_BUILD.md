# Android Build Configuration

This app is configured for Android 11+ (API level 30+) builds with optimal performance and security settings.

## Prerequisites

- Node.js 18+
- Bun package manager
- Android Studio (for local builds)
- EAS CLI (for cloud builds)

## Configuration

### Target Android Version
- **Minimum SDK**: 30 (Android 11)
- **Target SDK**: 35 (Android 14)
- **Compile SDK**: 35

### Key Features
- Hermes JavaScript engine enabled
- New Architecture (Fabric + TurboModules)
- Scoped storage compliance
- Network security configuration
- Optimized for mobile mechanic workflows

## Build Commands

### Development Build
```bash
bun run build:android:dev
```

### Preview Build (APK)
```bash
bun run build:android:preview
```

### Production Build (AAB)
```bash
bun run build:android:production
```

### Local Development
```bash
bun run android
```

## Permissions

The app requests the following permissions for mobile mechanic functionality:

### Required Permissions
- `CAMERA` - Take photos of vehicle issues and parts
- `ACCESS_FINE_LOCATION` - GPS location for service calls
- `ACCESS_COARSE_LOCATION` - Network-based location
- `INTERNET` - API communication
- `ACCESS_NETWORK_STATE` - Network status monitoring
- `VIBRATE` - Haptic feedback
- `WAKE_LOCK` - Keep screen on during service
- `FOREGROUND_SERVICE` - Background location tracking
- `POST_NOTIFICATIONS` - Job notifications

### Optional Permissions
- `ACCESS_BACKGROUND_LOCATION` - Background location for job updates
- `WRITE_EXTERNAL_STORAGE` - Photo storage (Android 10-)
- `READ_EXTERNAL_STORAGE` - Photo access (Android 10-)

## Security Features

- Network security configuration prevents cleartext traffic
- Backup disabled for sensitive data protection
- Certificate pinning for API security
- Scoped storage compliance for Android 11+

## Performance Optimizations

- Hermes JavaScript engine
- ProGuard/R8 code shrinking in release builds
- Multidex support for large app bundles
- New Architecture for improved performance
- Metro bundler optimizations

## Testing on Android 11+

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run `bun run android` to install and launch

## Troubleshooting

### Common Issues

1. **Build fails with SDK version error**
   - Ensure Android SDK 35 is installed
   - Update Android Studio to latest version

2. **Permission denied errors**
   - Check app permissions in device settings
   - Ensure location services are enabled

3. **Network security errors**
   - Verify API endpoints use HTTPS
   - Check network security configuration

4. **Performance issues**
   - Enable Hermes in production builds
   - Use release builds for performance testing

## Deployment

### Google Play Store
1. Build production AAB: `bun run build:android:production`
2. Submit to Play Console: `bun run submit:android`
3. Follow Play Store review process

### Internal Distribution
1. Build preview APK: `bun run build:android:preview`
2. Distribute via Firebase App Distribution or similar
3. Test with internal team before public release

## Environment Variables

Create a `.env` file with:
```
GOOGLE_MAPS_API_KEY=your_google_maps_key
EAS_PROJECT_ID=your_eas_project_id
GOOGLE_SERVICES_JSON=path_to_google_services_json
```