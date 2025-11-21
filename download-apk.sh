#!/bin/bash

echo "📱 Heinicus Mobile Mechanic APK Download"
echo "Since local builds are failing, let's get a working APK another way"

# Check if we can find any existing builds
echo "🔍 Checking for existing builds..."

# Look for any APK files that might exist
find . -name "*.apk" -type f 2>/dev/null | while read apk; do
    if [ -f "$apk" ]; then
        echo "✅ Found existing APK: $apk"
        APK_SIZE=$(du -h "$apk" | cut -f1)
        echo "📦 Size: $APK_SIZE"
        echo "📱 You can install this with: adb install \"$apk\""
    fi
done

# Check if there are any successful GitHub Actions builds
echo ""
echo "🔍 Checking GitHub Actions for successful builds..."
echo "Visit: https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app/actions"
echo "Look for completed workflows with green checkmarks"
echo "Download artifacts from successful builds"

echo ""
echo "🎯 Alternative Solutions:"
echo ""
echo "1. 📱 Use Expo Development Build:"
echo "   - Install Expo Go from Play Store"
echo "   - Scan QR code from 'npm start'"
echo "   - Test app in development mode"
echo ""
echo "2. 🌐 Use Expo Web Version:"
echo "   - Run 'npm run start-web'"
echo "   - Open in browser to test functionality"
echo ""
echo "3. ☁️ Set up EAS Build properly:"
echo "   - Sign up at https://expo.dev"
echo "   - Run 'npx eas login'"
echo "   - Run 'npx eas build:configure'"
echo "   - Run 'npx eas build --platform android'"
echo ""
echo "4. 🔧 Install Android development environment:"
echo "   - Install Android Studio"
echo "   - Set up Android SDK"
echo "   - Install Gradle"
echo "   - Run local builds"
echo ""
echo "5. 📦 Use GitHub Codespaces:"
echo "   - Open repository in GitHub Codespaces"
echo "   - Run builds in cloud environment"
echo "   - Download APK from cloud"

# Create a simple web version for immediate testing
echo ""
echo "🌐 Creating web version for immediate testing..."

if command -v npm &> /dev/null; then
    echo "Starting web development server..."
    echo "This will allow you to test the app in a browser"
    echo ""
    echo "📱 To test on your phone:"
    echo "1. Connect phone and computer to same WiFi"
    echo "2. Open the URL shown below on your phone's browser"
    echo "3. Test app functionality"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the web server
    npm run start-web 2>/dev/null || npm run web 2>/dev/null || npm start 2>/dev/null || echo "❌ Could not start web server"
else
    echo "❌ npm not available"
fi