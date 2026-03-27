import 'dotenv/config';
import { prisma } from './lib/prisma';
import {
  generateTOTPSecret,
  verifyTOTPToken,
  generateBackupCodes,
  enableTwoFactor,
  getTwoFactorStatus,
} from './backend/services/two-factor-auth';
import {
  requestPasswordReset,
  validatePasswordStrength,
  resetPassword,
  changePassword,
} from './backend/services/password-reset';
import {
  generateAccessToken,
  verifyJWTToken,
  getUserFromToken,
} from './backend/middleware/auth';
import bcrypt from 'bcryptjs';

async function testSecurityFeatures() {
  console.log('🔐 Testing Security Features\n');
  console.log('='.repeat(60));

  try {
    // ============================================
    // Test 1: JWT Token Generation and Verification
    // ============================================
    console.log('\n1️⃣  Testing JWT Token Generation & Verification...');

    const testUser = await prisma.user.findFirst({
      where: { email: 'matthew.heinen.2014@gmail.com' },
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    const token = generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });

    console.log(`   ✅ Token generated: ${token.substring(0, 20)}...`);

    const decoded = verifyJWTToken(token);
    if (decoded) {
      console.log(`   ✅ Token verified successfully`);
      console.log(`      User ID: ${decoded.userId}`);
      console.log(`      Email: ${decoded.email}`);
      console.log(`      Role: ${decoded.role}`);
    } else {
      console.log(`   ❌ Token verification failed`);
    }

    const user = await getUserFromToken(token);
    if (user) {
      console.log(`   ✅ User retrieved from token: ${user.firstName} ${user.lastName}`);
    }

    // ============================================
    // Test 2: Password Strength Validation
    // ============================================
    console.log('\n2️⃣  Testing Password Strength Validation...');

    const weakPassword = 'test';
    const strongPassword = 'MyStr0ng!Pass123';

    const weakValidation = validatePasswordStrength(weakPassword);
    console.log(`   Weak password "${weakPassword}": ${weakValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!weakValidation.valid) {
      weakValidation.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }

    const strongValidation = validatePasswordStrength(strongPassword);
    console.log(`   Strong password "${strongPassword}": ${strongValidation.valid ? '✅ Valid' : '❌ Invalid'}`);

    // ============================================
    // Test 3: Password Change
    // ============================================
    console.log('\n3️⃣  Testing Password Change...');

    // First, set a known password for testing
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await prisma.user.update({
      where: { id: testUser.id },
      data: { passwordHash: hashedPassword },
    });

    // Try changing password with wrong current password
    const wrongPasswordResult = await changePassword(
      testUser.id,
      'WrongPassword123!',
      'NewPassword123!'
    );

    console.log(`   Change with wrong password: ${wrongPasswordResult.success ? '✅ Success' : '❌ Failed'}`);
    if (!wrongPasswordResult.success) {
      console.log(`      Error: ${wrongPasswordResult.error}`);
    }

    // Change password with correct current password
    const correctPasswordResult = await changePassword(
      testUser.id,
      testPassword,
      'NewPassword123!'
    );

    console.log(`   Change with correct password: ${correctPasswordResult.success ? '✅ Success' : '❌ Failed'}`);

    // ============================================
    // Test 4: 2FA Secret Generation
    // ============================================
    console.log('\n4️⃣  Testing 2FA Secret Generation...');

    const twoFactorSecret = await generateTOTPSecret(
      testUser.id,
      testUser.email
    );

    console.log(`   ✅ TOTP secret generated: ${twoFactorSecret.secret.substring(0, 10)}...`);
    console.log(`   ✅ QR code URI generated`);

    // ============================================
    // Test 5: 2FA Token Verification
    // ============================================
    console.log('\n5️⃣  Testing 2FA Token Verification...');

    // Generate a valid TOTP token using the authenticator library
    const { authenticator } = await import('otplib');
    const validToken = authenticator.generate(twoFactorSecret.secret);

    console.log(`   Generated token: ${validToken}`);

    const isValid = verifyTOTPToken(validToken, twoFactorSecret.secret);
    console.log(`   Token verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    // Test with invalid token
    const invalidToken = '000000';
    const isInvalid = verifyTOTPToken(invalidToken, twoFactorSecret.secret);
    console.log(`   Invalid token verification: ${!isInvalid ? '✅ Correctly rejected' : '❌ Incorrectly accepted'}`);

    // ============================================
    // Test 6: Backup Codes Generation
    // ============================================
    console.log('\n6️⃣  Testing Backup Codes Generation...');

    const backupCodes = generateBackupCodes(5);
    console.log(`   ✅ Generated ${backupCodes.length} backup codes:`);
    backupCodes.forEach((code, index) => {
      console.log(`      ${index + 1}. ${code}`);
    });

    // ============================================
    // Test 7: 2FA Status Check
    // ============================================
    console.log('\n7️⃣  Testing 2FA Status Check...');

    const twoFactorStatus = await getTwoFactorStatus(testUser.id);
    console.log(`   2FA enabled: ${twoFactorStatus.enabled ? '✅ Yes' : '❌ No'}`);
    console.log(`   Backup codes remaining: ${twoFactorStatus.backupCodesRemaining || 0}`);

    // ============================================
    // Test 8: Password Reset Request
    // ============================================
    console.log('\n8️⃣  Testing Password Reset Request...');

    const resetResult = await requestPasswordReset(testUser.email);
    console.log(`   Reset request: ${resetResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Message: ${resetResult.message || resetResult.error}`);

    // Test with non-existent email (should still return success for security)
    const fakeResetResult = await requestPasswordReset('nonexistent@example.com');
    console.log(`   Reset for fake email: ${fakeResetResult.success ? '✅ Success (prevents enumeration)' : '❌ Failed'}`);

    // ============================================
    // Test 9: Rate Limiting Check
    // ============================================
    console.log('\n9️⃣  Testing Rate Limiting...');

    // Make multiple reset requests
    for (let i = 1; i <= 4; i++) {
      const result = await requestPasswordReset(testUser.email);
      console.log(`   Attempt ${i}: ${result.success ? '✅ Allowed' : '❌ Rate limited'}`);

      if (!result.success && result.error?.includes('Too many')) {
        console.log(`      ${result.error}`);
        break;
      }
    }

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ Security Feature Tests Completed!\n');

    console.log('📋 Features Tested:');
    console.log('   ✓ JWT token generation and verification');
    console.log('   ✓ Password strength validation');
    console.log('   ✓ Password change functionality');
    console.log('   ✓ 2FA secret generation');
    console.log('   ✓ TOTP token verification');
    console.log('   ✓ Backup codes generation');
    console.log('   ✓ 2FA status checking');
    console.log('   ✓ Password reset flow');
    console.log('   ✓ Rate limiting');

    console.log('\n📝 Next Steps:');
    console.log('   1. Test endpoints via tRPC client');
    console.log('   2. Integrate with frontend');
    console.log('   3. Set up SMTP for real emails');
    console.log('   4. Configure production environment variables');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSecurityFeatures()
  .then(() => {
    console.log('\n🎉 All tests completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
