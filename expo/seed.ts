import 'dotenv/config';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Seed Script for Heinicus Mobile Mechanic App
 * Populates database with initial data for testing and development
 */

async function seedDatabase() {
  console.log('🌱 Seeding Database...\n');
  console.log('='.repeat(60));

  try {
    // ============================================
    // 1. Seed Services
    // ============================================
    console.log('\n📋 Seeding Services...');

    const services = [
      {
        name: 'Oil Change',
        description: 'Complete oil and filter change service with synthetic or conventional oil',
        category: 'MAINTENANCE',
        basePrice: 49.99,
        estimatedTime: 30,
      },
      {
        name: 'Brake Inspection',
        description: 'Comprehensive brake system inspection including pads, rotors, and fluid',
        category: 'INSPECTION',
        basePrice: 39.99,
        estimatedTime: 45,
      },
      {
        name: 'Brake Pad Replacement',
        description: 'Replace front or rear brake pads including hardware',
        category: 'REPAIR',
        basePrice: 149.99,
        estimatedTime: 90,
      },
      {
        name: 'Tire Rotation',
        description: 'Rotate all four tires and check tire pressure',
        category: 'MAINTENANCE',
        basePrice: 29.99,
        estimatedTime: 30,
      },
      {
        name: 'Battery Test & Replacement',
        description: 'Test battery health and replace if necessary',
        category: 'DIAGNOSTIC',
        basePrice: 89.99,
        estimatedTime: 45,
      },
      {
        name: 'Engine Diagnostic',
        description: 'Full engine diagnostic scan with OBD-II scanner',
        category: 'DIAGNOSTIC',
        basePrice: 79.99,
        estimatedTime: 60,
      },
      {
        name: 'Air Filter Replacement',
        description: 'Replace engine air filter',
        category: 'MAINTENANCE',
        basePrice: 34.99,
        estimatedTime: 15,
      },
      {
        name: 'Coolant Flush',
        description: 'Complete coolant system flush and refill',
        category: 'MAINTENANCE',
        basePrice: 89.99,
        estimatedTime: 60,
      },
      {
        name: 'Transmission Service',
        description: 'Transmission fluid change and filter replacement',
        category: 'MAINTENANCE',
        basePrice: 179.99,
        estimatedTime: 90,
      },
      {
        name: 'Alternator Replacement',
        description: 'Replace alternator and test charging system',
        category: 'REPAIR',
        basePrice: 299.99,
        estimatedTime: 120,
      },
      {
        name: 'Starter Motor Replacement',
        description: 'Replace starter motor',
        category: 'REPAIR',
        basePrice: 249.99,
        estimatedTime: 90,
      },
      {
        name: 'Windshield Wiper Replacement',
        description: 'Replace front windshield wiper blades',
        category: 'MAINTENANCE',
        basePrice: 24.99,
        estimatedTime: 15,
      },
      {
        name: 'Headlight Restoration',
        description: 'Restore cloudy or yellowed headlights',
        category: 'MAINTENANCE',
        basePrice: 69.99,
        estimatedTime: 45,
      },
      {
        name: 'AC System Recharge',
        description: 'Recharge AC system with refrigerant',
        category: 'MAINTENANCE',
        basePrice: 129.99,
        estimatedTime: 60,
      },
      {
        name: 'Suspension Inspection',
        description: 'Inspect shocks, struts, and suspension components',
        category: 'INSPECTION',
        basePrice: 49.99,
        estimatedTime: 45,
      },
      {
        name: 'Emergency Roadside Assistance',
        description: 'Jump start, tire change, fuel delivery, or lockout service',
        category: 'EMERGENCY',
        basePrice: 59.99,
        estimatedTime: 30,
      },
    ];

    for (const service of services) {
      await prisma.service.upsert({
        where: { name: service.name },
        update: service,
        create: service,
      });
    }

    console.log(`   ✅ Created/updated ${services.length} services`);

    // ============================================
    // 2. Seed Test Users
    // ============================================
    console.log('\n👥 Seeding Test Users...');

    const password = 'TestPassword123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Create test customers
    const customers = [
      {
        email: 'customer1@example.com',
        firstName: 'John',
        lastName: 'Smith',
        phone: '555-0101',
        address: '123 Main St, Springfield, IL 62701',
        role: 'CUSTOMER',
      },
      {
        email: 'customer2@example.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '555-0102',
        address: '456 Oak Ave, Springfield, IL 62702',
        role: 'CUSTOMER',
      },
      {
        email: 'customer3@example.com',
        firstName: 'Michael',
        lastName: 'Williams',
        phone: '555-0103',
        address: '789 Pine Dr, Springfield, IL 62703',
        role: 'CUSTOMER',
      },
    ];

    for (const customer of customers) {
      await prisma.user.upsert({
        where: { email: customer.email },
        update: customer,
        create: { ...customer, passwordHash, status: 'ACTIVE' },
      });
    }

    console.log(`   ✅ Created/updated ${customers.length} test customers`);

    // Create test mechanics
    const mechanics = [
      {
        email: 'mechanic1@heinicus.com',
        firstName: 'Mike',
        lastName: 'Anderson',
        phone: '555-0201',
        address: '100 Mechanic Way, Springfield, IL 62704',
        role: 'MECHANIC',
      },
      {
        email: 'mechanic2@heinicus.com',
        firstName: 'David',
        lastName: 'Brown',
        phone: '555-0202',
        address: '200 Service Ln, Springfield, IL 62705',
        role: 'MECHANIC',
      },
    ];

    for (const mechanic of mechanics) {
      await prisma.user.upsert({
        where: { email: mechanic.email },
        update: mechanic,
        create: { ...mechanic, passwordHash, status: 'ACTIVE' },
      });
    }

    console.log(`   ✅ Created/updated ${mechanics.length} test mechanics`);
    console.log(`   📝 All test users have password: ${password}`);

    // ============================================
    // 3. Seed Vehicles
    // ============================================
    console.log('\n🚗 Seeding Vehicles...');

    const customer1 = await prisma.user.findUnique({
      where: { email: 'customer1@example.com' },
    });

    const customer2 = await prisma.user.findUnique({
      where: { email: 'customer2@example.com' },
    });

    const customer3 = await prisma.user.findUnique({
      where: { email: 'customer3@example.com' },
    });

    if (customer1 && customer2 && customer3) {
      const vehicles = [
        {
          customerId: customer1.id,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          vin: '4T1BF1FK5CU123456',
          licensePlate: 'ABC-1234',
          color: 'Silver',
        },
        {
          customerId: customer1.id,
          make: 'Honda',
          model: 'CR-V',
          year: 2019,
          vin: '2HKRM4H75FH123456',
          licensePlate: 'XYZ-5678',
          color: 'Blue',
        },
        {
          customerId: customer2.id,
          make: 'Ford',
          model: 'F-150',
          year: 2021,
          vin: '1FTFW1E84MFA12345',
          licensePlate: 'TRK-9012',
          color: 'Black',
        },
        {
          customerId: customer3.id,
          make: 'Chevrolet',
          model: 'Malibu',
          year: 2018,
          vin: '1G1ZE5ST5JF123456',
          licensePlate: 'CHV-3456',
          color: 'White',
        },
      ];

      for (const vehicle of vehicles) {
        await prisma.vehicle.upsert({
          where: { vin: vehicle.vin },
          update: vehicle,
          create: vehicle,
        });
      }

      console.log(`   ✅ Created/updated ${vehicles.length} vehicles`);
    }

    // ============================================
    // 4. Seed Jobs
    // ============================================
    console.log('\n💼 Seeding Jobs...');

    const mechanic1 = await prisma.user.findUnique({
      where: { email: 'mechanic1@heinicus.com' },
    });

    const oilChangeService = await prisma.service.findFirst({
      where: { name: 'Oil Change' },
    });

    const brakeService = await prisma.service.findFirst({
      where: { name: 'Brake Pad Replacement' },
    });

    const diagnosticService = await prisma.service.findFirst({
      where: { name: 'Engine Diagnostic' },
    });

    const vehicle1 = await prisma.vehicle.findFirst({
      where: { vin: '4T1BF1FK5CU123456' },
    });

    const vehicle2 = await prisma.vehicle.findFirst({
      where: { vin: '2HKRM4H75FH123456' },
    });

    if (customer1 && customer2 && mechanic1 && vehicle1 && vehicle2 && oilChangeService && brakeService && diagnosticService) {
      const jobs = [
        {
          title: 'Regular Oil Change',
          description: 'Need a standard oil change with synthetic oil',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          location: '123 Main St, Springfield, IL 62701',
          latitude: 39.7817,
          longitude: -89.6501,
          customerId: customer1.id,
          mechanicId: mechanic1.id,
          vehicleId: vehicle1.id,
          scheduledAt: new Date('2025-11-05T10:00:00'),
          startedAt: new Date('2025-11-05T10:15:00'),
          completedAt: new Date('2025-11-05T10:45:00'),
        },
        {
          title: 'Brake Pad Replacement - Front',
          description: 'Hearing squeaking noise when braking, need front brake pads replaced',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          location: '123 Main St, Springfield, IL 62701',
          latitude: 39.7817,
          longitude: -89.6501,
          customerId: customer1.id,
          mechanicId: mechanic1.id,
          vehicleId: vehicle2.id,
          scheduledAt: new Date('2025-11-12T14:00:00'),
          startedAt: new Date('2025-11-12T14:10:00'),
        },
        {
          title: 'Check Engine Light Diagnostic',
          description: 'Check engine light came on yesterday, need diagnostic',
          status: 'ACCEPTED',
          priority: 'MEDIUM',
          location: '456 Oak Ave, Springfield, IL 62702',
          latitude: 39.7850,
          longitude: -89.6550,
          customerId: customer2.id,
          mechanicId: mechanic1.id,
          scheduledAt: new Date('2025-11-13T09:00:00'),
        },
        {
          title: 'Tire Rotation and Balance',
          description: 'Need tire rotation and balancing service',
          status: 'QUOTED',
          priority: 'LOW',
          location: '789 Pine Dr, Springfield, IL 62703',
          latitude: 39.7900,
          longitude: -89.6600,
          customerId: customer3.id,
        },
        {
          title: 'Emergency - Car Won\'t Start',
          description: 'Car won\'t start, may need battery or starter',
          status: 'PENDING',
          priority: 'URGENT',
          location: '456 Oak Ave, Springfield, IL 62702',
          latitude: 39.7850,
          longitude: -89.6550,
          customerId: customer2.id,
        },
      ];

      for (const job of jobs) {
        const createdJob = await prisma.job.create({
          data: job,
        });

        // Link services to jobs
        if (job.title.includes('Oil Change') && oilChangeService) {
          await prisma.job.update({
            where: { id: createdJob.id },
            data: {
              services: {
                connect: { id: oilChangeService.id },
              },
            },
          });
        }

        if (job.title.includes('Brake') && brakeService) {
          await prisma.job.update({
            where: { id: createdJob.id },
            data: {
              services: {
                connect: { id: brakeService.id },
              },
            },
          });
        }

        if (job.title.includes('Diagnostic') && diagnosticService) {
          await prisma.job.update({
            where: { id: createdJob.id },
            data: {
              services: {
                connect: { id: diagnosticService.id },
              },
            },
          });
        }
      }

      console.log(`   ✅ Created ${jobs.length} jobs`);

      // ============================================
      // 5. Seed Quotes
      // ============================================
      console.log('\n💰 Seeding Quotes...');

      const completedJob = await prisma.job.findFirst({
        where: { title: 'Regular Oil Change' },
      });

      const inProgressJob = await prisma.job.findFirst({
        where: { title: 'Brake Pad Replacement - Front' },
      });

      const quotedJob = await prisma.job.findFirst({
        where: { title: 'Tire Rotation and Balance' },
      });

      const quotes = [];

      if (completedJob && customer1) {
        quotes.push({
          jobId: completedJob.id,
          customerId: customer1.id,
          amount: 54.99,
          currency: 'USD',
          description: 'Oil change with synthetic oil (5W-30)',
          status: 'ACCEPTED',
          validUntil: new Date('2025-11-10T23:59:59'),
        });
      }

      if (inProgressJob && customer1) {
        quotes.push({
          jobId: inProgressJob.id,
          customerId: customer1.id,
          amount: 189.99,
          currency: 'USD',
          description: 'Front brake pad replacement including hardware and labor',
          status: 'ACCEPTED',
          validUntil: new Date('2025-11-15T23:59:59'),
        });
      }

      if (quotedJob && customer3) {
        quotes.push({
          jobId: quotedJob.id,
          customerId: customer3.id,
          amount: 79.99,
          currency: 'USD',
          description: 'Tire rotation and balance for all 4 tires',
          status: 'PENDING',
          validUntil: new Date('2025-11-18T23:59:59'),
        });
      }

      for (const quote of quotes) {
        await prisma.quote.create({ data: quote });
      }

      console.log(`   ✅ Created ${quotes.length} quotes`);
    }

    // ============================================
    // 6. Display Summary
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 Database Summary:\n');

    const counts = {
      users: await prisma.user.count(),
      services: await prisma.service.count(),
      vehicles: await prisma.vehicle.count(),
      jobs: await prisma.job.count(),
      quotes: await prisma.quote.count(),
    };

    console.log(`   Users:     ${counts.users} (2 existing + 5 new)`);
    console.log(`   Services:  ${counts.services}`);
    console.log(`   Vehicles:  ${counts.vehicles}`);
    console.log(`   Jobs:      ${counts.jobs}`);
    console.log(`   Quotes:    ${counts.quotes}`);

    console.log('\n✅ Database seeding completed successfully!\n');

    // ============================================
    // 7. Display Test Credentials
    // ============================================
    console.log('='.repeat(60));
    console.log('🔑 Test Credentials:\n');

    console.log('Admin Users:');
    console.log('   matthew.heinen.2014@gmail.com / RoosTer669072!@');
    console.log('   cody@heinicus.com / RoosTer669072!@');

    console.log('\nCustomers:');
    console.log('   customer1@example.com / TestPassword123!');
    console.log('   customer2@example.com / TestPassword123!');
    console.log('   customer3@example.com / TestPassword123!');

    console.log('\nMechanics:');
    console.log('   mechanic1@heinicus.com / TestPassword123!');
    console.log('   mechanic2@heinicus.com / TestPassword123!');

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase()
  .then(() => {
    console.log('🎉 Seeding complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
