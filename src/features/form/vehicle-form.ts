/**
 * vehicle-form.ts — Add/edit modal dialog handling and autocompletion.
 */

import { decodeVin, fetchMakes, fetchModelsByMake, searchAdemeSpecs } from '../../core/api';
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
const vinHint = document.getElementById('indice-vin') as HTMLElement | null;

const motorizationSelect = vehicleForm?.elements.namedItem('motorization',) as HTMLSelectElement | null;
const fuelSelect = vehicleForm?.elements.namedItem('carburant',) as HTMLSelectElement | null;
const fuelField = document.getElementById('champ-carburant');

function updateFuelField(): void {
  if (!motorizationSelect || !fuelSelect || !fuelField) return;

  const isElectric = motorizationSelect.value === 'electric';
  fuelField.hidden = isElectric;
  fuelSelect.disabled = isElectric;
  fuelSelect.required = !isElectric;

  if (isElectric) fuelSelect.value = '';
}

let currentRequestController: AbortController | null = null;
let currentVinController: AbortController | null = null;

function resetSourceTags(): void {
  const tags = vehicleForm?.querySelectorAll('.field__source-tag');
  tags?.forEach((t) => {
    t.textContent = '';
  });
}

export function openVehicleForm(id: string | null = null): void {
  if (!vehicleForm || !modalDialog) return;

  vehicleForm.reset();
  clearValidationErrors();
  resetSourceTags();
  if (modelsDataList) modelsDataList.replaceChildren();
  if (modelsHint) modelsHint.textContent = '';
  if (vinHint) vinHint.textContent = '';

  const vehicle = id ? findVehicleById(id) : null;
  if (formTitle) formTitle.textContent = vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule';
  if (submitButton) submitButton.textContent = vehicle ? 'Enregistrer' : 'Ajouter';

  if (vehicle) {
    populateForm(vehicle);
    void loadModelSuggestions(vehicle.make);
  }

  updateFuelField();
  updateElectricFormFields();
  modalDialog.showModal();
  const makeInput = (vehicleForm.elements.namedItem('make') ||
    vehicleForm.elements.namedItem('marque')) as HTMLInputElement | null;
  makeInput?.focus();
}

