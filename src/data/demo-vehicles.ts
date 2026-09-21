/**
 * demo-vehicles.ts — Initial vehicles displayed on first launch.
 */

import type { Vehicle } from '../models';

export const DEMO_VEHICLES: readonly Vehicle[] = [
  {
    id: 'demo-1',
    make: 'Peugeot',
    model: '208 GT',
    year: 2021,
    mileage: 32000,
    price: 17500,
    fuel: 'petrol',
    licensePlate: 'GA-208-PG',
    color: '#f4b400',
    favorite: true,
    createdAt: 4,
  },
  {
    id: 'demo-2',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    mileage: 12500,
    price: 36900,
    fuel: 'electric',
    licensePlate: 'GT-333-EV',
    color: '#e63946',
    favorite: false,
    createdAt: 3,
  },
  {
    id: 'demo-3',
    make: 'Volkswagen',
    model: 'Golf VII',
    year: 2017,
    mileage: 98000,
    price: 11200,
    fuel: 'diesel',
    licensePlate: 'EK-477-VW',
    color: '#457b9d',
    favorite: false,
    createdAt: 2,
  },
  {
    id: 'demo-4',
    make: 'Toyota',
    model: 'Yaris Hybride',
    year: 2020,
    mileage: 54000,
    price: 14800,
    fuel: 'hybrid',
    licensePlate: 'FR-120-TY',
    color: '#2a9d8f',
    favorite: true,
    createdAt: 1,
  },
];
