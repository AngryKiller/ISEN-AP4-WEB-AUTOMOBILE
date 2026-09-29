/**
 * vehicle-form.ts — Add/edit modal dialog handling and autocompletion.
 */

import { fetchMakes, fetchModelsByMake } from '../../core/api';
import { addVehicle, findVehicleById, updateVehicle } from '../../core/store';
import { normalizeFormData, validateVehicle } from './validation';
import { debounce, showToast } from '../../utils';
import { animateCardUpdate } from '../vehicles/vehicle-card';
import type { ValidationErrors, Vehicle, VehicleCreationData } from '../../models';

const modalDialog = document.getElementById('modale') as HTMLDialogElement | null;
const vehicleForm = document.getElementById('formulaire') as HTMLFormElement | null;
const formTitle = document.getElementById('formulaire-titre') as HTMLElement | null;
const submitButton = document.getElementById('btn-valider') as HTMLButtonElement | null;
const makesDataList = document.getElementById('liste-marques') as HTMLDataListElement | null;
const modelsDataList = document.getElementById('liste-modeles') as HTMLDataListElement | null;
const modelsHint = document.getElementById('indice-modeles') as HTMLElement | null;

let currentRequestController: AbortController | null = null;

export function openVehicleForm(id: string | null = null): void {
  if (!vehicleForm || !modalDialog) return;

  vehicleForm.reset();
  clearValidationErrors();
  if (modelsDataList) modelsDataList.replaceChildren();
  if (modelsHint) modelsHint.textContent = '';

  const vehicle = id ? findVehicleById(id) : null;
  if (formTitle) formTitle.textContent = vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule';
  if (submitButton) submitButton.textContent = vehicle ? 'Enregistrer' : 'Ajouter';

  if (vehicle) {
    populateForm(vehicle);
    void loadModelSuggestions(vehicle.make);
  }

  modalDialog.showModal();
  const makeInput = (vehicleForm.elements.namedItem('make') ||
    vehicleForm.elements.namedItem('marque')) as HTMLInputElement | null;
  makeInput?.focus();
}

function populateForm(vehicle: Vehicle): void {
  if (!vehicleForm) return;

  const fieldMapping: Record<string, string | number | undefined> = {
    id: vehicle.id,
    make: vehicle.make,
    marque: vehicle.make,
    model: vehicle.model,
    modele: vehicle.model,
    year: vehicle.year,
    annee: vehicle.year,
    mileage: vehicle.mileage,
    kilometrage: vehicle.mileage,
    price: vehicle.price,
    prix: vehicle.price,
    fuel: vehicle.fuel,
    carburant:
      vehicle.fuel === 'petrol'
        ? 'essence'
        : vehicle.fuel === 'electric'
          ? 'electrique'
          : vehicle.fuel === 'hybrid'
            ? 'hybride'
            : 'diesel',
    licensePlate: vehicle.licensePlate,
    immatriculation: vehicle.licensePlate,
    color: vehicle.color,
    couleur: vehicle.color,
    nextOilChangeKm: vehicle.nextOilChangeKm,
    nextRevisionKm: vehicle.nextRevisionKm,
    lastRevisionDate: vehicle.lastRevisionDate,
    maintenanceNotes: vehicle.maintenanceNotes,
    wheelRimInches: vehicle.wheelRimInches,
    tirePressure: vehicle.tirePressure,
    recommendedTirePressure: vehicle.recommendedTirePressure,
  };

  for (const [key, value] of Object.entries(fieldMapping)) {
    const input = vehicleForm.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
    if (input && value !== undefined) {
      input.value = String(value);
    }
  }
}

function closeVehicleForm(): void {
  if (!modalDialog) return;
  modalDialog.classList.add('modal--closing');
  modalDialog.addEventListener(
    'animationend',
    () => {
      modalDialog.classList.remove('modal--closing');
      modalDialog.close();
    },
    { once: true },
  );
}

function displayValidationErrors(errors: ValidationErrors): void {
  if (!vehicleForm) return;
  clearValidationErrors();

  const errorKeyAliases: Record<string, string[]> = {
    make: ['make', 'marque'],
    model: ['model', 'modele'],
    year: ['year', 'annee'],
    mileage: ['mileage', 'kilometrage'],
    price: ['price', 'prix'],
    fuel: ['fuel', 'carburant'],
    licensePlate: ['licensePlate', 'immatriculation'],
    nextOilChangeKm: ['nextOilChangeKm'],
    nextRevisionKm: ['nextRevisionKm'],
    maintenanceNotes: ['maintenanceNotes'],
    wheelRimInches: ['wheelRimInches'],
    tirePressure: ['tirePressure'],
    recommendedTirePressure: ['recommendedTirePressure'],
  };

  for (const [field, message] of Object.entries(errors)) {
    const aliases = errorKeyAliases[field] ?? [field];
    for (const alias of aliases) {
      const errorElem = vehicleForm.querySelector(
        `[data-error="${alias}"], [data-erreur="${alias}"]`,
      );
      const inputElem = vehicleForm.elements.namedItem(alias) as HTMLElement | null;
      if (errorElem) errorElem.textContent = message ?? '';
      if (inputElem) {
        inputElem.setAttribute('aria-invalid', 'true');
        const container = inputElem.closest('.field');
        container?.classList.add('field--invalid');
      }
    }
  }

  const firstErrorKey = Object.keys(errors)[0];
  if (firstErrorKey) {
    const aliases = errorKeyAliases[firstErrorKey] ?? [firstErrorKey];
    for (const alias of aliases) {
      const firstInput = vehicleForm.elements.namedItem(alias) as HTMLElement | null;
      if (firstInput) {
        firstInput.focus();
        break;
      }
    }
  }
}

