# 🚀 APK Build Instructions for Heinicus Mobile Mechanic App

## OnePlus 9 Pro Termux-Optimized Build Guide

### Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Verify your setup:**
   ```bash
   eas --version
   ```

### Quick Build Commands

#### Development APK (Recommended for testing)
```bash
npm run build:apk
```

#### Manual Build Options
```bash
# Development build with auto-versioning
npm run build:dev

# Preview build (optimized but still internal)
npm run build:preview

# Production build
npm run build:prod
```

### Step-by-Step Build Process

1. **Navigate to project root:**
   ```bash
   cd /data/data/com.termux/files/home/downloads/repo2
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Run the build:**
   ```bash
   npm run build:apk
   ```

4. **Monitor build progress:**
   - EAS will provide a URL to monitor build progress
   - Build typically takes 10-15 minutes
   - You'll get a download link when complete

### Manual Version Management

```bash
# Bump version manually
npm run bump

# Check current version
cat app.json | grep -A 3 "android"
```

### Build Profiles Explained

- **Development**: Fast builds, includes debugging tools
- **Preview**: Optimized builds for testing, no debugging
- **Production**: Fully optimized for release

### APK Installation on OnePlus 9 Pro

1. **Download APK from EAS build URL**
2. **Transfer to phone** (if built on different device)
3. **Install:**
   ```bash
   adb install path/to/your-app.apk
   ```
   Or use file manager to install directly

### Configuration Files Created

- ✅ `eas.json` - EAS Build configuration
- ✅ `app.json` - Updated with Android package info
- ✅ `scripts/bumpVersion.js` - Auto-versioning script
- ✅ `package.json` - Added build scripts

### Key Settings

- **Package Name**: `com.heinicus.mobilemechanic`
- **App Name**: `Heinicus Mechanic`
- **Build Type**: APK (not AAB)
- **Version Code**: Auto-incrementing starting from 1

### Troubleshooting

1. **Build fails with authentication error:**
   ```bash
   eas logout
   eas login
   ```

2. **Node.js version issues:**
   ```bash
   node --version  # Should be 18+ for EAS
   ```

3. **Check build logs:**
   - EAS provides detailed logs at the build URL
   - Look for specific error messages

### Environment Variables

If your app uses environment variables, add them to EAS:

```bash
eas secret:create --scope project --name API_KEY --value "your-api-key"
```

### Repository Integration

The build is configured for the repository:
`https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app/tree/rork-model-by-claude`

### Quick Commands Reference

```bash
# Build APK
npm run build:apk

# Bump version only
npm run bump

# Check build status
eas build:list

# Download latest build
eas build:download --latest
```

---

## 🎯 One-Command Build

For the fastest build experience:

```bash
npm run build:apk
```

This will:
1. ✅ Auto-increment version code
2. ✅ Build development APK
3. ✅ Provide download link
4. ✅ Optimized for local testing

**Build time**: ~10-15 minutes  
**Output**: Ready-to-install APK for OnePlus 9 Pro