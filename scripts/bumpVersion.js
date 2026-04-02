const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appJsonPath = path.join(__dirname, '../app.json');
const packageJsonPath = path.join(__dirname, '../package.json');

// Parse command line arguments
const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // major, minor, patch, or build

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    return { branch, commit, timestamp };
  } catch (error) {
    console.warn('⚠️ Git info not available:', error.message);
    return { branch: 'unknown', commit: 'unknown', timestamp: new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_') };
  }
}

function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  const [major, minor, patch] = parts;
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const gitInfo = getGitInfo();
  
  // Current versions
  const currentVersion = appJson.expo.version;
  const currentVersionCode = appJson.expo.android.versionCode || 1;
  
  // Update version based on type
  let newVersion = currentVersion;
  let newVersionCode = currentVersionCode;
  
  if (bumpType === 'build') {
    // Only increment build number (versionCode)
    newVersionCode = currentVersionCode + 1;
  } else {
    // Increment semantic version and build number
    newVersion = incrementVersion(currentVersion, bumpType);
    newVersionCode = currentVersionCode + 1;
  }
  
  // Update app.json
  appJson.expo.version = newVersion;
  appJson.expo.android.versionCode = newVersionCode;
  
  // Add build metadata
  if (!appJson.expo.extra) {
    appJson.expo.extra = {};
  }
  
  appJson.expo.extra.buildInfo = {
    buildNumber: newVersionCode,
    buildDate: new Date().toISOString(),
    gitBranch: gitInfo.branch,
    gitCommit: gitInfo.commit,
    buildType: bumpType,
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Update package.json version to match
  packageJson.version = newVersion;
  
  // Write files
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Generate build summary
  console.log('\n🚀 BUILD VERSION UPDATED');
  console.log('=' .repeat(50));
  console.log(`📦 App Version: ${currentVersion} → ${newVersion}`);
  console.log(`🔢 Build Number: ${currentVersionCode} → ${newVersionCode}`);
  console.log(`📱 Package: ${appJson.expo.android.package}`);
  console.log(`🌿 Git Branch: ${gitInfo.branch}`);
  console.log(`📝 Git Commit: ${gitInfo.commit}`);
  console.log(`⏰ Build Time: ${new Date().toLocaleString()}`);
  console.log(`🔧 Bump Type: ${bumpType}`);
  console.log('=' .repeat(50));
  
  // Create build info file for CI
  const buildInfo = {
    version: newVersion,
    versionCode: newVersionCode,
    package: appJson.expo.android.package,
    buildDate: new Date().toISOString(),
    gitInfo,
    bumpType
  };
  
  fs.writeFileSync(path.join(__dirname, '../build-info.json'), JSON.stringify(buildInfo, null, 2));
  console.log('📄 Build info saved to build-info.json\n');
  
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}