function clearValidationErrors(): void {
  if (!vehicleForm) return;
  vehicleForm
    .querySelectorAll('[data-error], [data-erreur]')
    .forEach((element) => (element.textContent = ''));
  vehicleForm
    .querySelectorAll('[aria-invalid]')
    .forEach((element) => element.removeAttribute('aria-invalid'));
  vehicleForm
    .querySelectorAll('.field--invalid')
    .forEach((element) => element.classList.remove('field--invalid'));
}

async function loadMakeOptions(): Promise<void> {
  if (!makesDataList) return;
  try {
    const makes = await fetchMakes();
    makesDataList.replaceChildren(
      ...makes.map((name) => {
        const option = document.createElement('option');
        option.value = name;
        return option;
      }),
    );
  } catch (error) {
    console.warn('Makes list unavailable', error);
  }
}

async function loadModelSuggestions(make: string): Promise<void> {
  if (!modelsDataList || !modelsHint) return;

  currentRequestController?.abort();
  currentRequestController = new AbortController();

  if (make.trim().length < 2) {
    modelsDataList.replaceChildren();
    modelsHint.textContent = '';
    return;
  }

  modelsHint.textContent = '⏳ recherche…';
  try {
    const models = await fetchModelsByMake(make, currentRequestController.signal);
    modelsDataList.replaceChildren(
      ...models.map((name) => {
        const option = document.createElement('option');
        option.value = name;
        return option;
      }),
    );
    modelsHint.textContent = models.length
      ? `${models.length} modèles suggérés (API NHTSA)`
      : 'aucune suggestion';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    modelsHint.textContent = 'suggestions indisponibles (hors-ligne ?)';
  }
}

export function initVehicleForm(): void {
  if (!vehicleForm || !modalDialog) return;

  void loadMakeOptions();

  document.getElementById('btn-ajouter')?.addEventListener('click', () => openVehicleForm());
  document.getElementById('btn-fermer')?.addEventListener('click', closeVehicleForm);
  document.getElementById('btn-annuler')?.addEventListener('click', closeVehicleForm);

  modalDialog.addEventListener('cancel', (event: Event) => {
    event.preventDefault();
    closeVehicleForm();
  });

  modalDialog.addEventListener('click', (event: MouseEvent) => {
    if (event.target === modalDialog) closeVehicleForm();
  });

  const makeInput = (vehicleForm.elements.namedItem('make') ||
    vehicleForm.elements.namedItem('marque')) as HTMLInputElement | null;
  makeInput?.addEventListener(
    'input',
    debounce((event: Event) => {
      const target = event.target as HTMLInputElement;
      void loadModelSuggestions(target.value);
    }, 350),
  );

  const plateInput = (vehicleForm.elements.namedItem('licensePlate') ||
    vehicleForm.elements.namedItem('immatriculation')) as HTMLInputElement | null;
  plateInput?.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLInputElement;
    target.value = target.value.toUpperCase();
  });

  vehicleForm.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const fieldContainer = target.closest('.field--invalid');
    if (!fieldContainer) return;

    const errors = validateVehicle(normalizeFormData(new FormData(vehicleForm)));
    const fieldName = target.name as keyof typeof errors;
    if (!errors[fieldName]) {
      fieldContainer.classList.remove('field--invalid');
      target.removeAttribute('aria-invalid');
      const errorMsg = vehicleForm.querySelector(
        `[data-error="${target.name}"], [data-erreur="${target.name}"]`,
      );
      if (errorMsg) errorMsg.textContent = '';
    }
  });

  vehicleForm.addEventListener('submit', (event: SubmitEvent) => {
    event.preventDefault();

    const formData = new FormData(vehicleForm);
    const data = normalizeFormData(formData);
    const errors = validateVehicle(data);

    if (Object.keys(errors).length > 0) {
      displayValidationErrors(errors);
      vehicleForm.classList.remove('form--shake');
      void vehicleForm.offsetWidth;
      vehicleForm.classList.add('form--shake');
      return;
    }

    const id = formData.get('id');
    if (typeof id === 'string' && id) {
      updateVehicle(id, data as Partial<Vehicle>);
      animateCardUpdate(id);
      showToast(`${data.make} ${data.model} modifié.`, 'success');
    } else {
      addVehicle(data as VehicleCreationData);
      showToast(`${data.make} ${data.model} ajouté au garage !`, 'success');
    }
    closeVehicleForm();
  });
}