function updateElectricFormFields(): void {
  if (!vehicleForm) return;

  const isElectric = motorizationSelect?.value === 'electric';
  const oilField = vehicleForm
    .querySelector<HTMLElement>('[name="nextOilChangeKm"]')
    ?.closest<HTMLElement>('.field');

  if (oilField) {
    oilField.hidden = isElectric;
  }
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
    motorization: vehicle.motorization,
    carburant:
      vehicle.fuel === 'petrol'
        ? 'essence'
        : vehicle.fuel === 'diesel'
          ? 'diesel'
          : '',
    transmissionType: vehicle.transmissionType,
    driveType: vehicle.driveType,
    licensePlate: vehicle.licensePlate,
    immatriculation: vehicle.licensePlate,
    vin: vehicle.vin,
    color: vehicle.color,
    couleur: vehicle.color,
    nextOilChangeKm: vehicle.nextOilChangeKm,
    nextRevisionKm: vehicle.nextRevisionKm,
    lastRevisionDate: vehicle.lastRevisionDate,
    maintenanceNotes: vehicle.maintenanceNotes,
    wheelRimInches: vehicle.wheelRimInches,
    tirePressure: vehicle.tirePressure,
    recommendedTirePressure: vehicle.recommendedTirePressure,
    trunkCapacityLiters: vehicle.trunkCapacityLiters,
    averageConsumption: vehicle.averageConsumption,
    countryOfOrigin: vehicle.countryOfOrigin,
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
    transmissionType: ['transmissionType'],
    driveType: ['driveType'],
    licensePlate: ['licensePlate', 'immatriculation'],
    vin: ['vin'],
    nextOilChangeKm: ['nextOilChangeKm'],
    nextRevisionKm: ['nextRevisionKm'],
    maintenanceNotes: ['maintenanceNotes'],
    wheelRimInches: ['wheelRimInches'],
    tirePressure: ['tirePressure'],
    recommendedTirePressure: ['recommendedTirePressure'],
    trunkCapacityLiters: ['trunkCapacityLiters'],
    averageConsumption: ['averageConsumption'],
    motorization: ['motorization', 'motorisation'],
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
    .forEach((element) => {
      element.textContent = '';
    });

  vehicleForm
    .querySelectorAll('[aria-invalid]')
    .forEach((element) => {
      element.removeAttribute('aria-invalid');
    });

  vehicleForm
    .querySelectorAll('.field--invalid')
    .forEach((element) => {
      element.classList.remove('field--invalid');
    });
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
      ? `${models.length} modèles suggérés (Europe ADEME & US)`
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

  const fuelSelect = (vehicleForm.elements.namedItem('fuel') ||
    vehicleForm.elements.namedItem('carburant')) as HTMLSelectElement | null;
  fuelSelect?.addEventListener('change', () => {
    updateElectricFormFields();
  });

  const vinInput = vehicleForm.elements.namedItem('vin') as HTMLInputElement | null;
  vinInput?.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLInputElement;
    target.value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    currentVinController?.abort();

    if (target.value.length === 17) {
      const firstChar = target.value.charAt(0);
      const isUS = firstChar >= '1' && firstChar <= '5';
      if (vinHint) vinHint.textContent = isUS ? '⏳ décodage NHTSA (USA)…' : '⏳ décodage WMI (Europe)…';
      currentVinController = new AbortController();

      void decodeVin(target.value, currentVinController.signal)
        .then((specs) => {
          if (!specs || !vehicleForm) {
            if (vinHint) vinHint.textContent = '❌ véhicule non identifié';
            return;
          }

          if (specs.make) {
            const input = (vehicleForm.elements.namedItem('make') ||
              vehicleForm.elements.namedItem('marque')) as HTMLInputElement | null;
            if (input) input.value = specs.make;
            void loadModelSuggestions(specs.make);
          }
          if (specs.model) {
            const input = (vehicleForm.elements.namedItem('model') ||
              vehicleForm.elements.namedItem('modele')) as HTMLInputElement | null;
            if (input) input.value = specs.model;
          }
          if (specs.year) {
            const input = (vehicleForm.elements.namedItem('year') ||
              vehicleForm.elements.namedItem('annee')) as HTMLInputElement | null;
            if (input) input.value = String(specs.year);
          }
          if (specs.motorization) {
            if (motorizationSelect) {
              motorizationSelect.value = specs.motorization;
              const tagMotor = document.getElementById('tag-source-motorisation');
              if (tagMotor) tagMotor.textContent = 'NHTSA';
            }

            updateFuelField();
            updateElectricFormFields();
          }

          if (specs.fuel) {
            if (fuelSelect) {
              fuelSelect.value =
                specs.fuel === 'petrol'
                  ? 'essence'
                  : specs.fuel === 'diesel'
                    ? 'diesel'
                    : '';
              const tagFuel = document.getElementById('tag-source-carburant');
              if (tagFuel && fuelSelect.value) tagFuel.textContent = 'NHTSA';
            }
          }
          if (specs.transmissionType) {
            const select = vehicleForm.elements.namedItem('transmissionType') as HTMLSelectElement | null;
            if (select) {
              select.value = specs.transmissionType;
              const tag = document.getElementById('tag-source-boite');
              if (tag) tag.textContent = 'NHTSA';
            }
          }
          if (specs.driveType) {
            const select = vehicleForm.elements.namedItem('driveType') as HTMLSelectElement | null;
            if (select) select.value = specs.driveType;
          }
          if (specs.wheelRimInches) {
            const select = vehicleForm.elements.namedItem('wheelRimInches') as HTMLSelectElement | null;
            if (select) select.value = String(specs.wheelRimInches);
          }
          if (specs.countryOfOrigin) {
            const countryInput = vehicleForm.elements.namedItem('countryOfOrigin') as HTMLInputElement | null;
            if (countryInput) countryInput.value = specs.countryOfOrigin;
          }
          updateElectricFormFields();

          if (specs.origin === 'eu') {
            if (vinHint) vinHint.textContent = `✓ ${specs.make} identifié (${specs.source})`;
            showToast(`Marque identifiée : ${specs.make} ! Choisissez le modèle pour compléter avec l'ADEME.`, 'success');
            const modelInput = (vehicleForm.elements.namedItem('model') ||
              vehicleForm.elements.namedItem('modele')) as HTMLInputElement | null;
            modelInput?.focus();
          } else {
            if (vinHint) vinHint.textContent = '✓ décodé avec succès';
            showToast('Caractéristiques préremplies via l’API NHTSA !', 'success');
          }
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          if (vinHint) vinHint.textContent = '⚠️ erreur API';
        });
    } else {
      if (vinHint) {
        vinHint.textContent = target.value.length > 0 ? `${target.value.length}/17 car.` : '';
      }
    }
  });

  const modelInput = (vehicleForm.elements.namedItem('model') ||
    vehicleForm.elements.namedItem('modele')) as HTMLInputElement | null;

  const handleModelSpecLookup = (): void => {
    const modelVal = modelInput?.value.trim() ?? '';
    const makeVal = ((vehicleForm.elements.namedItem('make') ||
      vehicleForm.elements.namedItem('marque')) as HTMLInputElement | null)?.value.trim() ?? '';

    if (makeVal.length < 2 || modelVal.length < 2) return;

    if (modelsHint) modelsHint.textContent = `⏳ recherche caractéristiques ${modelVal} (ADEME)…`;

    void searchAdemeSpecs(makeVal, modelVal).then((ademeSpecs) => {
      if (!ademeSpecs || !vehicleForm) {
        if (modelsHint) modelsHint.textContent = '';
        return;
      }

      if (typeof ademeSpecs.averageConsumption === 'number') {
        const consoInput = vehicleForm.elements.namedItem('averageConsumption') as HTMLInputElement | null;
        if (consoInput) {
          consoInput.value = String(ademeSpecs.averageConsumption);
          const tag = document.getElementById('tag-source-conso');
          if (tag) tag.textContent = 'ADEME WLTP';
        }
      }

      if (ademeSpecs.motorization) {
        if (motorizationSelect) {
          motorizationSelect.value = ademeSpecs.motorization;
          const tagMotor = document.getElementById('tag-source-motorisation');
          if (tagMotor) tagMotor.textContent = 'ADEME';
        }

        updateFuelField();
        updateElectricFormFields();
      }

      if (ademeSpecs.fuel) {
        if (fuelSelect) {
          fuelSelect.value =
            ademeSpecs.fuel === 'petrol'
              ? 'essence'
              : ademeSpecs.fuel === 'diesel'
                ? 'diesel'
                : '';
          const tagFuel = document.getElementById('tag-source-carburant');
          if (tagFuel && fuelSelect.value) tagFuel.textContent = 'ADEME';
        }
      }

      if (ademeSpecs.transmissionType) {
        const transSelect = vehicleForm.elements.namedItem('transmissionType') as HTMLSelectElement | null;
        if (transSelect) {
          transSelect.value = ademeSpecs.transmissionType;
          const tag = document.getElementById('tag-source-boite');
          if (tag) tag.textContent = 'ADEME';
        }
      }

      if (modelsHint) modelsHint.textContent = '✓ caractéristiques ADEME appliquées';
      showToast(`Données d'homologation récupérées (${modelVal} - ADEME Open Data) !`, 'success');
    });
  };

  modelInput?.addEventListener('input', debounce(handleModelSpecLookup, 300));
  modelInput?.addEventListener('change', handleModelSpecLookup);

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

  motorizationSelect?.addEventListener('change', () => {
    updateFuelField();
    updateElectricFormFields();
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

    const vehicleData = {
        ...data,
        fuel: data.motorization === 'electric' ? null : data.fuel,
    };
    const id = formData.get('id');
    if (typeof id === 'string' && id) {
      updateVehicle(id, vehicleData as Partial<Vehicle>);
      animateCardUpdate(id);
      showToast(`${data.make} ${data.model} modifié.`, 'success');
    } else {
      addVehicle(vehicleData as VehicleCreationData);
      showToast(`${data.make} ${data.model} ajouté au garage !`, 'success');
    }
    closeVehicleForm();
  });
}
