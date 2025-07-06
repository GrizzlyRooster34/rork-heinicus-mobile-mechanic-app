const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');

try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const versionCode = appJson.expo.android.versionCode || 1;
  
  appJson.expo.android.versionCode = versionCode + 1;
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log(`✅ Version bumped to ${appJson.expo.android.versionCode}`);
  console.log(`📱 Package: ${appJson.expo.android.package}`);
  console.log(`🔖 App version: ${appJson.expo.version}`);
} catch (error) {
  console.error('❌ Error bumping version:', error.message);
  process.exit(1);
}