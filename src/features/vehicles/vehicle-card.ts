/**
 * vehicle-card.ts — Creation, updates, and animations of individual vehicle cards.
 */

import { DRIVE_LABELS, TRANSMISSION_LABELS, type Vehicle } from '../../models';
import { formatCurrency, formatMileage, FUEL_LABELS, MOTORIZATION_LABELS } from '../../utils';
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
    if (vehicle.driveType) {
      details.push(DRIVE_LABELS[vehicle.driveType] ?? vehicle.driveType);
    }
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

  const trunkElem = card.querySelector<HTMLElement>('.card__trunk');
  const trunkContainer = card.querySelector<HTMLElement>('.card__info-trunk');
  if (trunkElem && trunkContainer) {
    if (typeof vehicle.trunkCapacityLiters === 'number') {
      trunkElem.textContent = `${vehicle.trunkCapacityLiters} L`;
      trunkContainer.hidden = false;
    } else {
      trunkContainer.hidden = true;
    }
  }

  const avgConsoElem = card.querySelector<HTMLElement>('.card__avg-consumption');
  const avgConsoContainer = card.querySelector<HTMLElement>('.card__info-consumption');
  if (avgConsoElem && avgConsoContainer) {
    if (typeof vehicle.averageConsumption === 'number') {
      const unit = vehicle.motorization === 'electric' ? 'kWh/100' : 'L/100';
      avgConsoElem.textContent = `${vehicle.averageConsumption} ${unit}`;
      avgConsoContainer.hidden = false;
    } else {
      avgConsoContainer.hidden = true;
    }
  }

  const fuelBadge = card.querySelector<HTMLElement>('.card__fuel');
  if (fuelBadge) {
    const motorization = MOTORIZATION_LABELS[vehicle.motorization] ?? vehicle.motorization;
    const fuel = vehicle.fuel ? FUEL_LABELS[vehicle.fuel] : null;

    fuelBadge.textContent = fuel
      ? `${motorization} · ${fuel}`
      : motorization;
    fuelBadge.dataset.fuel =
      vehicle.motorization === 'hybrid'
        ? 'hybrid'
        : (vehicle.fuel ?? vehicle.motorization);
    fuelBadge.dataset.motorization = vehicle.motorization;
  }

  const countryBadge = card.querySelector<HTMLElement>('.card__country');
  if (countryBadge) {
    if (vehicle.countryOfOrigin) {
      const flagMap: Record<string, string> = {
        France: '🇫🇷',
        Allemagne: '🇩🇪',
        'Royaume-Uni': '🇬🇧',
        Italie: '🇮🇹',
        Espagne: '🇪🇸',
        Suède: '🇸🇪',
        'République Tchèque': '🇨🇿',
        Roumanie: '🇷🇴',
        Japon: '🇯🇵',
        'Corée du Sud': '🇰🇷',
        USA: '🇺🇸',
        Canada: '🇨🇦',
        Mexique: '🇲🇽',
      };
      const flag = flagMap[vehicle.countryOfOrigin] ?? '🌍';
      countryBadge.textContent = `${flag} ${vehicle.countryOfOrigin}`;
      countryBadge.hidden = false;
    } else {
      countryBadge.hidden = true;
    }
  }

  const maintenanceContainer = card.querySelector<HTMLElement>('.card__maintenance');
  const maintenanceList = card.querySelector<HTMLElement>('.card__maintenance-list');
  if (maintenanceContainer && maintenanceList) {
    const lines: string[] = [];
    if (vehicle.motorization !== 'electric' && typeof vehicle.nextOilChangeKm === 'number') {
      lines.push(`Vidange : ${formatMileage(vehicle.nextOilChangeKm)}`);
    }
    if (typeof vehicle.nextRevisionKm === 'number') {
      lines.push(`Révision : ${formatMileage(vehicle.nextRevisionKm)}`);
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

  const drivingMode = getDrivingModeOption(vehicle.drivingMode, vehicle);
  const modeSettings = vehicle.modeSettings[vehicle.drivingMode] ?? {};
  const drivingCurrent = card.querySelector<HTMLElement>('.card__driving-current');
  if (drivingCurrent) {
    drivingCurrent.replaceChildren();

    const icon = document.createElement('img');
    icon.src = drivingMode.icon;
    icon.alt = '';
    icon.className = 'card__driving-icon';

    const text = document.createElement('span');
    text.className = 'card__driving-current-text';
    text.textContent = `Mode sélectionné : ${drivingMode.label}`;

    drivingCurrent.append(icon, text);
  }

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

  const isElectric = vehicle.motorization === 'electric';

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
