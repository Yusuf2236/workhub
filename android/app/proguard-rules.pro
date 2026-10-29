# WorkHub Proguard Rules

# Preserve Data Models for JSON parsing
-keep class com.workhub.app.data.models.** { *; }

# Keep Coroutines
-keepnames class kotlinx.coroutines.** { *; }

# Coil image loading
-keep class coil.** { *; }
-dontwarn coil.**
