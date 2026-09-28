/**
 * store.ts — Global application state synchronized with DOM via a Proxy.
 */

import { loadVehicles, saveVehicles } from './storage';
import type {
  GarageState,
  GarageStateKey,
  GarageStatistics,
  DrivingMode,
  DrivingModeSettings,
  SortOption,
  StateChangeListener,
  Vehicle,
  VehicleCreationData,
  VehicleUpdateData,
} from '../models';

const listeners = new Set<StateChangeListener>();

const storedVehicles = loadVehicles();
const initialState: GarageState = {
  vehicles: storedVehicles ? [...storedVehicles] : [],
  searchQuery: '',
  filter: 'all',
  sortBy: 'recent',
};

export const store = new Proxy(initialState, {
  set<K extends GarageStateKey>(
    target: GarageState,
    property: string | symbol,
    value: GarageState[K],
  ): boolean {
    if (typeof property === 'symbol' || !(property in target)) {
      return Reflect.set(target, property, value);
    }

    const key = property as GarageStateKey;
    const previousValue = target[key];
    (target as any)[key] = value;

    if (key === 'vehicles') {
      saveVehicles(value as Vehicle[]);
    }

    listeners.forEach((listener) => listener(key, value, previousValue));
    return true;
  },
});

export function onStateChange(listener: StateChangeListener): () => boolean {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function addVehicle(data: VehicleCreationData): Vehicle {
  const newVehicle: Vehicle = {
    ...data,
    id: crypto.randomUUID(),
    favorite: false,
    drivingMode: 'comfort',
    modeSettings: {},
    createdAt: Date.now(),
  };
  store.vehicles = [newVehicle, ...store.vehicles];
  return newVehicle;
}

export function updateVehicle(id: string, data: VehicleUpdateData): void {
  store.vehicles = store.vehicles.map((vehicle) =>
    vehicle.id === id ? { ...vehicle, ...data, updatedAt: Date.now() } : vehicle,
  );
}

export function deleteVehicle(id: string): void {
  store.vehicles = store.vehicles.filter((vehicle) => vehicle.id !== id);
}

export function toggleFavorite(id: string): void {
  store.vehicles = store.vehicles.map((vehicle) =>
    vehicle.id === id ? { ...vehicle, favorite: !vehicle.favorite } : vehicle,
  );
}

export function setDrivingMode(id: string, drivingMode: DrivingMode): void {
  store.vehicles = store.vehicles.map((vehicle) =>
    vehicle.id === id ? { ...vehicle, drivingMode, updatedAt: Date.now() } : vehicle,
  );
}

export function updateDrivingModeSettings(
  id: string,
  drivingMode: DrivingMode,
  settings: DrivingModeSettings,
): void {
  store.vehicles = store.vehicles.map((vehicle) =>
    vehicle.id === id
      ? {
          ...vehicle,
          modeSettings: { ...vehicle.modeSettings, [drivingMode]: settings },
          updatedAt: Date.now(),
        }
      : vehicle,
  );
}

export function findVehicleById(id: string): Vehicle | undefined {
  return store.vehicles.find((vehicle) => vehicle.id === id);
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

type SortComparator = (a: Vehicle, b: Vehicle) => number;

const SORT_COMPARATORS: Record<SortOption, SortComparator> = {
  recent: (a, b) => b.createdAt - a.createdAt,
  'year-desc': (a, b) => b.year - a.year,
  'year-asc': (a, b) => a.year - b.year,
  'price-desc': (a, b) => b.price - a.price,
  'price-asc': (a, b) => a.price - b.price,
  'mileage-asc': (a, b) => a.mileage - b.mileage,
  make: (a, b) => a.make.localeCompare(b.make, 'fr') || a.model.localeCompare(b.model, 'fr'),
};

export function getVisibleVehicles(): Vehicle[] {
  const query = store.searchQuery.trim().toLowerCase();

  return store.vehicles
    .filter((vehicle) => {
      if (store.filter === 'favorites') return vehicle.favorite;
      if (store.filter !== 'all') return vehicle.fuel === store.filter;
      return true;
    })
    .filter((vehicle) => {
      if (!query) return true;
      return `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate ?? ''}`
        .toLowerCase()
        .includes(query);
    })
    .sort(SORT_COMPARATORS[store.sortBy] ?? SORT_COMPARATORS.recent);
}

export function computeStatistics(): GarageStatistics {
  const list = store.vehicles;
  const total = list.length;
  return {
    total,
    favorites: list.filter((vehicle) => vehicle.favorite).length,
    totalValue: list.reduce((sum, vehicle) => sum + vehicle.price, 0),
    averageMileage: total
      ? Math.round(list.reduce((sum, vehicle) => sum + vehicle.mileage, 0) / total)
      : 0,
  };
}
