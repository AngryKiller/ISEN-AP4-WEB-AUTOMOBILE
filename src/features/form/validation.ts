/**
 * validation.ts — Validation rules for vehicle inputs.
 */

import type { FuelType, ValidationErrors, VehicleFormInput } from '../../models';

const MIN_YEAR = 1886; // First automobile patent (Benz Patent-Motorwagen)
const MAX_YEAR = new Date().getFullYear() + 1;
const LICENSE_PLATE_REGEX = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;

export function validateVehicle(data: VehicleFormInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.make) {
    errors.make = 'La marque est obligatoire.';
  } else if (data.make.length < 2) {
    errors.make = 'Au moins 2 caractères.';
  }

  if (!data.model) {
    errors.model = 'Le modèle est obligatoire.';
  }

  if (Number.isNaN(data.year)) {
    errors.year = "L'année est obligatoire.";
  } else if (data.year < MIN_YEAR || data.year > MAX_YEAR) {
    errors.year = `Entre ${MIN_YEAR} et ${MAX_YEAR}.`;
  }

  if (Number.isNaN(data.mileage)) {
    errors.mileage = 'Le kilométrage est obligatoire.';
  } else if (data.mileage < 0) {
    errors.mileage = 'Doit être positif.';
  } else if (data.mileage > 2_000_000) {
    errors.mileage = 'Valeur irréaliste.';
  }

  if (Number.isNaN(data.price)) {
    errors.price = 'Le prix est obligatoire.';
  } else if (data.price < 0) {
    errors.price = 'Doit être positif.';
  }

  if (!data.fuel) {
    errors.fuel = 'Choisissez un carburant.';
  }

  if (data.licensePlate && !LICENSE_PLATE_REGEX.test(data.licensePlate)) {
    errors.licensePlate = 'Format attendu : AB-123-CD.';
  }

  if (typeof data.nextOilChangeKm === 'number' && Number.isNaN(data.nextOilChangeKm)) {
    errors.nextOilChangeKm = 'Valeur invalide.';
  } else if (typeof data.nextOilChangeKm === 'number' && data.nextOilChangeKm < 0) {
    errors.nextOilChangeKm = 'Doit être positif.';
  }

  if (typeof data.nextRevisionKm === 'number' && Number.isNaN(data.nextRevisionKm)) {
    errors.nextRevisionKm = 'Valeur invalide.';
  } else if (typeof data.nextRevisionKm === 'number' && data.nextRevisionKm < 0) {
    errors.nextRevisionKm = 'Doit être positif.';
  }

  if (data.maintenanceNotes && data.maintenanceNotes.length > 200) {
    errors.maintenanceNotes = 'Maximum 200 caractères.';
  }

  if (typeof data.tirePressure === 'number' && Number.isNaN(data.tirePressure)) {
    errors.tirePressure = 'Valeur invalide.';
  } else if (typeof data.tirePressure === 'number' && (data.tirePressure < 0 || data.tirePressure > 6)) {
    errors.tirePressure = 'Pression entre 0 et 6 bar.';
  }

  if (
    typeof data.recommendedTirePressure === 'number' &&
    Number.isNaN(data.recommendedTirePressure)
  ) {
    errors.recommendedTirePressure = 'Valeur invalide.';
  } else if (
    typeof data.recommendedTirePressure === 'number' &&
    (data.recommendedTirePressure < 0 || data.recommendedTirePressure > 6)
  ) {
    errors.recommendedTirePressure = 'Pression entre 0 et 6 bar.';
  }

  return errors;
}

/** Converts raw FormData values into a clean, typed object */
export function normalizeFormData(formData: FormData): VehicleFormInput {
  const readText = (key: string): string => String(formData.get(key) ?? '').trim();
  const readNumber = (key: string): number => {
    const raw = readText(key);
    return raw === '' ? NaN : Number(raw);
  };

  const rawFuel = readText('fuel') || readText('carburant');
  let fuel: FuelType | '' = '';
  if (rawFuel === 'petrol' || rawFuel === 'essence') fuel = 'petrol';
  else if (rawFuel === 'diesel') fuel = 'diesel';
  else if (rawFuel === 'hybrid' || rawFuel === 'hybride') fuel = 'hybrid';
  else if (rawFuel === 'electric' || rawFuel === 'electrique') fuel = 'electric';

  const make = readText('make') || readText('marque');
  const model = readText('model') || readText('modele');
  const year = !Number.isNaN(readNumber('year')) ? readNumber('year') : readNumber('annee');
  const mileage = !Number.isNaN(readNumber('mileage'))
    ? readNumber('mileage')
    : readNumber('kilometrage');
  const price = !Number.isNaN(readNumber('price')) ? readNumber('price') : readNumber('prix');
  const licensePlate = (readText('licensePlate') || readText('immatriculation')).toUpperCase();
  const color = readText('color') || readText('couleur') || '#e63946';
  const nextOilChangeKm = readNumber('nextOilChangeKm');
  const nextRevisionKm = readNumber('nextRevisionKm');
  const lastRevisionDate = readText('lastRevisionDate');
  const maintenanceNotes = readText('maintenanceNotes');
  const tirePressure = readNumber('tirePressure');
  const recommendedTirePressure = readNumber('recommendedTirePressure');

  return {
    make,
    model,
    year,
    mileage,
    price,
    fuel,
    licensePlate,
    color,
    nextOilChangeKm: Number.isNaN(nextOilChangeKm) ? undefined : nextOilChangeKm,
    nextRevisionKm: Number.isNaN(nextRevisionKm) ? undefined : nextRevisionKm,
    lastRevisionDate: lastRevisionDate || undefined,
    maintenanceNotes: maintenanceNotes || undefined,
    tirePressure: Number.isNaN(tirePressure) ? undefined : tirePressure,
    recommendedTirePressure: Number.isNaN(recommendedTirePressure)
      ? undefined
      : recommendedTirePressure,
  };
}
