import { ServiceType, ServiceTool, VehicleType } from '@/types/service';

export interface ServiceCategory {
  id: ServiceType;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  basePrice: number;
  vehicleTypes: VehicleType[];
  requiredTools: ServiceTool[];
}

// Comprehensive tool definitions for each service type
export const SERVICE_TOOLS: { [key in ServiceType]: ServiceTool[] } = {
  // Car Services
  oil_change: [
    { id: 'oil-drain-pan', name: 'Oil Drain Pan (5+ qt)', category: 'basic', required: true, description: 'Large capacity drain pan' },
    { id: 'socket-set-metric', name: 'Socket Set (Metric)', category: 'basic', required: true, description: '10mm-19mm sockets' },
    { id: 'socket-set-standard', name: 'Socket Set (Standard)', category: 'basic', required: true, description: '3/8" to 3/4" sockets' },
    { id: 'oil-filter-wrench', name: 'Oil Filter Wrench', category: 'basic', required: true, description: 'Adjustable filter wrench' },
    { id: 'funnel', name: 'Oil Funnel', category: 'basic', required: true, description: 'Wide mouth funnel' },
    { id: 'jack-stands', name: 'Jack & Jack Stands', category: 'safety', required: true, description: 'Rated for vehicle weight' },
    { id: 'shop-rags', name: 'Shop Rags/Towels', category: 'basic', required: true, description: 'Absorbent cleaning rags' },
    { id: 'nitrile-gloves', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Chemical resistant gloves' },
    { id: 'torque-wrench', name: 'Torque Wrench', category: 'specialized', required: false, description: 'For drain plug torque spec' },
  ],
  brake_service: [
    { id: 'brake-caliper-tool', name: 'Brake Caliper Compression Tool', category: 'specialized', required: true, description: 'Piston compression tool' },
    { id: 'c-clamp-large', name: 'Large C-Clamp', category: 'basic', required: true, description: '6" or larger opening' },
    { id: 'brake-fluid-dot3', name: 'DOT 3 Brake Fluid', category: 'basic', required: true, description: 'Fresh brake fluid' },
    { id: 'brake-cleaner', name: 'Brake Parts Cleaner', category: 'basic', required: true, description: 'Non-chlorinated cleaner' },
    { id: 'socket-set-brake', name: 'Socket Set (Brake Specific)', category: 'basic', required: true, description: '13mm, 14mm, 17mm common' },
    { id: 'jack-stands-brake', name: 'Jack & Jack Stands', category: 'safety', required: true, description: 'Heavy duty stands' },
    { id: 'safety-glasses', name: 'Safety Glasses', category: 'safety', required: true, description: 'Impact resistant' },
    { id: 'wire-brush', name: 'Wire Brush', category: 'basic', required: false, description: 'For cleaning brake components' },
    { id: 'brake-grease', name: 'Brake Caliper Grease', category: 'specialized', required: false, description: 'High-temp brake grease' },
  ],
  tire_service: [
    { id: 'tire-iron', name: 'Tire Iron/Lug Wrench', category: 'basic', required: true, description: 'Cross pattern or telescoping' },
    { id: 'jack-stands-tire', name: 'Jack & Jack Stands', category: 'safety', required: true, description: 'Proper lifting equipment' },
    { id: 'tire-pressure-gauge', name: 'Digital Tire Pressure Gauge', category: 'basic', required: true, description: 'Accurate to 1 PSI' },
    { id: 'valve-stem-tool', name: 'Valve Stem Tool', category: 'basic', required: true, description: 'Core removal tool' },
    { id: 'tire-repair-kit', name: 'Tire Repair Kit', category: 'specialized', required: false, description: 'Plugs and patches' },
    { id: 'torque-wrench-tire', name: 'Torque Wrench', category: 'specialized', required: true, description: 'For lug nut torque spec' },
    { id: 'wheel-chocks', name: 'Wheel Chocks', category: 'safety', required: true, description: 'Prevent vehicle rolling' },
    { id: 'tire-iron-breaker', name: 'Breaker Bar', category: 'basic', required: false, description: 'For stubborn lug nuts' },
  ],
  battery_service: [
    { id: 'multimeter', name: 'Digital Multimeter', category: 'diagnostic', required: true, description: 'DC voltage measurement' },
    { id: 'battery-tester', name: 'Battery Load Tester', category: 'diagnostic', required: true, description: 'Load testing capability' },
    { id: 'terminal-cleaner', name: 'Battery Terminal Cleaner', category: 'basic', required: true, description: 'Wire brush or spray' },
    { id: 'wire-brush-battery', name: 'Wire Brush Set', category: 'basic', required: true, description: 'Terminal cleaning brushes' },
    { id: 'socket-set-battery', name: 'Socket Set', category: 'basic', required: true, description: '8mm, 10mm, 13mm common' },
    { id: 'safety-glasses-battery', name: 'Safety Glasses', category: 'safety', required: true, description: 'Acid splash protection' },
    { id: 'nitrile-gloves-battery', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Acid resistant gloves' },
    { id: 'battery-carrier', name: 'Battery Carrier', category: 'basic', required: false, description: 'Safe battery handling' },
  ],
  engine_diagnostic: [
    { id: 'obd2-scanner', name: 'OBD2 Scanner/Reader', category: 'diagnostic', required: true, description: 'Code reading capability' },
    { id: 'multimeter-engine', name: 'Digital Multimeter', category: 'diagnostic', required: true, description: 'Voltage/resistance testing' },
    { id: 'compression-tester', name: 'Compression Tester', category: 'diagnostic', required: false, description: 'Engine compression test' },
    { id: 'fuel-pressure-gauge', name: 'Fuel Pressure Gauge', category: 'diagnostic', required: false, description: 'Fuel system testing' },
    { id: 'socket-set-engine', name: 'Socket Set (Complete)', category: 'basic', required: true, description: 'Metric and standard' },
    { id: 'screwdriver-set', name: 'Screwdriver Set', category: 'basic', required: true, description: 'Phillips and flathead' },
    { id: 'flashlight-led', name: 'LED Flashlight/Headlamp', category: 'basic', required: true, description: 'Hands-free lighting' },
    { id: 'test-light', name: 'Test Light', category: 'diagnostic', required: false, description: 'Circuit testing' },
  ],
  transmission: [
    { id: 'transmission-jack', name: 'Transmission Jack', category: 'specialized', required: true, description: 'Heavy duty transmission jack' },
    { id: 'socket-set-trans', name: 'Socket Set (Complete)', category: 'basic', required: true, description: 'Large socket set' },
    { id: 'torque-wrench-trans', name: 'Torque Wrench Set', category: 'specialized', required: true, description: 'Multiple torque ranges' },
    { id: 'drain-pan-large', name: 'Large Drain Pan (10+ qt)', category: 'basic', required: true, description: 'High capacity pan' },
    { id: 'funnel-trans', name: 'Transmission Funnel', category: 'basic', required: true, description: 'Long neck funnel' },
    { id: 'jack-stands-heavy', name: 'Heavy Duty Jack Stands', category: 'safety', required: true, description: 'High weight capacity' },
    { id: 'safety-glasses-trans', name: 'Safety Glasses', category: 'safety', required: true, description: 'Impact protection' },
    { id: 'gasket-scraper', name: 'Gasket Scraper', category: 'basic', required: false, description: 'Pan gasket removal' },
  ],
  ac_service: [
    { id: 'ac-manifold-gauge', name: 'A/C Manifold Gauge Set', category: 'specialized', required: true, description: 'R134a/R1234yf compatible' },
    { id: 'refrigerant-recovery', name: 'Refrigerant Recovery Unit', category: 'specialized', required: true, description: 'EPA certified equipment' },
    { id: 'leak-detector', name: 'A/C Leak Detector', category: 'diagnostic', required: true, description: 'Electronic leak detector' },
    { id: 'vacuum-pump', name: 'Vacuum Pump', category: 'specialized', required: true, description: 'System evacuation' },
    { id: 'thermometer-digital', name: 'Digital Thermometer', category: 'diagnostic', required: true, description: 'Vent temperature measurement' },
    { id: 'safety-glasses-ac', name: 'Safety Glasses', category: 'safety', required: true, description: 'Refrigerant protection' },
    { id: 'nitrile-gloves-ac', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Chemical resistant' },
    { id: 'uv-dye', name: 'UV Leak Detection Dye', category: 'diagnostic', required: false, description: 'Leak detection aid' },
  ],
  general_repair: [
    { id: 'socket-set-complete', name: 'Complete Socket Set', category: 'basic', required: true, description: 'Metric and standard, all sizes' },
    { id: 'wrench-set-complete', name: 'Complete Wrench Set', category: 'basic', required: true, description: 'Open end and box end' },
    { id: 'screwdriver-set-complete', name: 'Complete Screwdriver Set', category: 'basic', required: true, description: 'Multiple sizes and types' },
    { id: 'pliers-set', name: 'Pliers Set', category: 'basic', required: true, description: 'Needle nose, standard, wire cutters' },
    { id: 'multimeter-general', name: 'Digital Multimeter', category: 'diagnostic', required: false, description: 'Basic electrical testing' },
    { id: 'jack-stands-general', name: 'Jack & Jack Stands', category: 'safety', required: true, description: 'Vehicle lifting equipment' },
    { id: 'flashlight-general', name: 'LED Flashlight', category: 'basic', required: true, description: 'Portable lighting' },
    { id: 'extension-set', name: 'Socket Extension Set', category: 'basic', required: false, description: 'Various length extensions' },
  ],
  emergency_roadside: [
    { id: 'jump-starter', name: 'Portable Jump Starter', category: 'specialized', required: true, description: 'High capacity jump pack' },
    { id: 'tire-iron-emergency', name: 'Tire Iron', category: 'basic', required: true, description: 'Lug nut removal' },
    { id: 'jack-emergency', name: 'Emergency Jack', category: 'safety', required: true, description: 'Portable vehicle jack' },
    { id: 'tire-repair-emergency', name: 'Emergency Tire Repair Kit', category: 'specialized', required: true, description: 'Plugs and sealant' },
    { id: 'lockout-tools', name: 'Vehicle Lockout Tools', category: 'specialized', required: false, description: 'Professional lockout kit' },
    { id: 'flashlight-emergency', name: 'Emergency LED Flashlight', category: 'basic', required: true, description: 'High-powered flashlight' },
    { id: 'safety-vest', name: 'High-Visibility Safety Vest', category: 'safety', required: true, description: 'ANSI compliant vest' },
    { id: 'road-flares', name: 'Road Flares/Reflectors', category: 'safety', required: false, description: 'Traffic warning devices' },
  ],

  // Motorcycle Services
  motorcycle_oil_change: [
    { id: 'motorcycle-oil-pan', name: 'Motorcycle Oil Drain Pan', category: 'basic', required: true, description: 'Compact drain pan for motorcycles' },
    { id: 'motorcycle-socket-set', name: 'Motorcycle Socket Set', category: 'basic', required: true, description: '8mm-17mm metric sockets' },
    { id: 'motorcycle-oil-filter-wrench', name: 'Motorcycle Oil Filter Wrench', category: 'basic', required: true, description: 'Compact filter wrench' },
    { id: 'motorcycle-funnel', name: 'Motorcycle Oil Funnel', category: 'basic', required: true, description: 'Small funnel for tight spaces' },
    { id: 'motorcycle-stand', name: 'Motorcycle Stand/Lift', category: 'safety', required: true, description: 'Center or side stand' },
    { id: 'shop-rags-mc', name: 'Shop Rags', category: 'basic', required: true, description: 'Absorbent cleaning rags' },
    { id: 'nitrile-gloves-mc', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Chemical resistant gloves' },
    { id: 'torque-wrench-mc', name: 'Torque Wrench (Small)', category: 'specialized', required: false, description: 'For drain plug torque spec' },
  ],
  motorcycle_brake_inspection: [
    { id: 'motorcycle-brake-tools', name: 'Motorcycle Brake Tool Set', category: 'specialized', required: true, description: 'Brake pad removal tools' },
    { id: 'brake-fluid-dot4', name: 'DOT 4 Brake Fluid', category: 'basic', required: true, description: 'High-performance brake fluid' },
    { id: 'brake-cleaner-mc', name: 'Brake Parts Cleaner', category: 'basic', required: true, description: 'Non-chlorinated cleaner' },
    { id: 'motorcycle-socket-brake', name: 'Motorcycle Socket Set', category: 'basic', required: true, description: '8mm, 10mm, 12mm common' },
    { id: 'motorcycle-stand-brake', name: 'Motorcycle Stand', category: 'safety', required: true, description: 'Stable work platform' },
    { id: 'safety-glasses-mc', name: 'Safety Glasses', category: 'safety', required: true, description: 'Impact resistant' },
    { id: 'wire-brush-mc', name: 'Wire Brush', category: 'basic', required: false, description: 'For cleaning brake components' },
  ],
  motorcycle_tire_replacement: [
    { id: 'motorcycle-tire-irons', name: 'Motorcycle Tire Irons', category: 'basic', required: true, description: 'Specialized tire removal tools' },
    { id: 'motorcycle-bead-breaker', name: 'Motorcycle Bead Breaker', category: 'specialized', required: true, description: 'Tire bead breaking tool' },
    { id: 'tire-pressure-gauge-mc', name: 'Digital Tire Pressure Gauge', category: 'basic', required: true, description: 'Accurate to 1 PSI' },
    { id: 'valve-stem-tool-mc', name: 'Valve Stem Tool', category: 'basic', required: true, description: 'Core removal tool' },
    { id: 'motorcycle-wheel-balancer', name: 'Motorcycle Wheel Balancer', category: 'specialized', required: false, description: 'Wheel balancing equipment' },
    { id: 'motorcycle-stand-tire', name: 'Motorcycle Stand', category: 'safety', required: true, description: 'Wheel removal support' },
    { id: 'tire-lubricant', name: 'Tire Mounting Lubricant', category: 'basic', required: true, description: 'Soap solution for mounting' },
  ],
  motorcycle_chain_service: [
    { id: 'chain-cleaning-kit', name: 'Chain Cleaning Kit', category: 'specialized', required: true, description: 'Chain cleaner and brushes' },
    { id: 'chain-lubricant', name: 'Chain Lubricant', category: 'basic', required: true, description: 'High-quality chain lube' },
    { id: 'chain-tension-tool', name: 'Chain Tension Tool', category: 'specialized', required: true, description: 'Chain adjustment tool' },
    { id: 'motorcycle-socket-chain', name: 'Motorcycle Socket Set', category: 'basic', required: true, description: 'For axle and adjuster nuts' },
    { id: 'motorcycle-stand-chain', name: 'Motorcycle Rear Stand', category: 'safety', required: true, description: 'Rear wheel lift' },
    { id: 'chain-wear-gauge', name: 'Chain Wear Gauge', category: 'diagnostic', required: false, description: 'Chain stretch measurement' },
    { id: 'shop-rags-chain', name: 'Shop Rags', category: 'basic', required: true, description: 'For cleaning' },
  ],
  motorcycle_battery_service: [
    { id: 'multimeter-mc', name: 'Digital Multimeter', category: 'diagnostic', required: true, description: 'DC voltage measurement' },
    { id: 'battery-tester-mc', name: 'Motorcycle Battery Tester', category: 'diagnostic', required: true, description: 'Small battery testing' },
    { id: 'terminal-cleaner-mc', name: 'Battery Terminal Cleaner', category: 'basic', required: true, description: 'Wire brush or spray' },
    { id: 'motorcycle-socket-battery', name: 'Small Socket Set', category: 'basic', required: true, description: '6mm, 8mm, 10mm common' },
    { id: 'safety-glasses-mc-battery', name: 'Safety Glasses', category: 'safety', required: true, description: 'Acid splash protection' },
    { id: 'nitrile-gloves-mc-battery', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Acid resistant gloves' },
    { id: 'battery-tender', name: 'Battery Tender/Charger', category: 'specialized', required: false, description: 'Motorcycle battery charger' },
  ],
  motorcycle_diagnostic: [
    { id: 'motorcycle-diagnostic-tool', name: 'Motorcycle Diagnostic Scanner', category: 'diagnostic', required: true, description: 'Motorcycle-specific scanner' },
    { id: 'multimeter-mc-diag', name: 'Digital Multimeter', category: 'diagnostic', required: true, description: 'Voltage/resistance testing' },
    { id: 'motorcycle-socket-diag', name: 'Motorcycle Socket Set', category: 'basic', required: true, description: 'Complete metric set' },
    { id: 'screwdriver-set-mc', name: 'Precision Screwdriver Set', category: 'basic', required: true, description: 'Small Phillips and flathead' },
    { id: 'flashlight-mc', name: 'LED Flashlight/Headlamp', category: 'basic', required: true, description: 'Hands-free lighting' },
    { id: 'test-light-mc', name: 'Test Light', category: 'diagnostic', required: false, description: 'Circuit testing' },
  ],

  // Scooter Services
  scooter_oil_change: [
    { id: 'scooter-oil-pan', name: 'Small Oil Drain Pan', category: 'basic', required: true, description: 'Compact drain pan for scooters' },
    { id: 'scooter-socket-set', name: 'Small Socket Set', category: 'basic', required: true, description: '6mm-14mm metric sockets' },
    { id: 'scooter-oil-filter-wrench', name: 'Small Oil Filter Wrench', category: 'basic', required: true, description: 'Compact filter wrench' },
    { id: 'scooter-funnel', name: 'Small Funnel', category: 'basic', required: true, description: 'Precision funnel' },
    { id: 'scooter-stand', name: 'Scooter Center Stand', category: 'safety', required: true, description: 'Built-in or portable stand' },
    { id: 'shop-rags-scooter', name: 'Shop Rags', category: 'basic', required: true, description: 'Absorbent cleaning rags' },
    { id: 'nitrile-gloves-scooter', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Chemical resistant gloves' },
  ],
  scooter_brake_inspection: [
    { id: 'scooter-brake-tools', name: 'Scooter Brake Tool Set', category: 'specialized', required: true, description: 'Small brake tools' },
    { id: 'brake-fluid-scooter', name: 'DOT 3/4 Brake Fluid', category: 'basic', required: true, description: 'Brake fluid for scooters' },
    { id: 'brake-cleaner-scooter', name: 'Brake Parts Cleaner', category: 'basic', required: true, description: 'Non-chlorinated cleaner' },
    { id: 'scooter-socket-brake', name: 'Small Socket Set', category: 'basic', required: true, description: '6mm, 8mm, 10mm common' },
    { id: 'scooter-stand-brake', name: 'Scooter Stand', category: 'safety', required: true, description: 'Stable work platform' },
    { id: 'safety-glasses-scooter', name: 'Safety Glasses', category: 'safety', required: true, description: 'Impact resistant' },
  ],
  scooter_tire_replacement: [
    { id: 'scooter-tire-irons', name: 'Small Tire Irons', category: 'basic', required: true, description: 'Compact tire removal tools' },
    { id: 'tire-pressure-gauge-scooter', name: 'Digital Tire Pressure Gauge', category: 'basic', required: true, description: 'Accurate to 1 PSI' },
    { id: 'valve-stem-tool-scooter', name: 'Valve Stem Tool', category: 'basic', required: true, description: 'Core removal tool' },
    { id: 'scooter-stand-tire', name: 'Scooter Stand', category: 'safety', required: true, description: 'Wheel removal support' },
    { id: 'tire-lubricant-scooter', name: 'Tire Mounting Lubricant', category: 'basic', required: true, description: 'Soap solution for mounting' },
    { id: 'tire-repair-kit-scooter', name: 'Small Tire Repair Kit', category: 'specialized', required: false, description: 'Plugs for small tires' },
  ],
  scooter_carburetor_clean: [
    { id: 'carburetor-cleaner', name: 'Carburetor Cleaner', category: 'specialized', required: true, description: 'Carburetor cleaning solution' },
    { id: 'carburetor-rebuild-kit', name: 'Carburetor Rebuild Kit', category: 'specialized', required: false, description: 'Gaskets and seals' },
    { id: 'scooter-socket-carb', name: 'Small Socket Set', category: 'basic', required: true, description: 'For carburetor removal' },
    { id: 'screwdriver-set-scooter', name: 'Precision Screwdriver Set', category: 'basic', required: true, description: 'Small Phillips and flathead' },
    { id: 'compressed-air', name: 'Compressed Air', category: 'basic', required: true, description: 'For blowing out passages' },
    { id: 'safety-glasses-carb', name: 'Safety Glasses', category: 'safety', required: true, description: 'Chemical splash protection' },
    { id: 'nitrile-gloves-carb', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Chemical resistant gloves' },
  ],
  scooter_battery_service: [
    { id: 'multimeter-scooter', name: 'Digital Multimeter', category: 'diagnostic', required: true, description: 'DC voltage measurement' },
    { id: 'battery-tester-scooter', name: 'Small Battery Tester', category: 'diagnostic', required: true, description: 'Small battery testing' },
    { id: 'terminal-cleaner-scooter', name: 'Battery Terminal Cleaner', category: 'basic', required: true, description: 'Wire brush or spray' },
    { id: 'scooter-socket-battery', name: 'Small Socket Set', category: 'basic', required: true, description: '6mm, 8mm common' },
    { id: 'safety-glasses-scooter-battery', name: 'Safety Glasses', category: 'safety', required: true, description: 'Acid splash protection' },
    { id: 'nitrile-gloves-scooter-battery', name: 'Nitrile Gloves', category: 'safety', required: true, description: 'Acid resistant gloves' },
  ],
  scooter_diagnostic: [
    { id: 'scooter-diagnostic-tool', name: 'Scooter Diagnostic Scanner', category: 'diagnostic', required: false, description: 'Basic diagnostic tool' },
    { id: 'multimeter-scooter-diag', name: 'Digital Multimeter', category: 'diagnostic', required: true, description: 'Voltage/resistance testing' },
    { id: 'scooter-socket-diag', name: 'Small Socket Set', category: 'basic', required: true, description: 'Complete small metric set' },
    { id: 'screwdriver-set-scooter-diag', name: 'Precision Screwdriver Set', category: 'basic', required: true, description: 'Small Phillips and flathead' },
    { id: 'flashlight-scooter', name: 'LED Flashlight', category: 'basic', required: true, description: 'Portable lighting' },
    { id: 'test-light-scooter', name: 'Test Light', category: 'diagnostic', required: false, description: 'Circuit testing' },
  ],
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // Car Services
  {
    id: 'oil_change',
    title: 'Oil Change',
    description: 'Full synthetic or conventional oil change service',
    icon: 'droplets',
    estimatedTime: '30-45 min',
    basePrice: 45,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.oil_change,
  },
  {
    id: 'brake_service',
    title: 'Brake Service',
    description: 'Brake pad replacement, rotor service, brake fluid',
    icon: 'disc',
    estimatedTime: '1-2 hours',
    basePrice: 150,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.brake_service,
  },
  {
    id: 'tire_service',
    title: 'Tire Service',
    description: 'Tire installation, rotation, balancing, repair',
    icon: 'circle',
    estimatedTime: '45-90 min',
    basePrice: 80,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.tire_service,
  },
  {
    id: 'battery_service',
    title: 'Battery Service',
    description: 'Battery testing, replacement, charging system check',
    icon: 'battery',
    estimatedTime: '30-60 min',
    basePrice: 120,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.battery_service,
  },
  {
    id: 'engine_diagnostic',
    title: 'Engine Diagnostic',
    description: 'Computer diagnostic, check engine light, performance issues',
    icon: 'search',
    estimatedTime: '1-2 hours',
    basePrice: 100,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.engine_diagnostic,
  },
  {
    id: 'transmission',
    title: 'Transmission',
    description: 'Transmission service, fluid change, repair',
    icon: 'settings',
    estimatedTime: '2-4 hours',
    basePrice: 200,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.transmission,
  },
  {
    id: 'ac_service',
    title: 'A/C Service',
    description: 'Air conditioning repair, recharge, leak detection',
    icon: 'snowflake',
    estimatedTime: '1-2 hours',
    basePrice: 90,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.ac_service,
  },
  {
    id: 'general_repair',
    title: 'General Repair',
    description: 'Other automotive repairs and maintenance',
    icon: 'wrench',
    estimatedTime: 'Varies',
    basePrice: 75,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.general_repair,
  },
  {
    id: 'emergency_roadside',
    title: 'Emergency Roadside',
    description: 'Jump start, lockout, flat tire, towing assistance',
    icon: 'phone',
    estimatedTime: '30-60 min',
    basePrice: 65,
    vehicleTypes: ['car'],
    requiredTools: SERVICE_TOOLS.emergency_roadside,
  },

  // Motorcycle Services
  {
    id: 'motorcycle_oil_change',
    title: 'Motorcycle Oil Change',
    description: 'Full synthetic or conventional motorcycle oil change',
    icon: 'droplets',
    estimatedTime: '20-30 min',
    basePrice: 60,
    vehicleTypes: ['motorcycle'],
    requiredTools: SERVICE_TOOLS.motorcycle_oil_change,
  },
  {
    id: 'motorcycle_brake_inspection',
    title: 'Motorcycle Brake Inspection',
    description: 'Brake pad inspection, fluid check, system test',
    icon: 'disc',
    estimatedTime: '30-45 min',
    basePrice: 40,
    vehicleTypes: ['motorcycle'],
    requiredTools: SERVICE_TOOLS.motorcycle_brake_inspection,
  },
  {
    id: 'motorcycle_tire_replacement',
    title: 'Motorcycle Tire Replacement',
    description: 'Single tire replacement and balancing',
    icon: 'circle',
    estimatedTime: '45-60 min',
    basePrice: 45,
    vehicleTypes: ['motorcycle'],
    requiredTools: SERVICE_TOOLS.motorcycle_tire_replacement,
  },
  {
    id: 'motorcycle_chain_service',
    title: 'Chain Adjustment & Lube',
    description: 'Chain cleaning, lubrication, and tension adjustment',
    icon: 'settings',
    estimatedTime: '20-30 min',
    basePrice: 30,
    vehicleTypes: ['motorcycle'],
    requiredTools: SERVICE_TOOLS.motorcycle_chain_service,
  },
  {
    id: 'motorcycle_battery_service',
    title: 'Motorcycle Battery Service',
    description: 'Battery test, replacement, and charging system check',
    icon: 'battery',
    estimatedTime: '15-30 min',
    basePrice: 25,
    vehicleTypes: ['motorcycle'],
    requiredTools: SERVICE_TOOLS.motorcycle_battery_service,
  },
  {
    id: 'motorcycle_diagnostic',
    title: 'Motorcycle Diagnostic',
    description: 'Computer diagnostic and performance troubleshooting',
    icon: 'search',
    estimatedTime: '45-90 min',
    basePrice: 75,
    vehicleTypes: ['motorcycle'],
    requiredTools: SERVICE_TOOLS.motorcycle_diagnostic,
  },

  // Scooter Services
  {
    id: 'scooter_oil_change',
    title: 'Scooter Oil Change',
    description: 'Oil change service for scooters and mopeds',
    icon: 'droplets',
    estimatedTime: '15-25 min',
    basePrice: 35,
    vehicleTypes: ['scooter'],
    requiredTools: SERVICE_TOOLS.scooter_oil_change,
  },
  {
    id: 'scooter_brake_inspection',
    title: 'Scooter Brake Inspection',
    description: 'Brake system inspection and adjustment',
    icon: 'disc',
    estimatedTime: '20-30 min',
    basePrice: 30,
    vehicleTypes: ['scooter'],
    requiredTools: SERVICE_TOOLS.scooter_brake_inspection,
  },
  {
    id: 'scooter_tire_replacement',
    title: 'Scooter Tire Replacement',
    description: 'Small tire replacement and tube repair',
    icon: 'circle',
    estimatedTime: '30-45 min',
    basePrice: 35,
    vehicleTypes: ['scooter'],
    requiredTools: SERVICE_TOOLS.scooter_tire_replacement,
  },
  {
    id: 'scooter_carburetor_clean',
    title: 'Carburetor Cleaning',
    description: 'Carburetor cleaning and adjustment service',
    icon: 'settings',
    estimatedTime: '60-90 min',
    basePrice: 65,
    vehicleTypes: ['scooter'],
    requiredTools: SERVICE_TOOLS.scooter_carburetor_clean,
  },
  {
    id: 'scooter_battery_service',
    title: 'Scooter Battery Service',
    description: 'Battery test and replacement for scooters',
    icon: 'battery',
    estimatedTime: '15-20 min',
    basePrice: 20,
    vehicleTypes: ['scooter'],
    requiredTools: SERVICE_TOOLS.scooter_battery_service,
  },
  {
    id: 'scooter_diagnostic',
    title: 'Scooter Diagnostic',
    description: 'Basic diagnostic and troubleshooting',
    icon: 'search',
    estimatedTime: '30-60 min',
    basePrice: 50,
    vehicleTypes: ['scooter'],
    requiredTools: SERVICE_TOOLS.scooter_diagnostic,
  },
];

// Helper function to get services for a specific vehicle type
export function getServicesForVehicleType(vehicleType: VehicleType): ServiceCategory[] {
  return SERVICE_CATEGORIES.filter(service => 
    service.vehicleTypes.includes(vehicleType)
  );
}

// Helper function to get tools for a specific service
export function getToolsForService(serviceType: ServiceType): ServiceTool[] {
  return SERVICE_TOOLS[serviceType] || [];
}

// Helper function to get required tools only
export function getRequiredToolsForService(serviceType: ServiceType): ServiceTool[] {
  return SERVICE_TOOLS[serviceType]?.filter(tool => tool.required) || [];
}

// Helper function to validate tool completion
export function validateToolsCompletion(serviceType: ServiceType, checkedTools: { [toolId: string]: boolean }): {
  isComplete: boolean;
  missingRequired: ServiceTool[];
  totalRequired: number;
  totalChecked: number;
} {
  const requiredTools = getRequiredToolsForService(serviceType);
  const missingRequired = requiredTools.filter(tool => !checkedTools[tool.id]);
  const totalChecked = Object.values(checkedTools).filter(Boolean).length;
  
  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
    totalRequired: requiredTools.length,
    totalChecked,
  };
}

// Helper function to get tool loadout suggestions based on service and vehicle type
export function getToolLoadoutSuggestions(serviceType: ServiceType, vehicleType: VehicleType): string[] {
  const tools = getRequiredToolsForService(serviceType);
  const suggestions = tools.map(tool => tool.name);
  
  // Add vehicle-specific suggestions
  if (vehicleType === 'motorcycle') {
    suggestions.push('Motorcycle Stand', 'Chain Lubricant');
  } else if (vehicleType === 'scooter') {
    suggestions.push('Scooter Center Stand', 'Small Tool Kit');
  } else {
    suggestions.push('Floor Jack', 'Jack Stands');
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
}