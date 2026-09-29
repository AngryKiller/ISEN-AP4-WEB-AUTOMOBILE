/**
 * api.model.ts — Types des réponses de l'API REST publique NHTSA.
 */

import type { DriveType, FuelType, TransmissionType } from './vehicle.model';

export interface NhtsaModelResult {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

export interface NhtsaApiResponse<T> {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: T[];
}

export interface VehicleSpecs {
  make?: string;
  model?: string;
  year?: number;
  fuel?: FuelType;
  transmissionType?: TransmissionType;
  wheelRimInches?: number;
  recommendedTirePressure?: number;
  trunkCapacityLiters?: number;
  averageConsumption?: number;
  driveType?: DriveType;
  countryOfOrigin?: string;
  origin?: 'us' | 'eu' | 'unknown';
  source?: string;
}

export interface AdemeCarResult {
  Marque?: string;
  Modèle?: string;
  Libellé_modèle?: string;
  Description_Commerciale?: string;
  Energie?: string;
  Type_de_boite?: string;
  Nombre_rapports?: number;
  Conso_vitesse_mixte_Min?: number;
  Conso_vitesse_mixte_Max?: number;
}

export interface NhtsaVinDecodeResult {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  FuelTypePrimary?: string;
  FuelTypeSecondary?: string;
  ElectrificationLevel?: string;
  TransmissionStyle?: string;
  TransmissionSpeeds?: string;
  DriveType?: string;
  WheelSizeFront?: string;
  WheelSizeRear?: string;
  BatteryKWh?: string;
}
