#!/bin/bash

echo "🔧 Manual APK Build Script for Heinicus Mobile Mechanic"
echo "This script will attempt to build an APK using available tools"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    print_error "app.json not found. Run this script from the project root."
    exit 1
fi

print_status "📱 Starting APK build process..."

# Method 1: Try EAS build locally
print_status "🚀 Method 1: Attempting EAS build..."
if npx eas build --platform android --profile development --local --non-interactive 2>/dev/null; then
    print_status "✅ EAS local build completed!"
    if [ -f "build-*.apk" ]; then
        mv build-*.apk heinicus-eas-local.apk
        print_status "📱 APK saved as: heinicus-eas-local.apk"
        exit 0
    fi
else
    print_warning "❌ EAS local build failed"
fi

# Method 2: Try Expo prebuild + Gradle
print_status "🔨 Method 2: Attempting Expo prebuild + Gradle..."
export EXPO_NO_DOTENV=1
export EXPO_NO_TYPESCRIPT_SETUP=1

# Clean any previous android directory
rm -rf android

if npx expo prebuild --platform android --clear --no-install 2>/dev/null; then
    print_status "✅ Expo prebuild completed!"
    
    if [ -d "android" ]; then
        cd android
        if [ -f "gradlew" ]; then
            chmod +x gradlew
            print_status "🔨 Building with Gradle..."
            if ./gradlew assembleDebug --no-daemon 2>/dev/null; then
                if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
                    cp app/build/outputs/apk/debug/app-debug.apk ../heinicus-gradle.apk
                    print_status "✅ Gradle build completed!"
                    print_status "📱 APK saved as: heinicus-gradle.apk"
                    cd ..
                    exit 0
                fi
            else
                print_warning "❌ Gradle build failed"
            fi
        else
            print_warning "❌ Gradle wrapper not found"
        fi
        cd ..
    else
        print_warning "❌ Android directory not created by prebuild"
    fi
else
    print_warning "❌ Expo prebuild failed"
fi

# Method 3: Try with simplified configuration
print_status "🔧 Method 3: Attempting with simplified configuration..."

# Create a minimal app.json
cat > app-simple.json << 'EOF'
{
  "expo": {
    "name": "Heinicus Mechanic",
    "slug": "heinicus-mechanic",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "newArchEnabled": false,
    "android": {
      "package": "com.heinicus.mechanic"
    },
    "plugins": ["expo-router"]
  }
}
EOF

# Backup original and use simple config
mv app.json app-original.json
mv app-simple.json app.json

rm -rf android

if npx expo prebuild --platform android --clear --no-install 2>/dev/null; then
    print_status "✅ Simple prebuild completed!"
    
    if [ -d "android" ]; then
        cd android
        chmod +x gradlew
        if ./gradlew assembleDebug --no-daemon 2>/dev/null; then
            if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
                cp app/build/outputs/apk/debug/app-debug.apk ../heinicus-simple.apk
                print_status "✅ Simple build completed!"
                print_status "📱 APK saved as: heinicus-simple.apk"
                cd ..
                # Restore original config
                mv app-original.json app.json
                exit 0
            fi
        fi
        cd ..
    fi
fi

# Restore original config
mv app-original.json app.json

print_error "❌ All build methods failed"
print_status "📋 Troubleshooting suggestions:"
print_status "1. Try running: npm install --legacy-peer-deps"
print_status "2. Check Android SDK installation"
print_status "3. Try the EAS cloud build instead"
print_status "4. Check the GitHub Actions builds"

exit 1