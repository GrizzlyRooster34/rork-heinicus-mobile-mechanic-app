import 'dotenv/config';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test 1: Check connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test 2: Count existing users
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}\n`);

    // Test 3: Create test user if not exists
    const testEmail = 'matthew.heinen.2014@gmail.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (existingUser) {
      console.log(`✅ Test user already exists: ${existingUser.email}`);
      console.log(`   - ID: ${existingUser.id}`);
      console.log(`   - Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   - Role: ${existingUser.role}\n`);
    } else {
      console.log('➕ Creating test admin user...');
      const passwordHash = await bcrypt.hash('RoosTer669072!@', 10);

      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          firstName: 'Matthew',
          lastName: 'Heinen',
          role: 'ADMIN',
          passwordHash,
          status: 'ACTIVE',
        }
      });

      console.log(`✅ Test user created successfully!`);
      console.log(`   - ID: ${newUser.id}`);
      console.log(`   - Email: ${newUser.email}`);
      console.log(`   - Name: ${newUser.firstName} ${newUser.lastName}`);
      console.log(`   - Role: ${newUser.role}\n`);
    }

    // Test 4: Create test mechanic user
    const mechanicEmail = 'cody@heinicus.com';
    const existingMechanic = await prisma.user.findUnique({
      where: { email: mechanicEmail }
    });

    if (!existingMechanic) {
      console.log('➕ Creating test mechanic user...');
      const passwordHash = await bcrypt.hash('RoosTer669072!@', 10);

      const newMechanic = await prisma.user.create({
        data: {
          email: mechanicEmail,
          firstName: 'Cody',
          lastName: 'Mechanic',
          role: 'MECHANIC',
          passwordHash,
          status: 'ACTIVE',
        }
      });

      console.log(`✅ Test mechanic created successfully!`);
      console.log(`   - ID: ${newMechanic.id}`);
      console.log(`   - Email: ${newMechanic.email}`);
      console.log(`   - Role: ${newMechanic.role}\n`);
    } else {
      console.log(`✅ Test mechanic already exists: ${existingMechanic.email}\n`);
    }

    // Test 5: List all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📋 All users in database (${allUsers.length} total):`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`      Role: ${user.role}, Status: ${user.status}`);
    });

    console.log('\n✅ All database tests passed!\n');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase()
  .then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to test database:', error);
    process.exit(1);
  });
