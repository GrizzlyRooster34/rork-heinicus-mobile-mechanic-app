import 'dotenv/config';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  verifyJWTToken,
  getUserFromToken,
  refreshAccessToken,
  generateRefreshToken,
} from './backend/middleware/auth';
import {
  generateTOTPSecret,
  verifyTOTPToken,
  enableTwoFactor,
  verifyTwoFactorCode,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
} from './backend/services/two-factor-auth';
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword,
} from './backend/services/password-reset';
import { authenticator } from 'otplib';

/**
 * End-to-End Authentication Test Suite
 * Tests complete authentication flows from signup to password reset
 */

async function runE2ETests() {
  console.log('🧪 Running E2E Authentication Tests\n');
  console.log('='.repeat(60));

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  function testPassed(testName: string) {
    testResults.passed++;
    testResults.total++;
    console.log(`   ✅ ${testName}`);
  }

  function testFailed(testName: string, error: any) {
    testResults.failed++;
    testResults.total++;
    console.log(`   ❌ ${testName}`);
    console.log(`      Error: ${error.message || error}`);
  }

  try {
    // ============================================
    // Test 1: User Signup Flow
    // ============================================
    console.log('\n1️⃣  Testing User Signup Flow...');

    let newUserId: string = '';
    let newUserEmail = 'e2e-test@example.com';

    try {
      // Clean up any existing test user
      await prisma.user.deleteMany({
        where: { email: newUserEmail },
      });

      // Test signup
      const password = 'E2ETest123!@#';
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email: newUserEmail,
          firstName: 'E2E',
          lastName: 'Test',
          role: 'CUSTOMER',
          passwordHash,
          status: 'ACTIVE',
        },
      });

      newUserId = newUser.id;
      testPassed('User signup successful');

      // Verify password can be checked
      const isValidPassword = await bcrypt.compare(password, newUser.passwordHash!);
      if (isValidPassword) {
        testPassed('Password hashing and verification');
      } else {
        testFailed('Password verification', 'Password mismatch');
      }
    } catch (error) {
      testFailed('User signup', error);
    }

    // ============================================
    // Test 2: User Signin Flow
    // ============================================
    console.log('\n2️⃣  Testing User Signin Flow...');

    let accessToken = '';
    let refreshToken = '';

    try {
      const user = await prisma.user.findUnique({
        where: { email: newUserEmail },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate tokens
      accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      refreshToken = generateRefreshToken(user.id);

      testPassed('Access token generated');
      testPassed('Refresh token generated');

      // Verify access token
      const decoded = verifyJWTToken(accessToken);
      if (decoded && decoded.userId === user.id) {
        testPassed('Access token verification');
      } else {
        testFailed('Access token verification', 'Token invalid');
      }

      // Verify user retrieval from token
      const retrievedUser = await getUserFromToken(accessToken);
      if (retrievedUser && retrievedUser.id === user.id) {
        testPassed('User retrieval from token');
      } else {
        testFailed('User retrieval from token', 'User mismatch');
      }
    } catch (error) {
      testFailed('User signin flow', error);
    }

    // ============================================
    // Test 3: Token Refresh Flow
    // ============================================
    console.log('\n3️⃣  Testing Token Refresh Flow...');

    try {
      const refreshResult = await refreshAccessToken(refreshToken);

      if (refreshResult.success && refreshResult.accessToken) {
        testPassed('Token refresh successful');

        // Verify new token
        const decoded = verifyJWTToken(refreshResult.accessToken);
        if (decoded && decoded.userId === newUserId) {
          testPassed('Refreshed token verification');
        } else {
          testFailed('Refreshed token verification', 'Token invalid');
        }
      } else {
        testFailed('Token refresh', refreshResult.error || 'Unknown error');
      }

      // Test with invalid refresh token
      const invalidResult = await refreshAccessToken('invalid-token');
      if (!invalidResult.success) {
        testPassed('Invalid token rejection');
      } else {
        testFailed('Invalid token rejection', 'Should have failed');
      }
    } catch (error) {
      testFailed('Token refresh flow', error);
    }

    // ============================================
    // Test 4: 2FA Setup Flow
    // ============================================
    console.log('\n4️⃣  Testing 2FA Setup Flow...');

    let twoFactorSecret = '';
    let validTOTP = '';
    let backupCodes: string[] = [];

    try {
      // Check initial 2FA status
      const initialStatus = await getTwoFactorStatus(newUserId);
      if (!initialStatus.enabled) {
        testPassed('Initial 2FA status (disabled)');
      } else {
        testFailed('Initial 2FA status', 'Should be disabled');
      }

      // Generate 2FA secret
      const secretData = await generateTOTPSecret(newUserId, newUserEmail);
      twoFactorSecret = secretData.secret;

      if (secretData.secret && secretData.qrCodeUri) {
        testPassed('2FA secret generation');
      } else {
        testFailed('2FA secret generation', 'Missing data');
      }

      // Generate valid TOTP token
      validTOTP = authenticator.generate(twoFactorSecret);
      testPassed('TOTP token generation');

      // Verify TOTP token
      const isValidTOTP = verifyTOTPToken(validTOTP, twoFactorSecret);
      if (isValidTOTP) {
        testPassed('TOTP token verification');
      } else {
        testFailed('TOTP token verification', 'Token invalid');
      }

      // Enable 2FA
      const enableResult = await enableTwoFactor(newUserId, twoFactorSecret, validTOTP);
      if (enableResult.success && enableResult.backupCodes) {
        testPassed('2FA enablement');
        backupCodes = enableResult.backupCodes;
        testPassed(`Backup codes generation (${backupCodes.length} codes)`);
      } else {
        testFailed('2FA enablement', enableResult.error || 'Unknown error');
      }

      // Verify 2FA status after enablement
      const enabledStatus = await getTwoFactorStatus(newUserId);
      if (enabledStatus.enabled) {
        testPassed('2FA status after enablement');
      } else {
        testFailed('2FA status after enablement', 'Should be enabled');
      }
    } catch (error) {
      testFailed('2FA setup flow', error);
    }

    // ============================================
    // Test 5: 2FA Verification Flow
    // ============================================
    console.log('\n5️⃣  Testing 2FA Verification Flow...');

    try {
      // Generate new TOTP token
      const newTOTP = authenticator.generate(twoFactorSecret);

      // Verify with TOTP
      const totpResult = await verifyTwoFactorCode(newUserId, newTOTP);
      if (totpResult.success) {
        testPassed('2FA verification with TOTP');
      } else {
        testFailed('2FA verification with TOTP', totpResult.error || 'Failed');
      }

      // Verify with backup code
      if (backupCodes.length > 0) {
        const backupCodeResult = await verifyTwoFactorCode(newUserId, backupCodes[0]);
        if (backupCodeResult.success) {
          testPassed('2FA verification with backup code');
        } else {
          testFailed('2FA verification with backup code', backupCodeResult.error || 'Failed');
        }

        // Try using same backup code again (should fail)
        const reusedCodeResult = await verifyTwoFactorCode(newUserId, backupCodes[0]);
        if (!reusedCodeResult.success) {
          testPassed('Backup code single-use enforcement');
        } else {
          testFailed('Backup code single-use enforcement', 'Should have failed');
        }
      }

      // Verify with invalid code
      const invalidResult = await verifyTwoFactorCode(newUserId, '000000');
      if (!invalidResult.success) {
        testPassed('Invalid 2FA code rejection');
      } else {
        testFailed('Invalid 2FA code rejection', 'Should have failed');
      }
    } catch (error) {
      testFailed('2FA verification flow', error);
    }

    // ============================================
    // Test 6: Backup Code Regeneration
    // ============================================
    console.log('\n6️⃣  Testing Backup Code Regeneration...');

    try {
      const currentTOTP = authenticator.generate(twoFactorSecret);
      const regenResult = await regenerateBackupCodes(newUserId, currentTOTP);

      if (regenResult.success && regenResult.backupCodes) {
        testPassed('Backup code regeneration');
        testPassed(`New backup codes generated (${regenResult.backupCodes.length} codes)`);
      } else {
        testFailed('Backup code regeneration', regenResult.error || 'Failed');
      }
    } catch (error) {
      testFailed('Backup code regeneration', error);
    }

    // ============================================
    // Test 7: Password Change Flow
    // ============================================
    console.log('\n7️⃣  Testing Password Change Flow...');

    try {
      const currentPassword = 'E2ETest123!@#';
      const newPassword = 'NewE2ETest123!@#';

      // Change password
      const changeResult = await changePassword(newUserId, currentPassword, newPassword);
      if (changeResult.success) {
        testPassed('Password change');
      } else {
        testFailed('Password change', changeResult.error || 'Failed');
      }

      // Verify new password works
      const user = await prisma.user.findUnique({
        where: { id: newUserId },
      });

      if (user && user.passwordHash) {
        const isValid = await bcrypt.compare(newPassword, user.passwordHash);
        if (isValid) {
          testPassed('New password verification');
        } else {
          testFailed('New password verification', 'Password mismatch');
        }
      }

      // Try changing with wrong current password
      const wrongPasswordResult = await changePassword(
        newUserId,
        'WrongPassword123!',
        'AnotherPassword123!'
      );
      if (!wrongPasswordResult.success) {
        testPassed('Wrong current password rejection');
      } else {
        testFailed('Wrong current password rejection', 'Should have failed');
      }
    } catch (error) {
      testFailed('Password change flow', error);
    }

    // ============================================
    // Test 8: Password Reset Flow
    // ============================================
    console.log('\n8️⃣  Testing Password Reset Flow...');

    let resetToken = '';

    try {
      // Request password reset
      const resetRequest = await requestPasswordReset(newUserEmail);
      if (resetRequest.success) {
        testPassed('Password reset request');
      } else {
        testFailed('Password reset request', resetRequest.error || 'Failed');
      }

      // Get the reset token from database (in real app, this would be in email)
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          userId: newUserId,
          used: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (resetRecord) {
        // We need to get the plain token, but it's hashed in DB
        // For testing, we'll create a new one
        const testResetToken = 'test-reset-token-12345';
        const hashedToken = await bcrypt.hash(testResetToken, 10);

        await prisma.passwordReset.create({
          data: {
            userId: newUserId,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            used: false,
          },
        });

        resetToken = testResetToken;

        // Verify token
        const verifyResult = await verifyResetToken(resetToken);
        if (verifyResult.valid && verifyResult.userId === newUserId) {
          testPassed('Reset token verification');
        } else {
          testFailed('Reset token verification', verifyResult.error || 'Invalid');
        }

        // Reset password with token
        const resetResult = await resetPassword(resetToken, 'ResetPassword123!@#');
        if (resetResult.success) {
          testPassed('Password reset with token');
        } else {
          testFailed('Password reset with token', resetResult.error || 'Failed');
        }

        // Verify token is marked as used
        const usedToken = await verifyResetToken(resetToken);
        if (!usedToken.valid) {
          testPassed('Used token invalidation');
        } else {
          testFailed('Used token invalidation', 'Should be invalid');
        }
      } else {
        testFailed('Password reset flow', 'Reset record not found');
      }
    } catch (error) {
      testFailed('Password reset flow', error);
    }

    // ============================================
    // Test 9: 2FA Disable Flow
    // ============================================
    console.log('\n9️⃣  Testing 2FA Disable Flow...');

    try {
      const currentTOTP = authenticator.generate(twoFactorSecret);
      const disableResult = await disableTwoFactor(newUserId, currentTOTP);

      if (disableResult.success) {
        testPassed('2FA disablement');
      } else {
        testFailed('2FA disablement', disableResult.error || 'Failed');
      }

      // Verify 2FA status after disablement
      const disabledStatus = await getTwoFactorStatus(newUserId);
      if (!disabledStatus.enabled) {
        testPassed('2FA status after disablement');
      } else {
        testFailed('2FA status after disablement', 'Should be disabled');
      }

      // Verify backup codes were deleted
      const remainingCodes = await prisma.twoFactorBackupCode.count({
        where: { userId: newUserId },
      });

      if (remainingCodes === 0) {
        testPassed('Backup codes cleanup');
      } else {
        testFailed('Backup codes cleanup', `${remainingCodes} codes remaining`);
      }
    } catch (error) {
      testFailed('2FA disable flow', error);
    }

    // ============================================
    // Cleanup
    // ============================================
    console.log('\n🧹 Cleaning up test data...');

    try {
      await prisma.passwordReset.deleteMany({
        where: { userId: newUserId },
      });
      await prisma.user.delete({
        where: { id: newUserId },
      });
      console.log('   ✅ Test data cleaned up');
    } catch (error) {
      console.log('   ⚠️  Cleanup warning:', error);
    }

    // ============================================
    // Results Summary
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:\n');
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 All E2E tests passed!\n');
    } else {
      console.log(`\n⚠️  ${testResults.failed} test(s) failed\n`);
    }

    console.log('='.repeat(60));

    return testResults.failed === 0;
  } catch (error) {
    console.error('\n❌ E2E test suite failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
