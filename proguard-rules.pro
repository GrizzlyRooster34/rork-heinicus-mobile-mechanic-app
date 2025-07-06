# ProGuard rules for Heinicus Mobile Mechanic Android app
# Optimized for Android 11+ builds

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep Expo classes
-keep class expo.** { *; }
-keep class versioned.host.exp.exponent.** { *; }

# Keep native modules
-keep class com.heinicus.mobilemechanic.** { *; }

# Keep location services
-keep class com.google.android.gms.location.** { *; }
-keep class com.google.android.gms.maps.** { *; }

# Keep camera classes
-keep class androidx.camera.** { *; }
-keep class com.google.mlkit.** { *; }

# Keep networking classes
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# Keep JSON serialization
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Optimize for Android 11+
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Keep crash reporting
-keep class com.crashlytics.** { *; }
-dontwarn com.crashlytics.**

# Keep Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep push notifications
-keep class com.google.android.gms.gcm.** { *; }
-keep class com.google.firebase.messaging.** { *; }

# Keep biometric authentication
-keep class androidx.biometric.** { *; }
-keep class android.hardware.biometrics.** { *; }

# Keep secure storage
-keep class androidx.security.crypto.** { *; }

# Suppress warnings for optional dependencies
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**