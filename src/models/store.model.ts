/**
 * store.model.ts — State models and reactive store types.
 */

import type { FuelType, Vehicle } from './vehicle.model';

export type SortOption =
  | 'recent'
  | 'year-desc'
  | 'year-asc'
  | 'price-desc'
  | 'price-asc'
  | 'mileage-asc'
  | 'make';

export type FilterOption = 'all' | 'favorites' | FuelType;

export interface GarageState {
  vehicles: Vehicle[];
  searchQuery: string;
  filter: FilterOption;
  sortBy: SortOption;
}

export interface GarageStatistics {
  total: number;
  favorites: number;
  totalValue: number;
  averageMileage: number;
}

export type GarageStateKey = keyof GarageState;

export type StateChangeListener<K extends GarageStateKey = GarageStateKey> = (
  property: K,
  newValue: GarageState[K],
  oldValue?: GarageState[K],
) => void;
