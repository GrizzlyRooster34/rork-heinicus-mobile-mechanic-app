#!/bin/bash
# Simple APK build script for Termux environment

echo "🔧 Building APK in Termux environment..."

# Set environment variables
export ANDROID_HOME=/data/data/com.termux/files/usr/share/android-sdk
export JAVA_HOME=/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Create simple APK without native dependencies
echo "📱 Creating simple production APK..."

# Build JavaScript bundle
echo "📦 Building JavaScript bundle..."
npx expo export --platform android --output-dir dist/

# Create simple APK structure
echo "🏗️ Creating APK structure..."
mkdir -p simple-apk/assets
mkdir -p simple-apk/META-INF

# Copy bundle
cp -r dist/* simple-apk/assets/

# Create basic manifest
cat > simple-apk/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.heinicus.mobilemechanic"
    android:versionCode="9"
    android:versionName="1.1.0">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Heinicus Mechanic"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

echo "✅ Simple APK structure created in simple-apk/"
echo "📂 Bundle exported to dist/"
echo "🎯 To create full APK, use: eas build --platform android --local"