/**
 * Build Status Checker
 * Validates the current build configuration and provides status information
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const packageJsonPath = path.join(__dirname, '../package.json');
const easJsonPath = path.join(__dirname, '../eas.json');

function checkFile(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${name} not found at ${filePath}`);
    return false;
  }
  console.log(`✅ ${name} exists`);
  return true;
}

function validateAppJson(appJson) {
  const issues = [];
  
  if (!appJson.expo) {
    issues.push('Missing expo configuration');
    return issues;
  }
  
  if (!appJson.expo.name) issues.push('Missing app name');
  if (!appJson.expo.version) issues.push('Missing app version');
  if (!appJson.expo.android?.package) issues.push('Missing Android package name');
  if (!appJson.expo.android?.versionCode) issues.push('Missing Android version code');
  
  // Check required permissions
  const requiredPermissions = ['CAMERA', 'ACCESS_FINE_LOCATION', 'INTERNET'];
  const permissions = appJson.expo.android?.permissions || [];
  
  requiredPermissions.forEach(perm => {
    if (!permissions.includes(perm)) {
      issues.push(`Missing required permission: ${perm}`);
    }
  });
  
  return issues;
}

function validateEasJson(easJson) {
  const issues = [];
  
  if (!easJson.build) {
    issues.push('Missing build configuration');
    return issues;
  }
  
  const profiles = ['development', 'preview', 'standalone', 'production'];
  profiles.forEach(profile => {
    if (!easJson.build[profile]) {
      issues.push(`Missing build profile: ${profile}`);
    }
  });
  
  return issues;
}

function checkBuildEnvironment() {
  const issues = [];
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    issues.push(`Node.js version too old: ${nodeVersion} (requires >= 16)`);
  }
  
  // Check if EAS CLI is available (would need to be checked in shell)
  // This is just a placeholder for the check
  
  return issues;
}

function getBuildInfo() {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    return {
      appName: appJson.expo?.name || 'Unknown',
      appVersion: appJson.expo?.version || '0.0.0',
      versionCode: appJson.expo?.android?.versionCode || 1,
      packageName: appJson.expo?.android?.package || 'unknown',
      packageVersion: packageJson.version || '0.0.0',
      buildInfo: appJson.expo?.extra?.buildInfo || null
    };
  } catch (error) {
    console.error('Error reading build info:', error.message);
    return null;
  }
}

function main() {
  console.log('🔍 HEINICUS MOBILE MECHANIC - BUILD STATUS CHECK');
  console.log('=' .repeat(60));
  
  // Check configuration files
  console.log('\\n📁 Configuration Files:');
  const filesOk = [
    checkFile(appJsonPath, 'app.json'),
    checkFile(packageJsonPath, 'package.json'),
    checkFile(easJsonPath, 'eas.json')
  ].every(Boolean);
  
  if (!filesOk) {
    console.error('\\n❌ Missing required configuration files');
    process.exit(1);
  }
  
  // Validate configurations
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    
    console.log('\\n🔧 Configuration Validation:');
    
    const appIssues = validateAppJson(appJson);
    const easIssues = validateEasJson(easJson);
    const envIssues = checkBuildEnvironment();
    
    const allIssues = [...appIssues, ...easIssues, ...envIssues];
    
    if (allIssues.length === 0) {
      console.log('✅ All configurations valid');
    } else {
      console.log('⚠️  Configuration issues found:');
      allIssues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    // Display build information
    console.log('\\n📱 Current Build Information:');
    const buildInfo = getBuildInfo();
    
    if (buildInfo) {
      console.log(`   App Name: ${buildInfo.appName}`);
      console.log(`   App Version: ${buildInfo.appVersion}`);
      console.log(`   Version Code: ${buildInfo.versionCode}`);
      console.log(`   Package: ${buildInfo.packageName}`);
      
      if (buildInfo.buildInfo) {
        console.log(`   Last Build: ${buildInfo.buildInfo.buildDate}`);
        console.log(`   Git Branch: ${buildInfo.buildInfo.gitBranch}`);
        console.log(`   Git Commit: ${buildInfo.buildInfo.gitCommit}`);
      }
    }
    
    // Build commands reference
    console.log('\\n🛠️  Available Build Commands:');
    console.log('   npm run build:dev       # Development APK');
    console.log('   npm run build:preview   # Preview APK');
    console.log('   npm run build:standalone # Standalone APK');
    console.log('   npm run build:prod      # Production AAB');
    console.log('   npm run bump:patch      # Bump patch version');
    console.log('   npm run bump:minor      # Bump minor version');
    console.log('   npm run bump:major      # Bump major version');
    
    // Status summary
    console.log('\\n' + '=' .repeat(60));
    if (allIssues.length === 0) {
      console.log('🟢 BUILD SYSTEM STATUS: READY');
    } else if (allIssues.length <= 3) {
      console.log('🟡 BUILD SYSTEM STATUS: MINOR ISSUES');
    } else {
      console.log('🔴 BUILD SYSTEM STATUS: NEEDS ATTENTION');
    }
    
  } catch (error) {
    console.error('\\n❌ Error validating configuration:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getBuildInfo, validateAppJson, validateEasJson };