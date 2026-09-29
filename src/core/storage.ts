/**
 * storage.ts — Local persistence layer using the Web Storage API.
 */

import type { ThemeChoice, Vehicle } from '../models';
import { AVAILABLE_THEMES, DRIVING_MODES } from '../models';

const STORAGE_KEY_VEHICLES = 'my-garage:vehicles';
const LEGACY_KEY_VEHICLES = 'mon-garage:vehicules';
const STORAGE_KEY_THEME = 'my-garage:theme';
const LEGACY_KEY_THEME = 'mon-garage:theme';

export function loadVehicles(): Vehicle[] | null {
  try {
    const rawData =
      localStorage.getItem(STORAGE_KEY_VEHICLES) ?? localStorage.getItem(LEGACY_KEY_VEHICLES);
    if (!rawData) return null;
    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) return null;

    const vehicles = (parsed as Vehicle[]).map((vehicle) => ({
      ...vehicle,
      drivingMode: DRIVING_MODES.includes(vehicle.drivingMode) ? vehicle.drivingMode : 'comfort',
      modeSettings: vehicle.modeSettings ?? {},
    }));

    if (
      (parsed as Vehicle[]).some(
        (vehicle) =>
          !DRIVING_MODES.includes(vehicle.drivingMode) || vehicle.modeSettings === undefined,
      )
    ) {
      saveVehicles(vehicles);
    }

    return vehicles;
  } catch {
    return null;
  }
}

export function saveVehicles(vehicles: readonly Vehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
  } catch (error) {
    console.warn('Unable to save vehicles to localStorage', error);
  }
}

export function loadTheme(): ThemeChoice {
  try {
    const theme =
      localStorage.getItem(STORAGE_KEY_THEME) ?? localStorage.getItem(LEGACY_KEY_THEME);
    if (theme && (AVAILABLE_THEMES as readonly string[]).includes(theme)) {
      return theme as ThemeChoice;
    }
    if (theme === 'clair') return 'light';
    if (theme === 'sombre') return 'dark';
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function saveTheme(theme: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    /* silent fail */
  }
}
