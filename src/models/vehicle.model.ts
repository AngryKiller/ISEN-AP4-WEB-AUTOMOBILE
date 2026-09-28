/**
 * vehicle.model.ts — Data models and types for garage vehicles.
 */

export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

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
