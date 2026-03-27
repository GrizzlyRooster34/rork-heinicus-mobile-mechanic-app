#!/bin/bash

# Setup script for CI/CD environments
# This script ensures compatibility between Bun (local) and npm (CI)

echo "🚀 Setting up CI environment for Heinicus Mobile Mechanic"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
  print_status "📦 CI environment detected"
  
  # Check Node.js version
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required (current: $(node --version))"
    exit 1
  fi
  
  # Check if we should use Bun or npm in CI
  if command -v bun &> /dev/null; then
    print_status "🥖 Using Bun in CI environment"
    
    # Install dependencies with Bun
    print_status "📥 Installing dependencies with Bun..."
    bun install --frozen-lockfile
    
  else
    print_status "📦 Using npm in CI environment"
    
    # Generate package-lock.json if it doesn't exist
    if [ ! -f "package-lock.json" ]; then
      print_status "🔧 Generating package-lock.json for CI compatibility..."
      npm install --package-lock-only
      
      if [ -f "package-lock.json" ]; then
        print_status "✅ package-lock.json generated successfully"
      else
        print_error "❌ Failed to generate package-lock.json"
        exit 1
      fi
    else
      print_status "📦 package-lock.json already exists"
    fi
    
    # Verify package-lock.json integrity
    print_status "🔍 Verifying package-lock.json integrity..."
    if npm ls --depth=0 > /dev/null 2>&1; then
      print_status "✅ Package integrity verified"
    else
      print_warning "⚠️  Package integrity issues detected, regenerating..."
      rm -f package-lock.json
      npm install --package-lock-only
    fi
    
    # Install dependencies with npm in CI
    print_status "📥 Installing dependencies with npm..."
    npm ci --prefer-offline --no-audit --progress=false
  fi
  
  # Verify critical dependencies
  print_status "🔍 Verifying critical dependencies..."
  CRITICAL_DEPS=("expo" "react-native" "@expo/cli")
  
  for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
      print_status "✅ $dep installed"
    else
      print_error "❌ Critical dependency missing: $dep"
      exit 1
    fi
  done
  
else
  print_status "💻 Local development environment detected"
  
  # Use Bun for local development if available
  if command -v bun &> /dev/null; then
    print_status "🥖 Installing dependencies with Bun..."
    bun install
    
    # Generate package-lock.json for CI compatibility
    if [ ! -f "package-lock.json" ]; then
      print_status "🔧 Generating package-lock.json for CI compatibility..."
      npm install --package-lock-only
    fi
  else
    print_status "⚠️  Bun not found, falling back to npm..."
    npm install
  fi
fi

# Set up Android environment variables
print_status "🤖 Setting up Android environment..."

# Verify Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  # Try to find Android SDK in common locations
  ANDROID_LOCATIONS=(
    "$HOME/Android/Sdk"
    "$HOME/Library/Android/sdk"
    "/usr/local/android-sdk"
    "/opt/android-sdk"
  )
  
  for location in "${ANDROID_LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
      export ANDROID_HOME="$location"
      export ANDROID_SDK_ROOT="$location"
      print_status "📱 Found Android SDK at: $location"
      break
    fi
  done
  
  if [ -z "$ANDROID_HOME" ]; then
    print_warning "⚠️  Android SDK not found in common locations"
    print_warning "Please set ANDROID_HOME environment variable"
  fi
else
  print_status "📱 Android SDK configured: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
fi

# Add Android tools to PATH
if [ -n "$ANDROID_HOME" ]; then
  export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
fi

# Verify Java version for Android builds
if command -v java &> /dev/null; then
  JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
  if [ "$JAVA_VERSION" -ge 17 ]; then
    print_status "☕ Java $JAVA_VERSION detected (compatible with Android builds)"
  else
    print_warning "⚠️  Java 17+ recommended for Android builds (current: Java $JAVA_VERSION)"
  fi
else
  print_warning "⚠️  Java not found - required for Android builds"
fi

# Create necessary directories
print_status "📁 Creating necessary directories..."
mkdir -p android/app/build/outputs/apk/release
mkdir -p android/app/build/outputs/logs

# Set permissions for scripts
print_status "🔧 Setting script permissions..."
chmod +x scripts/*.sh 2>/dev/null || true

print_status "✅ CI environment setup complete!"

# Print environment summary
echo ""
echo "📋 Environment Summary:"
echo "  Node.js: $(node --version 2>/dev/null || echo 'Not found')"
echo "  npm: $(npm --version 2>/dev/null || echo 'Not found')"
echo "  Bun: $(bun --version 2>/dev/null || echo 'Not found')"
echo "  Java: $(java -version 2>&1 | head -n1 | cut -d'"' -f2 2>/dev/null || echo 'Not found')"
echo "  Android SDK: ${ANDROID_HOME:-'Not configured'}"
echo "  CI Mode: ${CI:-false}"
echo ""