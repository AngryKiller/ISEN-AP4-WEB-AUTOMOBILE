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

  return {
    make,
    model,
    year,
    mileage,
    price,
    fuel,
    licensePlate,
    color,
  };
}
