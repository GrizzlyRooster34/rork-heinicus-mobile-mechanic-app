import { PrismaClient, UserRole, JobStatus, UrgencyLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Admin User
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@heinicus.com' },
    update: {},
    create: {
      email: 'admin@heinicus.com',
      passwordHash: adminPasswordHash,
      firstName: 'Matthew',
      lastName: 'Heinen',
      role: UserRole.ADMIN,
      phone: '555-0100',
      address: 'Admin HQ',
      isActive: true,
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // 2. Create Mechanic User
  const mechanicPasswordHash = await bcrypt.hash('Mechanic123!', 10);
  const mechanic = await prisma.user.upsert({
    where: { email: 'mechanic@heinicus.com' },
    update: {},
    create: {
      email: 'mechanic@heinicus.com',
      passwordHash: mechanicPasswordHash,
      firstName: 'John',
      lastName: 'Mechanic',
      role: UserRole.MECHANIC,
      phone: '555-0101',
      address: 'Mechanic Garage',
      isActive: true,
    },
  });
  console.log(`✅ Created mechanic: ${mechanic.email}`);

  // 3. Create Customer User
  const customerPasswordHash = await bcrypt.hash('Customer123!', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      phone: '555-0102',
      address: '456 Customer Lane',
      isActive: true,
    },
  });
  console.log(`✅ Created customer: ${customer.email}`);

  // 4. Create Services
  const services = [
    {
      name: 'Full Synthetic Oil Change',
      category: 'Maintenance',
      description: 'Replace oil and filter with high-quality synthetic oil.',
      basePrice: 85.0,
      estimatedTime: 45,
    },
    {
      name: 'Brake Pad Replacement (Front)',
      category: 'Brakes',
      description: 'Replace front brake pads with OEM or better quality pads.',
      basePrice: 150.0,
      estimatedTime: 90,
    },
    {
      name: 'Diagnostic Scan & Inspection',
      category: 'Diagnostics',
      description: 'Full vehicle scan and multi-point inspection.',
      basePrice: 50.0,
      estimatedTime: 30,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }
  console.log('✅ Created initial services');

  // 5. Create a test vehicle for the customer
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: customer.id,
      make: 'Volkswagen',
      model: 'Passat B6',
      year: 2008,
      vin: 'WVWZZZ3CZ8P000000',
      mileage: 276000,
    },
  });
  console.log(`✅ Created test vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);

  // 6. Create an initial job request
  const job = await prisma.job.create({
    data: {
      customerId: customer.id,
      serviceType: 'Diagnostic Scan & Inspection',
      description: 'Check engine light is on, G28 and G70 codes detected.',
      status: JobStatus.PENDING,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleVin: vehicle.vin,
      address: customer.address || '456 Customer Lane',
    },
  });
  console.log(`✅ Created initial job request: ${job.id}`);

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });