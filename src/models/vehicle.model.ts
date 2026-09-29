/**
 * vehicle.model.ts — Data models and types for garage vehicles.
 */

export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSION_TYPES = [
  'manual-5',
  'manual-6',
  'automatic-6',
  'automatic-8',
  'automatic-10',
  'dual-clutch',
  'cvt',
  'automated-manual',
  'sequential',
] as const;

export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  'manual-5': 'Manuelle, 5 rapports',
  'manual-6': 'Manuelle, 6 rapports',
  'automatic-6': 'Automatique, 6 rapports',
  'automatic-8': 'Automatique, 8 rapports',
  'automatic-10': 'Automatique, 10 rapports',
  'dual-clutch': 'Double embrayage (DCT)',
  cvt: 'Variation continue (CVT)',
  'automated-manual': 'Robotisée à simple embrayage',
  sequential: 'Séquentielle',
};

export const DRIVING_MODES = ['comfort', 'sport', 'eco', 'rain', 'winter'] as const;

export type DrivingMode = (typeof DRIVING_MODES)[number];

export interface DrivingModeSettings {
  recommendedTirePressure?: number;
  targetConsumption?: number;
  note?: string;
}

/** Complete Vehicle entity stored and used across the application */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: FuelType;
  transmissionType?: TransmissionType;
  licensePlate?: string;
  color: string;
  favorite: boolean;
  drivingMode: DrivingMode;
  modeSettings: Partial<Record<DrivingMode, DrivingModeSettings>>;
  createdAt: number;
  updatedAt?: number;
  nextOilChangeKm?: number;
  nextRevisionKm?: number;
  lastRevisionDate?: string;
  maintenanceNotes?: string;
  tirePressure?: number;
  recommendedTirePressure?: number;
}

/** Raw form input data before creating a complete vehicle */
export interface VehicleFormInput {
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: FuelType | '';
  transmissionType: TransmissionType | '';
  licensePlate: string;
  color: string;
  nextOilChangeKm?: number;
  nextRevisionKm?: number;
  lastRevisionDate?: string;
  maintenanceNotes?: string;
  tirePressure?: number;
  recommendedTirePressure?: number;
}

/** Data required to create a new vehicle (id, favorite, createdAt are auto-generated) */
export type VehicleCreationData = Omit<
  Vehicle,
  'id' | 'favorite' | 'drivingMode' | 'modeSettings' | 'createdAt' | 'updatedAt'
>;

/** Partial data for updating an existing vehicle */
export type VehicleUpdateData = Partial<Omit<Vehicle, 'id' | 'createdAt'>>;
