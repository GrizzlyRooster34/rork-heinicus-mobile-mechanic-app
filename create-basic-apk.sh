#!/bin/bash

echo "🔧 Creating Basic Android APK (No Expo/React Native)"
echo "This will create a simple native Android app to test the build system"

# Create basic Android project structure
mkdir -p basic-android/app/src/main/java/com/heinicus/mechanic
mkdir -p basic-android/app/src/main/res/{layout,values,drawable,mipmap-hdpi,mipmap-mdpi,mipmap-xhdpi,mipmap-xxhdpi,mipmap-xxxhdpi}

# Create MainActivity
cat > basic-android/app/src/main/java/com/heinicus/mechanic/MainActivity.java << 'EOF'
package com.heinicus.mechanic;

import android.app.Activity;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.graphics.Color;
import android.view.ViewGroup;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#1a1a1a"));
        layout.setPadding(50, 100, 50, 50);
        
        TextView title = new TextView(this);
        title.setText("🔧 Heinicus Mobile Mechanic");
        title.setTextSize(24);
        title.setTextColor(Color.WHITE);
        title.setPadding(0, 0, 0, 30);
        
        TextView subtitle = new TextView(this);
        subtitle.setText("Professional Mobile Mechanic Services");
        subtitle.setTextSize(18);
        subtitle.setTextColor(Color.parseColor("#00BFFF"));
        subtitle.setPadding(0, 0, 0, 40);
        
        TextView message = new TextView(this);
        message.setText("This is a basic test build of the Heinicus Mobile Mechanic app.\n\nFeatures coming soon:\n• Service booking\n• Real-time tracking\n• Payment processing\n• Mechanic verification\n\nIf you can see this message, the Android build system is working correctly!");
        message.setTextSize(16);
        message.setTextColor(Color.parseColor("#E0E0E0"));
        message.setLineSpacing(1.2f, 1.0f);
        
        layout.addView(title);
        layout.addView(subtitle);
        layout.addView(message);
        
        setContentView(layout);
    }
}
EOF

# Create AndroidManifest.xml
cat > basic-android/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.heinicus.mechanic">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Heinicus Mechanic"
        android:theme="@android:style/Theme.Material.NoActionBar">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create build.gradle (app level)
cat > basic-android/app/build.gradle << 'EOF'
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.heinicus.mechanic'
    compileSdk 33
    
    defaultConfig {
        applicationId "com.heinicus.mechanic"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        debug {
            minifyEnabled false
            debuggable true
        }
        release {
            minifyEnabled false
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
EOF

# Create build.gradle (project level)
cat > basic-android/build.gradle << 'EOF'
plugins {
    id 'com.android.application' version '7.4.2' apply false
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

# Create gradle.properties
cat > basic-android/gradle.properties << 'EOF'
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.daemon=false
EOF

# Create settings.gradle
cat > basic-android/settings.gradle << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "HenicusMechanic"
include ':app'
EOF

# Create strings.xml
cat > basic-android/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">Heinicus Mechanic</string>
</resources>
EOF

# Copy app icon if available
if [ -f "assets/images/icon.png" ]; then
    echo "📱 Copying app icon..."
    cp assets/images/icon.png basic-android/app/src/main/res/mipmap-hdpi/ic_launcher.png
    cp assets/images/icon.png basic-android/app/src/main/res/mipmap-mdpi/ic_launcher.png
    cp assets/images/icon.png basic-android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    cp assets/images/icon.png basic-android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    cp assets/images/icon.png basic-android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
else
    echo "⚠️  No icon found, using default"
fi

# Setup Gradle wrapper
cd basic-android
echo "🔧 Setting up Gradle wrapper..."
gradle wrapper --gradle-version=7.6

# Make gradlew executable
chmod +x gradlew

echo "🔨 Building APK..."
./gradlew assembleDebug --no-daemon

# Check if build succeeded
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp app/build/outputs/apk/debug/app-debug.apk ../heinicus-basic.apk
    echo "✅ Basic APK built successfully!"
    echo "📱 APK saved as: heinicus-basic.apk"
    echo "📱 Install with: adb install heinicus-basic.apk"
    
    # Get APK info
    APK_SIZE=$(du -h ../heinicus-basic.apk | cut -f1)
    echo "📦 APK size: $APK_SIZE"
    
    cd ..
    echo ""
    echo "🎉 Success! You now have a working APK."
    echo "This proves the Android build system works."
    echo "The issue is with the React Native/Expo setup, not the build environment."
    
else
    echo "❌ Build failed"
    echo "📋 Build logs:"
    cat app/build/outputs/logs/gradle-debug.log 2>/dev/null || echo "No logs available"
    cd ..
    exit 1
fi