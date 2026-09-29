/**
 * formatters.ts — Formatting helpers for currency, mileage, and debounce utility.
 */

import type { FuelType, MotorizationType } from '../models';

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('fr-FR');

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount);
export const formatNumber = (value: number): string => numberFormatter.format(value);
export const formatMileage = (distance: number): string => `${numberFormatter.format(distance)} km`;

export const FUEL_LABELS: Record<FuelType, string> = {
  petrol: 'Essence',
  diesel: 'Diesel',
};

export const MOTORIZATION_LABELS: Record<MotorizationType, string> = {
  thermal: 'Thermique',
  electric: 'Électrique',
  hybrid: 'Hybride',
};

/** Delays function execution until quiet period has passed */
export function debounce<T extends (...args: readonly any[]) => void>(
  callback: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timerId !== undefined) clearTimeout(timerId);
    timerId = setTimeout(() => callback(...args), delay);
  };
}
