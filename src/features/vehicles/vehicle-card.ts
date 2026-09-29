/**
 * vehicle-card.ts — Creation, updates, and animations of individual vehicle cards.
 */

import { TRANSMISSION_LABELS, type Vehicle } from '../../models';
import { formatCurrency, formatMileage, FUEL_LABELS } from '../../utils';
import { getDrivingModeOption } from '../driving-mode';

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
  if (subtitle) {
    const details: string[] = [];
    if (vehicle.wheelRimInches) {
      details.push(`Jantes ${vehicle.wheelRimInches} pouces`);
    }
    if (vehicle.transmissionType) {
      details.push(TRANSMISSION_LABELS[vehicle.transmissionType]);
    }
    subtitle.textContent = details.length ? `${vehicle.year} · ${details.join(' · ')}` : `${vehicle.year}`;
  }

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

  const maintenanceContainer = card.querySelector<HTMLElement>('.card__maintenance');
  const maintenanceList = card.querySelector<HTMLElement>('.card__maintenance-list');
  if (maintenanceContainer && maintenanceList) {
    const lines: string[] = [];
    if (typeof vehicle.nextOilChangeKm === 'number') {
      lines.push(`Vidange : ${formatMileage(vehicle.nextOilChangeKm)} km`);
    }
    if (typeof vehicle.nextRevisionKm === 'number') {
      lines.push(`Révision : ${formatMileage(vehicle.nextRevisionKm)} km`);
    }
    if (vehicle.lastRevisionDate) {
      lines.push(`Dernière révision : ${vehicle.lastRevisionDate}`);
    }
    if (typeof vehicle.tirePressure === 'number') {
      const recommended = typeof vehicle.recommendedTirePressure === 'number'
        ? ` / ${vehicle.recommendedTirePressure.toFixed(1)} bar`
        : '';
      lines.push(`Pression pneus : ${vehicle.tirePressure.toFixed(1)} bar${recommended}`);
    } else if (typeof vehicle.recommendedTirePressure === 'number') {
      lines.push(`Pression recommandée : ${vehicle.recommendedTirePressure.toFixed(1)} bar`);
    }
    if (!lines.length) {
      maintenanceContainer.hidden = true;
      maintenanceList.innerHTML = '';
    } else {
      maintenanceContainer.hidden = false;
      maintenanceList.innerHTML = lines
        .map((line) => `<li class="card__maintenance-item">${line}</li>`)
        .join('');
    }
  }

  const drivingMode = getDrivingModeOption(vehicle.drivingMode);
  const modeSettings = vehicle.modeSettings[vehicle.drivingMode] ?? {};
  const drivingCurrent = card.querySelector<HTMLElement>('.card__driving-current');
  if (drivingCurrent) drivingCurrent.textContent = `Mode sélectionné : ${drivingMode.icon} ${drivingMode.label}`;

  card.querySelectorAll<HTMLButtonElement>('[data-action="mode-conduite"]').forEach((button) => {
    const isSelected = button.dataset.mode === vehicle.drivingMode;
    button.classList.toggle('card__driving-option--active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });

  const recommendationsList = card.querySelector<HTMLElement>('.card__driving-recommendations');
  if (recommendationsList) {
    recommendationsList.replaceChildren(
      ...drivingMode.recommendations.map((recommendation) => {
        const item = document.createElement('li');
        item.textContent = recommendation;
        return item;
      }),
    );
    recommendationsList.classList.remove('card__driving-recommendations--visible');
    void recommendationsList.offsetWidth;
    recommendationsList.classList.add('card__driving-recommendations--visible');
  }

  const isElectric = vehicle.fuel === 'electric';

  const pressureField = card.querySelector<HTMLElement>('[data-setting-field="tire-pressure"]');
  if (pressureField) {
    pressureField.classList.toggle('card__driving-field--wide', isElectric);
  }

  const pressureInput = card.querySelector<HTMLInputElement>('[data-setting="tire-pressure"]');
  if (pressureInput) {
    const pressure = modeSettings.recommendedTirePressure ?? vehicle.recommendedTirePressure;
    pressureInput.value = typeof pressure === 'number' ? String(pressure) : '';
  }

  const consumptionField = card.querySelector<HTMLElement>('[data-setting-field="consumption"]');
  if (consumptionField) {
    consumptionField.hidden = isElectric;
  }

  const consumptionInput = card.querySelector<HTMLInputElement>('[data-setting="consumption"]');
  if (consumptionInput) {
    consumptionInput.value =
      !isElectric && typeof modeSettings.targetConsumption === 'number'
        ? String(modeSettings.targetConsumption)
        : '';
  }

  const noteInput = card.querySelector<HTMLTextAreaElement>('[data-setting="note"]');
  if (noteInput) noteInput.value = modeSettings.note ?? '';

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
