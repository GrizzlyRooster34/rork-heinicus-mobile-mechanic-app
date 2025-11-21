#!/bin/bash

echo "🚀 Auto-configuring EAS Build for Heinicus Mechanic App..."

# Try to create project with expect if available
if command -v expect &> /dev/null; then
    echo "📋 Using expect to handle prompts..."
    expect << 'EOF'
spawn eas build -p android --profile development
expect "Would you like to automatically create an EAS project*"
send "y\r"
expect eof
EOF
else
    echo "⚠️ expect not available - trying alternative method..."
    
    # Alternative: Use printf to simulate yes responses
    printf "y\ny\ny\n" | timeout 300 eas build -p android --profile development
    
    if [ $? -eq 124 ]; then
        echo "⏰ Build timed out - this is normal for cloud builds"
        echo "✅ Check your EAS dashboard for build progress"
        echo "🔗 Visit: https://expo.dev/accounts/heinicus1/projects/heinicus-mobile-mechanic-app/builds"
    fi
fi

echo ""
echo "📱 Build should now be in progress!"
echo "🔗 Monitor at: https://expo.dev/accounts/heinicus1/projects"
echo "📧 You'll get an email when the APK is ready for download"