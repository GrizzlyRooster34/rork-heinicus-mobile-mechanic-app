# Android Permissions Guide - Heinicus Mobile Mechanic

This document outlines the permission strategy for Android 11+ compliance.

## Permission Categories

### 1. Install-Time Permissions (Granted at Install)
These permissions are automatically granted when the app is installed:

- `INTERNET` - Network communication with backend services
- `ACCESS_NETWORK_STATE` - Check network connectivity status
- `VIBRATE` - Haptic feedback for user interactions
- `WAKE_LOCK` - Keep screen on during active service sessions
- `FOREGROUND_SERVICE` - Background location tracking for mechanics
- `RECEIVE_BOOT_COMPLETED` - Restart services after device reboot

### 2. Runtime Permissions (Requested When Needed)
These permissions require user approval and are requested contextually:

#### Location Permissions
- `ACCESS_FINE_LOCATION` - Precise location for mechanic dispatch
- `ACCESS_COARSE_LOCATION` - General location services
- `ACCESS_BACKGROUND_LOCATION` - Background location (Android 11+ special handling)

**Implementation Notes:**
- Request fine/coarse location first
- Only request background location after user grants foreground location
- Show clear explanation of why background location is needed
- Provide option to use app without background location

#### Camera Permission
- `CAMERA` - Take photos of vehicle issues and completed work

**Implementation Notes:**
- Request when user first tries to take a photo
- Provide alternative to upload from gallery if denied
- Show clear explanation of camera usage

#### Storage Permissions (Android 10 and below)
- `WRITE_EXTERNAL_STORAGE` - Save photos and documents
- `READ_EXTERNAL_STORAGE` - Access saved files

**Implementation Notes:**
- Not needed on Android 11+ due to scoped storage
- Only requested on older Android versions
- Use scoped storage APIs for Android 11+

#### Audio Permissions (Optional Features)
- `RECORD_AUDIO` - Voice notes and audio documentation
- `MODIFY_AUDIO_SETTINGS` - Audio management during calls

**Implementation Notes:**
- Only requested if user enables voice features
- Clearly explain audio recording usage
- Provide text alternatives

#### Device Information
- `READ_PHONE_STATE` - Device identification for security
- `POST_NOTIFICATIONS` - Push notifications for jobs and updates

### 3. Blocked Permissions
These permissions are explicitly blocked for security:

- `SYSTEM_ALERT_WINDOW` - Overlay permissions (security risk)

## Android 11+ Specific Considerations

### Background Location Access
Android 11+ requires special handling for background location:

1. **Two-Step Process:**
   - First request foreground location permissions
   - Then request background location with clear justification

2. **User Education:**
   - Explain why background location is needed
   - Show benefits (job notifications, automatic check-in)
   - Provide option to decline and use manual location

3. **Graceful Degradation:**
   - App functions without background location
   - Manual location entry available
   - Reduced automation but full functionality

### Scoped Storage
Android 11+ uses scoped storage instead of external storage permissions:

1. **App-Specific Storage:**
   - Photos saved to app-specific directories
   - No permission required for app files
   - Automatic cleanup when app is uninstalled

2. **Shared Storage Access:**
   - Use MediaStore API for shared photos
   - Storage Access Framework for documents
   - No broad file system access

### Package Visibility
Android 11+ restricts package visibility:

1. **Declared Queries:**
   - Google Maps for navigation
   - Google Play Store for updates
   - Google Play Services for location

2. **Intent Filters:**
   - Camera intents for photo capture
   - Maps intents for navigation
   - Phone intents for calling customers

## Permission Request Flow

### 1. Location Permission Flow
```
App Launch
├── Check if location permission granted
├── If not granted:
│   ├── Show location permission rationale
│   ├── Request ACCESS_FINE_LOCATION
│   ├── If granted and background needed:
│   │   ├── Show background location rationale
│   │   ├── Request ACCESS_BACKGROUND_LOCATION
│   │   └── Handle result (granted/denied)
│   └── If denied: Enable manual location mode
└── Continue with app functionality
```

### 2. Camera Permission Flow
```
User taps camera button
├── Check if camera permission granted
├── If not granted:
│   ├── Show camera permission rationale
│   ├── Request CAMERA permission
│   ├── If granted: Open camera
│   └── If denied: Show gallery option
└── If granted: Open camera directly
```

### 3. Notification Permission Flow (Android 13+)
```
App first launch or notification setup
├── Check if notification permission granted
├── If not granted:
│   ├── Show notification benefits
│   ├── Request POST_NOTIFICATIONS
│   ├── If granted: Enable notifications
│   └── If denied: Disable notification features
└── Continue with app functionality
```

## Best Practices

### 1. Permission Rationale
- Always explain why permission is needed
- Show benefits to the user
- Use clear, non-technical language
- Provide examples of how permission is used

### 2. Graceful Degradation
- App should work without optional permissions
- Provide alternative workflows
- Don't repeatedly ask for denied permissions
- Respect user's privacy choices

### 3. Minimal Permissions
- Only request permissions actually needed
- Request permissions just-in-time
- Don't request all permissions at startup
- Remove unused permissions from manifest

### 4. User Control
- Provide settings to manage permissions
- Allow users to revoke permissions
- Handle permission revocation gracefully
- Show current permission status in settings

## Testing Checklist

### Permission Testing
- [ ] Test permission request flows on Android 11+
- [ ] Test permission denial scenarios
- [ ] Test permission revocation during app use
- [ ] Test background location permission flow
- [ ] Test scoped storage functionality
- [ ] Test app functionality without optional permissions

### Device Testing
- [ ] Test on Android 11 (API 30) - minimum supported
- [ ] Test on Android 12 (API 31) - notification permissions
- [ ] Test on Android 13 (API 33) - enhanced notifications
- [ ] Test on Android 14 (API 34) - latest features

### Edge Cases
- [ ] Test permission requests after app update
- [ ] Test permission behavior after device restart
- [ ] Test permission behavior in low memory conditions
- [ ] Test permission behavior with restricted battery optimization