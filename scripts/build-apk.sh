#!/bin/bash

echo "🚀 Building Heinicus Mechanic APK..."
echo "📱 Target: OnePlus 9 Pro"
echo "🔧 Build Type: Development APK"
echo ""

# Bump version
echo "📈 Bumping version..."
npm run bump

# Try EAS build first
echo "🏗️ Attempting EAS build..."
eas build -p android --profile development --non-interactive 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ EAS build successful!"
    echo "📥 Check your email or EAS dashboard for download link"
else
    echo "⚠️ EAS build failed - trying alternative method..."
    
    # Alternative: Use expo prebuild + manual build
    echo "🔧 Creating native project with expo prebuild..."
    npx expo prebuild --platform android --clear
    
    if [ $? -eq 0 ]; then
        echo "✅ Native Android project created"
        echo "📱 APK can be built using Android Studio or gradlew"
        echo "💡 Next steps:"
        echo "   1. Open android/ folder in Android Studio"
        echo "   2. Or run: cd android && ./gradlew assembleDebug"
        echo "   3. APK will be in android/app/build/outputs/apk/debug/"
    else
        echo "❌ Build failed. Please check requirements:"
        echo "   - Expo account logged in: eas whoami"
        echo "   - Project dependencies installed: npm install"
        echo "   - EAS CLI installed: npm install -g eas-cli"
    fi
fi