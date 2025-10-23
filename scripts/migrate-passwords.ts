/**
 * Password Migration Script
 * Converts all plain text passwords to bcrypt hashes
 * Run this once after implementing bcrypt authentication
 */

import { mobileDB } from '@/lib/mobile-database';
import { hashPassword, isBcryptHash } from '@/utils/password';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERS: '@heinicus/users',
};

interface StoredUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  createdAt: string;
  isActive?: boolean;
}

async function migratePasswords() {
  console.log('🔄 Starting password migration to bcrypt...');

  try {
    // Get all users
    const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);

    if (!usersJson) {
      console.log('❌ No users found in database');
      return;
    }

    const users: StoredUser[] = JSON.parse(usersJson);
    console.log(`📊 Found ${users.length} users`);

    let migratedCount = 0;
    let alreadyHashedCount = 0;

    // Migrate each user's password
    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        // Check if password is already hashed
        if (isBcryptHash(user.password)) {
          console.log(`✓ User ${user.email} already has bcrypt password`);
          alreadyHashedCount++;
          return user;
        }

        // Hash the plain text password
        console.log(`🔄 Migrating password for ${user.email}...`);
        const hashedPassword = await hashPassword(user.password);
        migratedCount++;

        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    // Save updated users
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

    console.log('✅ Password migration complete!');
    console.log(`   - ${migratedCount} passwords migrated to bcrypt`);
    console.log(`   - ${alreadyHashedCount} passwords already hashed`);
    console.log(`   - ${users.length} total users`);

    return {
      success: true,
      migratedCount,
      alreadyHashedCount,
      totalUsers: users.length,
    };
  } catch (error) {
    console.error('❌ Password migration failed:', error);
    throw error;
  }
}

// Export for use in other scripts
export { migratePasswords };

// Run directly if executed as script
if (require.main === module) {
  migratePasswords()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}
