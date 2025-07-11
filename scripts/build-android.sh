#!/bin/bash

# Android build script for Heinicus Mobile Mechanic
# Optimized for Android 11+ builds

set -e

echo "🔧 Building Heinicus Mobile Mechanic for Android 11+"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required (current: $(node --version))"
    exit 1
fi

# Check Java version
if ! command -v java &> /dev/null; then
    print_error "Java is not installed"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    print_error "Java 17+ is required for Android builds"
    exit 1
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    print_error "ANDROID_HOME environment variable is not set"
    exit 1
fi

print_status "Prerequisites check passed ✅"

# Install dependencies
print_status "Installing dependencies..."
if command -v bun &> /dev/null; then
    print_status "Using Bun package manager"
    bun install
else
    print_status "Using npm package manager"
    npm install
fi

# Generate package-lock.json for CI compatibility
if [ ! -f "package-lock.json" ]; then
    print_status "Generating package-lock.json for CI compatibility..."
    npm install --package-lock-only
fi

# Clean previous builds
print_status "Cleaning previous builds..."
if [ -d "android" ]; then
    rm -rf android
fi

# Prebuild for Android
print_status "Prebuilding for Android..."
if command -v bun &> /dev/null; then
    bunx expo prebuild --platform android --clean
else
    npx expo prebuild --platform android --clean
fi

# Build Android APK
print_status "Building Android APK..."
cd android

# Set executable permissions for gradlew
chmod +x ./gradlew

# Build release APK
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    print_status "✅ Android APK built successfully!"
    
    # Get APK size
    APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
    print_status "📦 APK size: $APK_SIZE"
    
    # Copy APK to root directory
    cp app/build/outputs/apk/release/app-release.apk ../heinicus-mobile-mechanic.apk
    print_status "📱 APK copied to: heinicus-mobile-mechanic.apk"
    
else
    print_error "❌ Android build failed!"
    exit 1
fi

cd ..

print_status "🎉 Build completed successfully!"
print_status "📱 Install APK: adb install heinicus-mobile-mechanic.apk"