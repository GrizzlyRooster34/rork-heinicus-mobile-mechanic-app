#!/bin/bash

echo "🔍 Android App Crash Debug Script"
echo "This will help identify why the APK is crashing"

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Install Android platform tools first."
    echo "📱 Alternative: Check crash logs on your phone:"
    echo "   Settings > Developer Options > Bug Report"
    echo "   Or use a crash reporting app"
    exit 1
fi

echo "📱 Checking connected devices..."
adb devices

echo ""
echo "🔍 Getting crash logs from device..."
echo "Please reproduce the crash now (install and open the APK)"
echo "Then press Enter to capture logs..."
read -p "Press Enter after crash occurs..."

echo ""
echo "📋 Recent crash logs:"
adb logcat -d | grep -i -A 5 -B 5 "FATAL\|AndroidRuntime\|crash\|heinicus\|mechanic" | tail -50

echo ""
echo "📋 System info:"
echo "Device model:"
adb shell getprop ro.product.model
echo "Android version:"
adb shell getprop ro.build.version.release
echo "API level:"
adb shell getprop ro.build.version.sdk

echo ""
echo "🔍 App-specific logs:"
adb logcat -d | grep -i "com.heinicus\|com.rork" | tail -20

echo ""
echo "📱 Installed packages matching our app:"
adb shell pm list packages | grep -i "heinicus\|mechanic\|rork"

echo ""
echo "🔧 To get live logs:"
echo "Run: adb logcat | grep -i heinicus"
echo ""
echo "🔧 To clear logs and start fresh:"
echo "Run: adb logcat -c"
echo ""
echo "📱 To uninstall app:"
echo "Run: adb uninstall com.heinicus.mechanic"
echo "Or:  adb uninstall com.heinicus.test"
echo "Or:  adb uninstall app.rork.mobilemechanic"