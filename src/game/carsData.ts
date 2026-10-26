import { CarStats } from '../types/game';

export const CAR_CATALOG: CarStats[] = [
  {
    id: 'ferrari_stradale',
    name: 'Scuderia F8 Stradale',
    brand: 'Ferrari Tribute',
    class: 'V8 Twin-Turbo Hypercar',
    vehicleType: 'car',
    topSpeed: 340,
    acceleration: 9.4,
    handling: 9.0,
    nitroCapacity: 6.5,
    color: '#d40000', // Iconic Ferrari Rosso Corsa
    accentColor: '#ffd700', // Modena Yellow shield
    description: 'Bespoke Italian aerodynamic masterpiece featuring iconic twin hood nostrils, dual circular LED taillights, and intoxicating twin-turbo V8 throttle response.',
  },
  {
    id: 'porsche_gt3rs',
    name: 'Stuttgart 911 GT-RS',
    brand: 'Porsche GT',
    class: 'Track Precision GT3',
    vehicleType: 'car',
    topSpeed: 318,
    acceleration: 9.1,
    handling: 9.9,
    nitroCapacity: 7.0,
    color: '#0066cc', // Porsche Shark Blue
    accentColor: '#ff0033', // Guards Red accent
    description: 'Pure motorsport engineering with iconic teardrop silhouette, giant swan-neck active airbrake spoiler, wide rear fender haunches, and razor-sharp apex carving.',
  },
  {
    id: 'lambo_revuelto',
    name: 'Bologna V12 Hyper-V',
    brand: 'Lamborghini Concept',
    class: 'V12 Stealth Fighter',
    vehicleType: 'car',
    topSpeed: 355,
    acceleration: 9.8,
    handling: 8.5,
    nitroCapacity: 6.0,
    color: '#00e5ff', // Electric Hyper Cyan
    accentColor: '#ff6600', // Arancio Borealis
    description: 'Aggressive fighter-jet angular bodywork with signature Y-shaped LED matrix, massive rear carbon diffuser, high-mounted exhaust, and raw all-wheel-drive drift power.',
  },
  {
    id: 'cyber_truck',
    name: 'Cyber Titan 4x4 Offroad',
    brand: 'Cyber 4x4 Trophy',
    class: 'Heavy Armor Trophy Truck',
    vehicleType: 'truck',
    topSpeed: 295,
    acceleration: 9.5,
    handling: 7.8,
    nitroCapacity: 8.5,
    color: '#475569', // Tactical Slate Titanium
    accentColor: '#38bdf8', // Neon Sky Lightbar
    description: 'Imposing polygonal titanium offroad beast with raised rally suspension, 37-inch deep-tread terrain tires, roof LED floodlight bar, and heavy indestructible momentum.',
  },
  {
    id: 'super_bike',
    name: 'Ducati GP Corse Superbike',
    brand: 'Superbike Racing',
    class: 'MotoGP V4 Superbike',
    vehicleType: 'bike',
    topSpeed: 350,
    acceleration: 9.9,
    handling: 9.7,
    nitroCapacity: 5.5,
    color: '#e11d48', // Ducati Racing Crimson
    accentColor: '#ffffff', // White race livery
    description: 'Raw high-revving 1000cc MotoGP weapon with aggressive aerodynamic winglets, single-sided swingarm, and knee-scraping apex lean angles.',
  },
  {
    id: 'road_cycle',
    name: 'Tour Aero Velodrome Cycle',
    brand: 'Aero Velodrome',
    class: 'Carbon Aero Road Bike',
    vehicleType: 'cycle',
    topSpeed: 175,
    acceleration: 8.2,
    handling: 10.0,
    nitroCapacity: 9.0,
    color: '#10b981', // Emerald Sprint Green
    accentColor: '#fbbf24', // Tour Yellow
    description: 'Ultra-lightweight aerodynamic carbon monocoque road racer with deep dish aero rims, drop handlebars, sprinting cyclist athlete, and razor-sharp line precision.',
  },
  {
    id: 'pro_skateboard',
    name: 'Venice Pro Street Skateboard',
    brand: 'Street Skater',
    class: 'Custom Maple Longboard',
    vehicleType: 'skateboard',
    topSpeed: 195,
    acceleration: 8.8,
    handling: 9.8,
    nitroCapacity: 8.0,
    color: '#f97316', // Venice Sunset Orange
    accentColor: '#a855f7', // Graffiti Purple
    description: 'High-speed downhill carving skateboard with 7-ply Canadian maple deck, raw alloy trucks, urethane slide wheels, and crouched skater carving heavy drift lines.',
  },
];

export const PAINT_COLORS = [
  { name: 'Rosso Corsa Red', hex: '#d40000' },
  { name: 'Porsche Shark Blue', hex: '#0066cc' },
  { name: 'Modena Giallo Yellow', hex: '#ffcc00' },
  { name: 'Verde Mantis Green', hex: '#10b981' },
  { name: 'Guards Red', hex: '#e11d48' },
  { name: 'GT Silver Metallic', hex: '#94a3b8' },
  { name: 'Nero Daytona Black', hex: '#0f172a' },
  { name: 'Pure Bianco White', hex: '#f8fafc' },
  { name: 'Electric Hyper Cyan', hex: '#00e5ff' },
];

export const ACCENT_COLORS = [
  { name: 'Modena Yellow', hex: '#ffd700' },
  { name: 'Racing Crimson', hex: '#ff0055' },
  { name: 'Acid Lime', hex: '#00ff66' },
  { name: 'Carbon Black', hex: '#1e293b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Sky Cyan', hex: '#00f2ff' },
];
