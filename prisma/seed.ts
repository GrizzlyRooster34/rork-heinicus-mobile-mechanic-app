import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create Users
  const admin = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      firstName: 'Cody',
      lastName: 'Owner',
      email: 'owner@example.com',
    },
  });

  const mechanic = await prisma.user.create({
    data: {
      role: UserRole.MECHANIC,
      firstName: 'Cody',
      lastName: 'Mechanic',
      email: 'mech@example.com',
    },
  });

  await prisma.user.create({
    data: {
      role: UserRole.CUSTOMER,
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'customer@example.com',
    },
  });

  console.log('Users created.');

  // Create Services
  const services = [
    { name: "Oil Change", category: "Maintenance", basePrice: 45, defaultLaborRate: 75, estHours: 0.5, requiredTools: [] },
    { name: "Brake Service", category: "Brakes", basePrice: 150, defaultLaborRate: 85, estHours: 2, requiredTools: [] },
    { name: "Tire Service", category: "Tires", basePrice: 80, defaultLaborRate: 75, estHours: 1, requiredTools: [] },
    { name: "Battery Service", category: "Electrical", basePrice: 120, defaultLaborRate: 75, estHours: 0.75, requiredTools: [] },
    { name: "Engine Diagnostic", category: "Engine", basePrice: 100, defaultLaborRate: 85, estHours: 1.5, requiredTools: [] },
    { name: "Transmission", category: "Transmission", basePrice: 200, defaultLaborRate: 95, estHours: 3, requiredTools: [] },
    { name: "A/C Service", category: "HVAC", basePrice: 90, defaultLaborRate: 85, estHours: 1.5, requiredTools: [] },
    { name: "General Repair", category: "General", basePrice: 75, defaultLaborRate: 85, estHours: 2, requiredTools: [] },
    { name: "Emergency Roadside", category: "Emergency", basePrice: 65, defaultLaborRate: 95, estHours: 1, requiredTools: [] },
  ];

  for (const service of services) {
    await prisma.service.create({ data: service });
  }

  console.log('Services created.');

  // Create Pricing Profile for Mechanic
  await prisma.pricingProfile.create({
    data: {
      mechanicId: mechanic.id,
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
  });

  console.log('Pricing profile created.');

  // Create Availability for Mechanic
  await prisma.availability.create({
    data: {
      mechanicId: mechanic.id,
      daysEnabled: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:00',
      endTime: '18:00',
      maxJobsPerDay: 5,
      travelRadiusMiles: 25,
      autoAccept: true,
      emergencyEnabled: true,
    },
  });

  console.log('Availability created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
