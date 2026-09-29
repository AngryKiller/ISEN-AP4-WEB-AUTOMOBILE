/**
 * main.ts — Application entry point: orchestrates modules and connects event listeners.
 */

import './styles/main.css';
import {
  deleteVehicle,
  findVehicleById,
  onStateChange,
  setDrivingMode,
  store,
  toggleFavorite,
  updateDrivingModeSettings,
} from './core';
import {
  animateHeartPop,
  renderVehicleList,
} from './features/vehicles';
import { renderStatistics } from './features/stats';
import { initVehicleForm, openVehicleForm } from './features/form';
import { initTheme } from './features/theme';
import { isDrivingMode } from './features/driving-mode';
import { debounce, showToast } from './utils';
import type { DrivingModeSettings, FilterOption, SortOption } from './models';

/* 1. Theme initialization */
initTheme();

/* 2. State change synchronization (Proxy -> DOM) */
onStateChange((property) => {
  renderVehicleList();
  if (property === 'vehicles') {
    renderStatistics();
  }
});

/* 3. Toolbar controls */
const searchInput = document.getElementById('recherche') as HTMLInputElement | null;
searchInput?.addEventListener(
  'input',
  debounce((event: Event) => {
    store.searchQuery = (event.target as HTMLInputElement).value;
  }, 150),
);

const filterSelect = document.getElementById('filtre') as HTMLSelectElement | null;
filterSelect?.addEventListener('change', (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  let filterValue: FilterOption = 'all';
  if (value === 'all' || value === 'tous') filterValue = 'all';
  else if (value === 'favorites' || value === 'favoris') filterValue = 'favorites';
  else if (value === 'petrol' || value === 'essence') filterValue = 'petrol';
  else if (value === 'diesel') filterValue = 'diesel';
  else if (value === 'hybrid' || value === 'hybride') filterValue = 'hybrid';
  else if (value === 'electric' || value === 'electrique') filterValue = 'electric';
  store.filter = filterValue;
});

const sortSelect = document.getElementById('tri') as HTMLSelectElement | null;
sortSelect?.addEventListener('change', (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  let sortOption: SortOption = 'recent';
  if (value === 'recent') sortOption = 'recent';
  else if (value === 'year-desc' || value === 'annee-desc') sortOption = 'year-desc';
  else if (value === 'year-asc' || value === 'annee-asc') sortOption = 'year-asc';
  else if (value === 'price-desc' || value === 'prix-desc') sortOption = 'price-desc';
  else if (value === 'price-asc' || value === 'prix-asc') sortOption = 'price-asc';
  else if (value === 'mileage-asc' || value === 'km-asc') sortOption = 'mileage-asc';
  else if (value === 'make' || value === 'marque') sortOption = 'make';
  store.sortBy = sortOption;
});

/* 4. Delegated vehicle card actions */
const garageContainer = document.getElementById('garage');
garageContainer?.addEventListener('click', (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>('[data-action]');
  if (!button) return;

  const card = button.closest<HTMLElement>('.card');
  const id = card?.dataset.id;
  if (!id) return;

  const vehicle = findVehicleById(id);

  switch (button.dataset.action) {
    case 'favori':
      animateHeartPop(id);
      toggleFavorite(id);
      break;

    case 'mode-conduite': {
      const mode = button.dataset.mode;
      if (isDrivingMode(mode)) {
        setDrivingMode(id, mode);
      }
      break;
    }

    case 'save-mode-settings': {
      if (!vehicle) break;

      const isElectric = vehicle.fuel === 'electric';
      const pressureInput = card?.querySelector<HTMLInputElement>('[data-setting="tire-pressure"]');
      const consumptionInput = card?.querySelector<HTMLInputElement>('[data-setting="consumption"]');
      const noteInput = card?.querySelector<HTMLTextAreaElement>('[data-setting="note"]');
      const pressure = pressureInput?.value.trim() ? Number(pressureInput.value) : undefined;
      const consumption = !isElectric && consumptionInput?.value.trim()
        ? Number(consumptionInput.value)
        : undefined;

      if (
        (pressure !== undefined && (Number.isNaN(pressure) || pressure < 0 || pressure > 6)) ||
        (!isElectric &&
          consumption !== undefined &&
          (Number.isNaN(consumption) || consumption < 0 || consumption > 50))
      ) {
        showToast('Vérifiez les valeurs des réglages.', 'danger');
        break;
      }

      const settings: DrivingModeSettings = {
        recommendedTirePressure: pressure,
        targetConsumption: isElectric ? undefined : consumption,
        note: noteInput?.value.trim() || undefined,
      };
      updateDrivingModeSettings(id, vehicle.drivingMode, settings);
      showToast('Réglages du mode enregistrés.', 'success');
      break;
    }

    case 'modifier':
      openVehicleForm(id);
      break;

    case 'supprimer':
      if (vehicle && confirm(`Supprimer ${vehicle.make} ${vehicle.model} du garage ?`)) {
        deleteVehicle(id);
        showToast(`${vehicle.make} ${vehicle.model} supprimé.`, 'danger');
      }
      break;
  }
});

/* 5. Initialize form */
initVehicleForm();

/* 6. Initial render */
renderVehicleList();
renderStatistics();
