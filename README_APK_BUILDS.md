# 📱 Heinicus Mobile Mechanic - Automated APK Builds

## 🚀 Automatic Build System

This repository is configured for **automatic APK generation** using GitHub Actions. Every push to `Claude-finished` branch triggers a new build.

### 📋 Build Triggers

1. **Automatic**: Push to `Claude-finished`, `main`, or `rork-model-by-claude` branches
2. **Manual**: Use "Actions" tab → "Build Android APK" → "Run workflow"
3. **EAS Cloud**: Use "Actions" tab → "EAS Build" → "Run workflow"

### 📥 Download APK

#### Method 1: GitHub Releases (Recommended)
1. Go to [Releases](https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app/releases)
2. Download latest `heinicus-mechanic-vX.X.X-buildX.apk`
3. Install on OnePlus 9 Pro

#### Method 2: Build Artifacts
1. Go to [Actions](https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app/actions)
2. Click latest "Build Android APK" workflow
3. Download from "Artifacts" section

### 🔧 Setup Instructions (One-time)

To enable automatic builds, add these secrets in GitHub repository settings:

1. **Required**: `EXPO_TOKEN`
   ```bash
   # Get your token from: https://expo.dev/accounts/settings
   npx expo login
   npx expo whoami --json
   ```

2. **Optional**: `ANDROID_KEYSTORE_BASE64` (for signed releases)
   ```bash
   # Generate keystore and convert to base64
   keytool -genkey -v -keystore release.keystore -alias app -keyalg RSA -keysize 2048
   base64 -w 0 release.keystore
   ```

### 🎯 Quick Commands

```bash
# Trigger build manually
git add . && git commit -m "Trigger build" && git push origin Claude-finished

# Check build status
# Visit: https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app/actions

# Download latest APK
# Visit: https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app/releases
```

### 📊 Build Features

✅ **Auto-versioning**: Version code increments automatically  
✅ **Multi-profile**: Development, Preview, Production builds  
✅ **APK artifacts**: Downloadable from Actions  
✅ **GitHub releases**: Tagged releases with APK attached  
✅ **Build summaries**: Detailed build information  
✅ **OnePlus 9 Pro**: Optimized for target device  

### 🔄 Build Process

1. **Code Push** → GitHub detects changes
2. **Setup Environment** → Node.js, Android SDK, Java
3. **Install Dependencies** → npm ci --legacy-peer-deps
4. **Version Bump** → Auto-increment build number
5. **Generate Native** → expo prebuild creates Android project
6. **Build APK** → Gradle assembles debug/release APK
7. **Upload Artifacts** → APK available for download
8. **Create Release** → Tagged release with APK attachment

### 📱 Installation on OnePlus 9 Pro

1. **Download APK** from Releases or Artifacts
2. **Enable Unknown Sources**: Settings → Security → Install unknown apps
3. **Install APK**: File manager → tap APK → Install
4. **Launch App**: "Heinicus Mechanic" in app drawer

### 🏷️ App Information

- **Package**: `com.heinicus.mobilemechanic`
- **App Name**: `Heinicus Mechanic`
- **Target SDK**: Android 35 (API 35)
- **Min SDK**: Android 24 (API 24)
- **Architecture**: Universal (ARM64, ARM, x86_64)

---

## 🎉 Ready for Production!

Your mobile mechanic app now has **automated APK builds** on every code change. Simply push to the `Claude-finished` branch and get a fresh APK within 10-15 minutes!