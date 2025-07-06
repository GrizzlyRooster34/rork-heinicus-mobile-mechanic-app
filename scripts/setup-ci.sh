#!/bin/bash

# Setup script for CI/CD environments
# This script ensures compatibility between Bun (local) and npm (CI)

echo "🚀 Setting up CI environment for Heinicus Mobile Mechanic"

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
  echo "📦 CI environment detected"
  
  # Generate package-lock.json if it doesn't exist
  if [ ! -f "package-lock.json" ]; then
    echo "🔧 Generating package-lock.json for CI compatibility..."
    npm install --package-lock-only
  fi
  
  # Install dependencies with npm in CI
  echo "📥 Installing dependencies with npm..."
  npm ci
else
  echo "💻 Local development environment detected"
  
  # Use Bun for local development
  if command -v bun &> /dev/null; then
    echo "🥖 Installing dependencies with Bun..."
    bun install
  else
    echo "⚠️  Bun not found, falling back to npm..."
    npm install
  fi
fi

echo "✅ Setup complete!"