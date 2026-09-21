/**
 * vehicle-card.ts — Creation, updates, and animations of individual vehicle cards.
 */

import type { Vehicle } from '../../models';
import { formatCurrency, formatMileage, FUEL_LABELS } from '../../utils';

const cardTemplate = document.getElementById('tpl-carte') as HTMLTemplateElement | null;

/** Card elements cache: vehicle id -> card article element */
export const renderedCards = new Map<string, HTMLElement>();

export function createCardElement(vehicle: Vehicle): HTMLElement {
  if (!cardTemplate) throw new Error('Template #tpl-carte not found');

  const fragment = cardTemplate.content.cloneNode(true) as DocumentFragment;
  const card = fragment.firstElementChild as HTMLElement;
  card.dataset.id = vehicle.id;
  card.classList.add('card--enter');
  card.addEventListener(
    'animationend',
    () => {
      card.classList.remove('card--enter');
    },
    { once: true },
  );
  updateCardContent(card, vehicle);
  return card;
}

export function updateCardContent(card: HTMLElement, vehicle: Vehicle): void {
  const banner = card.querySelector<HTMLElement>('.card__banner');
  if (banner) banner.style.background = vehicle.color;

  const title = card.querySelector<HTMLElement>('.card__title');
  if (title) title.textContent = `${vehicle.make} ${vehicle.model}`;

  const subtitle = card.querySelector<HTMLElement>('.card__subtitle');
  if (subtitle) subtitle.textContent = `${vehicle.year}`;

  const mileageElem = card.querySelector<HTMLElement>('.card__mileage');
  if (mileageElem) mileageElem.textContent = formatMileage(vehicle.mileage);

  const priceElem = card.querySelector<HTMLElement>('.card__price');
  if (priceElem) priceElem.textContent = formatCurrency(vehicle.price);

  const plateElem = card.querySelector<HTMLElement>('.card__plate');
  if (plateElem) plateElem.textContent = vehicle.licensePlate || '—';

  const fuelBadge = card.querySelector<HTMLElement>('.card__fuel');
  if (fuelBadge) {
    fuelBadge.textContent = FUEL_LABELS[vehicle.fuel] ?? vehicle.fuel;
    fuelBadge.dataset.fuel = vehicle.fuel;
  }

  const favoriteButton = card.querySelector<HTMLButtonElement>('[data-action="favori"]');
  if (favoriteButton) {
    const isActive = vehicle.favorite;
    favoriteButton.classList.toggle('card__favorite--active', isActive);
    favoriteButton.setAttribute('aria-pressed', String(isActive));
    favoriteButton.setAttribute(
      'aria-label',
      isActive ? 'Retirer des favoris' : 'Ajouter aux favoris',
    );
  }
}

export function removeCardElement(id: string): void {
  const card = renderedCards.get(id);
  if (!card) return;
  renderedCards.delete(id);
  card.classList.add('card--exit');
  card.addEventListener('animationend', () => card.remove(), { once: true });
}

export function animateCardUpdate(id: string): void {
  const card = renderedCards.get(id);
  if (!card) return;
  card.classList.remove('card--modified');
  void card.offsetWidth;
  card.classList.add('card--modified');
}

export function animateHeartPop(id: string): void {
  const heart = renderedCards.get(id)?.querySelector('.card__heart') as HTMLElement | null;
  if (!heart) return;
  heart.classList.remove('card__heart--pop');
  void heart.offsetWidth;
  heart.classList.add('card__heart--pop');
}
