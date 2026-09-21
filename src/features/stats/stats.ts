/**
 * stats.ts — Garage statistics rendering and animated counter values.
 */

import { computeStatistics } from '../../core/store';
import { formatCurrency, formatMileage } from '../../utils';

export function renderStatistics(): void {
  const stats = computeStatistics();
  animateNumericValue('stat-total', String(stats.total));
  animateNumericValue('stat-favoris', String(stats.favorites));
  animateNumericValue('stat-valeur', formatCurrency(stats.totalValue));
  animateNumericValue('stat-km', formatMileage(stats.averageMileage));
}

function animateNumericValue(elementId: string, text: string): void {
  const element = document.getElementById(elementId);
  if (!element || element.textContent === text) return;
  element.textContent = text;
  element.classList.remove('stat__value--updated');
  void element.offsetWidth;
  element.classList.add('stat__value--updated');
}
