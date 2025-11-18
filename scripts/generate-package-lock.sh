#!/bin/bash

# Generate package-lock.json for CI compatibility
# This script ensures that CI systems that expect package-lock.json can work
# even though we primarily use Bun locally

echo "🔧 Generating package-lock.json for CI compatibility..."

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

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    exit 1
fi

# Check if package-lock.json already exists
if [ -f "package-lock.json" ]; then
    print_warning "package-lock.json already exists"
    
    # Ask if user wants to regenerate
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Keeping existing package-lock.json"
        exit 0
    fi
    
    print_status "Removing existing package-lock.json..."
    rm package-lock.json
fi

# Clean npm cache
print_status "Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

# Generate package-lock.json
print_status "Generating package-lock.json..."
npm install --package-lock-only --no-audit --no-fund

# Verify the file was created
if [ -f "package-lock.json" ]; then
    APK_SIZE=$(du -h package-lock.json | cut -f1)
    print_status "✅ package-lock.json generated successfully (${APK_SIZE})"
    
    # Verify integrity
    if npm ls --depth=0 > /dev/null 2>&1; then
        print_status "✅ Package integrity verified"
    else
        print_warning "⚠️  Package integrity check failed"
    fi
else
    print_error "❌ Failed to generate package-lock.json"
    exit 1
fi

print_status "🎉 Done! CI systems can now use package-lock.json"