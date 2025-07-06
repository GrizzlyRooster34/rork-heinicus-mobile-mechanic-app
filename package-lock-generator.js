// Script to generate package-lock.json for CI compatibility
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Generating package-lock.json for CI compatibility...');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

try {
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found!', 'red');
    process.exit(1);
  }
  
  // Read package.json to verify it's valid
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  log(`📦 Found package.json for: ${packageJson.name}`, 'green');
  
  // Check if package-lock.json already exists
  if (fs.existsSync('package-lock.json')) {
    log('📋 package-lock.json already exists, checking integrity...', 'yellow');
    
    try {
      // Verify existing lock file integrity
      execSync('npm ls --depth=0', { stdio: 'pipe' });
      log('✅ Existing package-lock.json is valid', 'green');
      
      // Get lock file stats
      const stats = fs.statSync('package-lock.json');
      log(`📊 Lock file size: ${(stats.size / 1024).toFixed(2)} KB`, 'green');
      
      return;
    } catch (error) {
      log('⚠️  Existing package-lock.json has integrity issues, regenerating...', 'yellow');
      fs.unlinkSync('package-lock.json');
    }
  }
  
  // Clean npm cache to avoid conflicts
  log('🧹 Cleaning npm cache...', 'yellow');
  try {
    execSync('npm cache clean --force', { stdio: 'pipe' });
  } catch (error) {
    log('⚠️  Cache clean failed, continuing...', 'yellow');
  }
  
  // Generate package-lock.json
  log('⚙️  Generating package-lock.json...', 'yellow');
  execSync('npm install --package-lock-only --no-audit --no-fund', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  // Verify the file was created and is valid
  if (fs.existsSync('package-lock.json')) {
    const stats = fs.statSync('package-lock.json');
    log('✅ package-lock.json generated successfully', 'green');
    log(`📊 Lock file size: ${(stats.size / 1024).toFixed(2)} KB`, 'green');
    
    // Verify lock file integrity
    try {
      execSync('npm ls --depth=0', { stdio: 'pipe' });
      log('✅ Lock file integrity verified', 'green');
    } catch (error) {
      log('⚠️  Lock file integrity check failed, but file was created', 'yellow');
    }
    
    // Read and validate lock file structure
    try {
      const lockData = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
      log(`📋 Lock file version: ${lockData.lockfileVersion}`, 'green');
      log(`📦 Dependencies: ${Object.keys(lockData.dependencies || {}).length}`, 'green');
    } catch (error) {
      log('⚠️  Could not parse lock file, but it exists', 'yellow');
    }
    
  } else {
    log('❌ Failed to generate package-lock.json', 'red');
    process.exit(1);
  }
  
  log('🎉 Package lock generation completed successfully!', 'green');
  
} catch (error) {
  log(`❌ Failed to generate package-lock.json: ${error.message}`, 'red');
  
  // Provide helpful error messages
  if (error.message.includes('EACCES')) {
    log('💡 Try running with sudo or check file permissions', 'yellow');
  } else if (error.message.includes('ENOTFOUND')) {
    log('💡 Check your internet connection and npm registry settings', 'yellow');
  } else if (error.message.includes('ERESOLVE')) {
    log('💡 Try running: npm install --package-lock-only --legacy-peer-deps', 'yellow');
  }
  
  process.exit(1);
}