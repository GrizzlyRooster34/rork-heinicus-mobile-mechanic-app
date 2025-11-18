import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash the production password
  const passwordHash = await bcrypt.hash('RoosTer669072!@', 10);

  // Create admin user (matthew.heinen.2014@gmail.com)
  const admin = await prisma.user.upsert({
    where: { email: 'matthew.heinen.2014@gmail.com' },
    update: {},
    create: {
      email: 'matthew.heinen.2014@gmail.com',
      passwordHash,
      firstName: 'Cody',
      lastName: 'Owner',
      role: 'ADMIN',
      phone: '(555) 987-6543',
      isActive: true,
    },
  });

  console.log('Created/Updated admin user:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  // Create mechanic user (cody@heinicus.com)
  const mechanic = await prisma.user.upsert({
    where: { email: 'cody@heinicus.com' },
    update: {},
    create: {
      email: 'cody@heinicus.com',
      passwordHash,
      firstName: 'Cody',
      lastName: 'Mechanic',
      role: 'MECHANIC',
      phone: '(555) 987-6543',
      isActive: true,
    },
  });

  console.log('Created/Updated mechanic user:', {
    id: mechanic.id,
    email: mechanic.email,
    role: mechanic.role,
  });

  // Create demo customer user (customer@example.com)
  const demoPasswordHash = await bcrypt.hash('password123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Customer',
      role: 'CUSTOMER',
      phone: '(555) 123-4567',
      isActive: true,
    },
  });

  console.log('Created/Updated demo customer user:', {
    id: customer.id,
    email: customer.email,
    role: customer.role,
  });

  console.log('Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
