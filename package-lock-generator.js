// Script to generate package-lock.json for CI compatibility
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating package-lock.json for CI compatibility...');

try {
  // Check if package-lock.json already exists
  if (fs.existsSync('package-lock.json')) {
    console.log('package-lock.json already exists, removing...');
    fs.unlinkSync('package-lock.json');
  }
  
  // Generate package-lock.json
  execSync('npm install --package-lock-only', { stdio: 'inherit' });
  
  console.log('✅ package-lock.json generated successfully');
  
  // Verify the file was created
  if (fs.existsSync('package-lock.json')) {
    const stats = fs.statSync('package-lock.json');
    console.log(`📦 Lock file size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  
} catch (error) {
  console.error('❌ Failed to generate package-lock.json:', error.message);
  process.exit(1);
}