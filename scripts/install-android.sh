#!/bin/bash

# Android installation script for Heinicus Mobile Mechanic

set -e

echo "📱 Installing Heinicus Mobile Mechanic on Android device"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    print_error "ADB is not installed or not in PATH"
    print_error "Please install Android SDK Platform Tools"
    exit 1
fi

# Check if device is connected
print_status "Checking for connected Android devices..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    print_error "No Android devices connected"
    print_error "Please connect your Android device and enable USB debugging"
    exit 1
elif [ "$DEVICES" -gt 1 ]; then
    print_warning "Multiple devices connected. Using first device."
fi

# Check if APK exists
APK_PATH="heinicus-mobile-mechanic.apk"
if [ ! -f "$APK_PATH" ]; then
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    if [ ! -f "$APK_PATH" ]; then
        print_error "APK file not found. Please build the app first:"
        print_error "  bun run build:android:preview"
        exit 1
    fi
fi

print_status "Found APK: $APK_PATH"

# Get device info
DEVICE_MODEL=$(adb shell getprop ro.product.model 2>/dev/null || echo "Unknown")
ANDROID_VERSION=$(adb shell getprop ro.build.version.release 2>/dev/null || echo "Unknown")
API_LEVEL=$(adb shell getprop ro.build.version.sdk 2>/dev/null || echo "Unknown")

print_status "Device: $DEVICE_MODEL"
print_status "Android: $ANDROID_VERSION (API $API_LEVEL)"

# Check Android version compatibility
if [ "$API_LEVEL" -lt 30 ]; then
    print_warning "This app is optimized for Android 11+ (API 30+)"
    print_warning "Your device is running API $API_LEVEL"
    print_warning "Some features may not work properly"
fi

# Uninstall previous version if exists
print_status "Checking for previous installation..."
if adb shell pm list packages | grep -q "com.heinicus.mobilemechanic"; then
    print_status "Uninstalling previous version..."
    adb uninstall com.heinicus.mobilemechanic || true
fi

# Install APK
print_status "Installing APK..."
if adb install "$APK_PATH"; then
    print_status "✅ Installation successful!"
    
    # Launch app
    print_status "Launching Heinicus Mobile Mechanic..."
    adb shell am start -n com.heinicus.mobilemechanic/.MainActivity
    
    print_status "🎉 App installed and launched successfully!"
    print_status "📱 You can now use Heinicus Mobile Mechanic on your device"
    
else
    print_error "❌ Installation failed!"
    print_error "Please check device permissions and try again"
    exit 1
fi