import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clear existing data (be careful in production!)
  console.log('Clearing existing data...');
  await prisma.jobTimeline.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.mechanicVerification.deleteMany();
  await prisma.mechanicProfile.deleteMany();
  await prisma.pricingProfile.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.notificationPref.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      firstName: 'Matthew',
      lastName: 'Heinen',
      email: 'matthew.heinen.2014@gmail.com',
      phone: '(555) 100-0001',
      address: '123 Admin St, Portland, OR 97201',
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create mechanics with full profiles
  console.log('Creating mechanics...');
  const mechanic1 = await prisma.user.create({
    data: {
      role: UserRole.MECHANIC,
      firstName: 'Cody',
      lastName: 'Johnson',
      email: 'cody@heinicus.com',
      phone: '(555) 200-0001',
      address: '456 Mechanic Ave, Portland, OR 97202',
      isActive: true,
      mechanicProfile: {
        create: {
          bio: 'Experienced mobile mechanic with 10+ years in automotive repair. Specializing in engine diagnostics and transmission work.',
          specialties: ['Engine Repair', 'Transmission', 'Diagnostics', 'Brake Service'],
          yearsExperience: 10,
          certifications: ['ASE Master Technician', 'Oregon Licensed Mechanic'],
          insuranceProvider: 'State Farm',
          insurancePolicyNo: 'SF-12345678',
          businessLicense: 'OR-MECH-2024-001',
          rating: 4.8,
          totalJobs: 0,
          averageRating: 4.8,
          totalReviews: 0,
        },
      },
      pricingProfile: {
        create: {
          generalRates: {
            standard: 85,
            emergency: 120,
            travel_fee: 25,
            minimum: 50,
          },
          discounts: {
            senior_pct: 10,
            military_pct: 15,
            repeat_pct: 5,
          },
        },
      },
      availability: {
        create: {
          daysEnabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: '08:00',
          endTime: '18:00',
          maxJobsPerDay: 5,
          travelRadiusMiles: 30,
          autoAccept: false,
          emergencyEnabled: true,
        },
      },
    },
  });

  const mechanic2 = await prisma.user.create({
    data: {
      role: UserRole.MECHANIC,
      firstName: 'Sarah',
      lastName: 'Martinez',
      email: 'sarah.mechanic@heinicus.com',
      phone: '(555) 200-0002',
      address: '789 Workshop Rd, Portland, OR 97203',
      isActive: true,
      mechanicProfile: {
        create: {
          bio: 'Certified mobile mechanic specializing in European vehicles. Friendly, professional service with attention to detail.',
          specialties: ['European Cars', 'Oil Change', 'Brake Service', 'Tire Service'],
          yearsExperience: 7,
          certifications: ['ASE Certified', 'BMW Specialist'],
          insuranceProvider: 'Progressive',
          insurancePolicyNo: 'PROG-87654321',
          businessLicense: 'OR-MECH-2024-002',
          rating: 4.9,
          totalJobs: 0,
          averageRating: 4.9,
          totalReviews: 0,
        },
      },
      pricingProfile: {
        create: {
          generalRates: {
            standard: 90,
            emergency: 130,
            travel_fee: 30,
            minimum: 60,
          },
          discounts: {
            senior_pct: 10,
            military_pct: 10,
            repeat_pct: 8,
          },
        },
      },
      availability: {
        create: {
          daysEnabled: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
          startTime: '09:00',
          endTime: '17:00',
          maxJobsPerDay: 4,
          travelRadiusMiles: 25,
          autoAccept: false,
          emergencyEnabled: false,
        },
      },
    },
  });

  const mechanic3 = await prisma.user.create({
    data: {
      role: UserRole.MECHANIC,
      firstName: 'Mike',
      lastName: 'Thompson',
      email: 'mike.wrench@heinicus.com',
      phone: '(555) 200-0003',
      address: '321 Garage Blvd, Portland, OR 97204',
      isActive: true,
      mechanicProfile: {
        create: {
          bio: 'Your trusted mobile mechanic for all makes and models. Fast, reliable service at competitive rates.',
          specialties: ['General Repair', 'Oil Change', 'Battery Service', 'Emergency Roadside'],
          yearsExperience: 5,
          certifications: ['ASE Certified'],
          insuranceProvider: 'Allstate',
          insurancePolicyNo: 'ALL-11223344',
          businessLicense: 'OR-MECH-2024-003',
          rating: 4.7,
          totalJobs: 0,
          averageRating: 4.7,
          totalReviews: 0,
        },
      },
      pricingProfile: {
        create: {
          generalRates: {
            standard: 75,
            emergency: 110,
            travel_fee: 20,
            minimum: 45,
          },
          discounts: {
            senior_pct: 15,
            military_pct: 15,
            repeat_pct: 10,
          },
        },
      },
      availability: {
        create: {
          daysEnabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          startTime: '07:00',
          endTime: '19:00',
          maxJobsPerDay: 6,
          travelRadiusMiles: 35,
          autoAccept: true,
          emergencyEnabled: true,
        },
      },
    },
  });

  console.log('✅ Created 3 mechanics with profiles');

  // Create customers
  console.log('Creating customers...');
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        role: UserRole.CUSTOMER,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.customer@example.com',
        phone: '(555) 300-0001',
        address: '100 Customer Ln, Portland, OR 97205',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        role: UserRole.CUSTOMER,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '(555) 300-0002',
        address: '200 Main St, Portland, OR 97206',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        role: UserRole.CUSTOMER,
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        phone: '(555) 300-0003',
        address: '300 Oak Ave, Portland, OR 97207',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        role: UserRole.CUSTOMER,
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        phone: '(555) 300-0004',
        address: '400 Elm St, Portland, OR 97208',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        role: UserRole.CUSTOMER,
        firstName: 'Charlie',
        lastName: 'Davis',
        email: 'charlie.davis@example.com',
        phone: '(555) 300-0005',
        address: '500 Pine Rd, Portland, OR 97209',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created 5 customers');

  // Create services
  console.log('Creating services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Oil Change',
        category: 'oil_change',
        basePrice: 45,
        defaultLaborRate: 30,
        estHours: 0.5,
        requiredTools: ['Oil Filter Wrench', 'Drain Pan', 'Funnel'],
      },
    }),
    prisma.service.create({
      data: {
        name: 'Brake Pad Replacement',
        category: 'brake_service',
        basePrice: 200,
        defaultLaborRate: 85,
        estHours: 2,
        requiredTools: ['Jack', 'Lug Wrench', 'C-Clamp', 'Socket Set'],
      },
    }),
    prisma.service.create({
      data: {
        name: 'Tire Rotation',
        category: 'tire_service',
        basePrice: 40,
        defaultLaborRate: 40,
        estHours: 0.5,
        requiredTools: ['Jack', 'Lug Wrench', 'Torque Wrench'],
      },
    }),
    prisma.service.create({
      data: {
        name: 'Battery Replacement',
        category: 'battery_service',
        basePrice: 150,
        defaultLaborRate: 30,
        estHours: 0.5,
        requiredTools: ['Socket Set', 'Battery Terminal Cleaner'],
      },
    }),
    prisma.service.create({
      data: {
        name: 'Engine Diagnostics',
        category: 'engine_diagnostics',
        basePrice: 100,
        defaultLaborRate: 85,
        estHours: 1,
        requiredTools: ['OBD-II Scanner', 'Multimeter'],
      },
    }),
    prisma.service.create({
      data: {
        name: 'Air Filter Replacement',
        category: 'air_conditioning',
        basePrice: 30,
        defaultLaborRate: 20,
        estHours: 0.25,
        requiredTools: ['Screwdriver Set'],
      },
    }),
  ]);
  console.log('✅ Created 6 services');

  // Create vehicles for customers
  console.log('Creating vehicles...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        userId: customers[0].id,
        vin: '1HGBH41JXMN109186',
        year: 2021,
        make: 'Honda',
        model: 'Accord',
        notes: 'Silver sedan, well maintained',
      },
    }),
    prisma.vehicle.create({
      data: {
        userId: customers[1].id,
        vin: '1FTFW1ET5DFC10314',
        year: 2020,
        make: 'Ford',
        model: 'F-150',
        notes: 'Blue truck, work vehicle',
      },
    }),
    prisma.vehicle.create({
      data: {
        userId: customers[2].id,
        vin: '5YJSA1E26HF204256',
        year: 2022,
        make: 'Tesla',
        model: 'Model S',
        notes: 'Red, electric vehicle',
      },
    }),
    prisma.vehicle.create({
      data: {
        userId: customers[3].id,
        vin: 'WBADT43452G932798',
        year: 2019,
        make: 'BMW',
        model: '328i',
        notes: 'Black, European luxury sedan',
      },
    }),
    prisma.vehicle.create({
      data: {
        userId: customers[4].id,
        vin: 'JM1BL1S57A1234567',
        year: 2018,
        make: 'Mazda',
        model: 'CX-5',
        notes: 'White SUV, family vehicle',
      },
    }),
  ]);
  console.log('✅ Created 5 vehicles');

  // Create sample quotes
  console.log('Creating sample quotes...');
  const quote1 = await prisma.quote.create({
    data: {
      customerId: customers[0].id,
      vehicleId: vehicles[0].id,
      serviceId: services[0].id,
      lineItems: [
        { label: 'Oil Change Service', amount: 30 },
        { label: 'Synthetic Oil (5 quarts)', amount: 35 },
        { label: 'Oil Filter', amount: 10 },
      ],
      laborRate: 30,
      estHours: 0.5,
      laborCost: 15,
      partsCost: 45,
      travelFee: 25,
      discountsApplied: [],
      status: 'PENDING',
      subtotal: 85,
      taxes: 6.8,
      total: 91.8,
      totalCost: 91.8,
      notes: 'Standard oil change with synthetic oil',
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      customerId: customers[1].id,
      vehicleId: vehicles[1].id,
      serviceId: services[1].id,
      lineItems: [
        { label: 'Brake Pad Replacement (Front)', amount: 85 },
        { label: 'Brake Pads', amount: 80 },
        { label: 'Labor', amount: 170 },
      ],
      laborRate: 85,
      estHours: 2,
      laborCost: 170,
      partsCost: 80,
      travelFee: 25,
      discountsApplied: [],
      status: 'ACCEPTED',
      subtotal: 275,
      taxes: 22,
      total: 297,
      totalCost: 297,
      notes: 'Front brake pads showing wear, replacement recommended',
    },
  });

  console.log('✅ Created 2 sample quotes');

  // Create a completed job
  console.log('Creating sample job...');
  const job1 = await prisma.job.create({
    data: {
      quoteId: quote2.id,
      customerId: customers[1].id,
      mechanicId: mechanic1.id,
      status: 'COMPLETED',
      urgency: 'MEDIUM',
      title: 'Brake Pad Replacement - Ford F-150',
      category: 'brake_service',
      schedule: {
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      location: {
        address: '200 Main St, Portland, OR 97206',
        lat: 45.5152,
        lng: -122.6784,
      },
      photos: [],
      partsUsed: [
        { name: 'Brake Pads (Front)', qty: 1, unit_cost: 80 },
      ],
      timers: [
        {
          action: 'start',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          mechanicId: mechanic1.id,
        },
        {
          action: 'end',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          mechanicId: mechanic1.id,
        },
      ],
      totals: {
        labor: 170,
        parts: 80,
        fees: 25,
        discounts: 0,
        grand_total: 275,
      },
    },
  });

  // Create job timeline
  await prisma.jobTimeline.create({
    data: {
      jobId: job1.id,
      eventType: 'COMPLETED',
      description: 'Job completed successfully',
      actorId: mechanic1.id,
      metadata: {
        duration: '2 hours',
        quality: 'excellent',
      },
    },
  });

  console.log('✅ Created 1 completed job with timeline');

  // Create payment
  await prisma.payment.create({
    data: {
      jobId: job1.id,
      stripePaymentId: 'pi_test_' + Math.random().toString(36).substring(7),
      amount: 275,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: 'card',
    },
  });

  console.log('✅ Created payment record');

  // Create review
  await prisma.review.create({
    data: {
      jobId: job1.id,
      reviewerId: customers[1].id,
      revieweeId: mechanic1.id,
      rating: 5,
      punctualityRating: 5,
      qualityRating: 5,
      communicationRating: 5,
      valueRating: 5,
      comment: 'Excellent service! Cody arrived on time, was very professional, and did a great job on my brakes. Highly recommend!',
      photos: [],
      isVerified: true,
    },
  });

  console.log('✅ Created review');

  // Create system settings
  console.log('Creating system settings...');
  await Promise.all([
    prisma.systemSettings.create({
      data: {
        key: 'productionMode',
        value: false,
        type: 'boolean',
        category: 'general',
        label: 'Production Mode',
        description: 'Enable production mode',
        updatedBy: admin.id,
      },
    }),
    prisma.systemSettings.create({
      data: {
        key: 'enableAIDiagnostics',
        value: false,
        type: 'boolean',
        category: 'features',
        label: 'AI Diagnostics',
        description: 'Enable AI-powered diagnostics',
        updatedBy: admin.id,
      },
    }),
    prisma.systemSettings.create({
      data: {
        key: 'maintenanceMode',
        value: false,
        type: 'boolean',
        category: 'general',
        label: 'Maintenance Mode',
        description: 'Enable maintenance mode',
        updatedBy: admin.id,
      },
    }),
  ]);

  console.log('✅ Created system settings');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nSeeded data summary:');
  console.log('- 1 admin user');
  console.log('- 3 mechanics (with profiles, pricing, and availability)');
  console.log('- 5 customers');
  console.log('- 6 services');
  console.log('- 5 vehicles');
  console.log('- 2 quotes (1 pending, 1 accepted)');
  console.log('- 1 completed job with payment and review');
  console.log('- 3 system settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
