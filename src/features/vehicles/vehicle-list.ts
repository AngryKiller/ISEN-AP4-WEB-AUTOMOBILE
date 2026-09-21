/**
 * vehicle-list.ts — Keyed reconciliation and grid rendering of the vehicle list.
 */

import { getVisibleVehicles } from '../../core/store';
import {
  createCardElement,
  removeCardElement,
  renderedCards,
  updateCardContent,
} from './vehicle-card';

const garageGrid = document.getElementById('garage') as HTMLElement | null;
const emptyState = document.getElementById('vide') as HTMLElement | null;

export function renderVehicleList(): void {
  if (!garageGrid) return;
  const visibleList = getVisibleVehicles();
  const visibleIds = new Set(visibleList.map((v) => v.id));

  // Remove exiting cards
  for (const id of [...renderedCards.keys()]) {
    if (!visibleIds.has(id)) removeCardElement(id);
  }

  // Create or update cards in sorted order
  visibleList.forEach((vehicle, index) => {
    let card = renderedCards.get(vehicle.id);
    if (!card) {
      card = createCardElement(vehicle);
      renderedCards.set(vehicle.id, card);
    } else {
      updateCardContent(card, vehicle);
    }

    const currentChildren = [...garageGrid.children].filter(
      (element) => !element.classList.contains('card--exit'),
    );
    if (currentChildren[index] !== card) {
      garageGrid.insertBefore(card, currentChildren[index] ?? null);
    }
  });

  if (emptyState) {
    emptyState.hidden = visibleList.length > 0;
  }
}
