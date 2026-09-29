/**
 * store.model.ts — State models and reactive store types.
 */

import type { MotorizationType, Vehicle } from './vehicle.model';

export type SortOption =
  | 'recent'
  | 'year-desc'
  | 'year-asc'
  | 'price-desc'
  | 'price-asc'
  | 'mileage-asc'
  | 'make'
  | 'trunk-desc';

export type FilterOption = 'all' | 'favorites' | MotorizationType;

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
  totalTrunkCapacity: number;
}

export type GarageStateKey = keyof GarageState;

export type StateChangeListener<K extends GarageStateKey = GarageStateKey> = (
  property: K,
  newValue: GarageState[K],
  oldValue?: GarageState[K],
) => void;
