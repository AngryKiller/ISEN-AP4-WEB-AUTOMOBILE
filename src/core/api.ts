/**
 * api.ts — Network calls using the Fetch API.
 */

import type {
  AdemeCarResult,
  FuelType,
  MotorizationType,
  NhtsaApiResponse,
  NhtsaModelResult,
  VehicleSpecs,
} from '../models';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const ADEME_BASE_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/ademe-car-labelling';

/** In-memory cache to avoid duplicate network requests for the same make */
const modelsCache = new Map<string, string[]>();

export async function fetchMakes(): Promise<string[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/makes.json`);
    if (response.ok) {
      return (await response.json()) as string[];
    }
  } catch {
    /* fallback below */
  }

  const response = await fetch(`${import.meta.env.BASE_URL}data/marques.json`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return (await response.json()) as string[];
}

/**
 * Fetches models from ADEME French Open Data catalog for European-market vehicles.
 */
export async function fetchAdemeModelsByMake(make: string, signal?: AbortSignal): Promise<string[]> {
  const query = make.trim();
  if (!query) return [];

  try {
    const url = `${ADEME_BASE_URL}/lines?q=${encodeURIComponent(query)}&size=100`;
    const response = await fetch(url, { signal });
    if (!response.ok) return [];

    const data = (await response.json()) as { results?: AdemeCarResult[] };
    if (!data.results?.length) return [];

    const models = new Set<string>();
    for (const item of data.results) {
      const m = item.Modèle?.trim();
      if (m && m.length >= 2) {
        // Format model in Title Case (e.g. Qashqai, Clio, 308)
        const formatted = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
        models.add(formatted);
      }
    }
    return [...models];
  } catch {
    return [];
  }
}

/**
 * Fetches vehicle models for a given make, combining both European (ADEME) and international (NHTSA) catalogs.
 */
export async function fetchModelsByMake(make: string, signal?: AbortSignal): Promise<string[]> {
  const key = make.trim().toLowerCase();
  if (!key) return [];
  if (modelsCache.has(key)) return modelsCache.get(key)!;

  // Run both ADEME (Europe) and NHTSA (USA) in parallel for complete coverage
  const [ademeModels, nhtsaModels] = await Promise.allSettled([
    fetchAdemeModelsByMake(make, signal),
    (async () => {
      const url = `${NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(key)}?format=json`;
      const response = await fetch(url, { signal });
      if (!response.ok) return [];
      const data = (await response.json()) as NhtsaApiResponse<NhtsaModelResult>;
      return data.Results.map((item) => item.Model_Name);
    })(),
  ]);

  const european = ademeModels.status === 'fulfilled' ? ademeModels.value : [];
  const us = nhtsaModels.status === 'fulfilled' ? nhtsaModels.value : [];

  // Deduplicate and prioritize European models first, then other models
  const uniqueMap = new Map<string, string>();
  for (const m of european) {
    uniqueMap.set(m.toLowerCase(), m);
  }
  for (const m of us) {
    if (!uniqueMap.has(m.toLowerCase())) {
      uniqueMap.set(m.toLowerCase(), m);
    }
  }

  const sortedModels = [...uniqueMap.values()].sort((a, b) => a.localeCompare(b, 'fr'));
  modelsCache.set(key, sortedModels);
  return sortedModels;
}

/**
 * Standard ISO 3779 World Manufacturer Identifiers (WMI).
 * Maps the 3-letter WMI prefix to the manufacturer/brand name.
 */
const WMI_MAP: Record<string, { make: string; country: string }> = {
  // France
  VF1: { make: 'Renault', country: 'France' },
  VF2: { make: 'Renault', country: 'France' },
  VF3: { make: 'Peugeot', country: 'France' },
  VF4: { make: 'Talbot', country: 'France' },
  VF6: { make: 'Renault Trucks', country: 'France' },
  VF7: { make: 'Citroën', country: 'France' },
  VF8: { make: 'Matra', country: 'France' },
  VR1: { make: 'DS Automobiles', country: 'France' },
  VR3: { make: 'Peugeot', country: 'France' },
  VR7: { make: 'Citroën', country: 'France' },
  VNV: { make: 'Renault', country: 'France' },

  // Germany
  WAU: { make: 'Audi', country: 'Allemagne' },
  WA1: { make: 'Audi', country: 'Allemagne' },
  WBA: { make: 'BMW', country: 'Allemagne' },
  WBS: { make: 'BMW M', country: 'Allemagne' },
  WBY: { make: 'BMW i', country: 'Allemagne' },
  WDB: { make: 'Mercedes-Benz', country: 'Allemagne' },
  WDC: { make: 'Mercedes-Benz', country: 'Allemagne' },
  WDD: { make: 'Mercedes-Benz', country: 'Allemagne' },
  WDF: { make: 'Mercedes-Benz', country: 'Allemagne' },
  WMX: { make: 'Mercedes-AMG', country: 'Allemagne' },
  WOL: { make: 'Opel', country: 'Allemagne' },
  W0L: { make: 'Opel', country: 'Allemagne' },
  WP0: { make: 'Porsche', country: 'Allemagne' },
  WP1: { make: 'Porsche', country: 'Allemagne' },
  WVW: { make: 'Volkswagen', country: 'Allemagne' },
  WV1: { make: 'Volkswagen', country: 'Allemagne' },
  WV2: { make: 'Volkswagen', country: 'Allemagne' },
  WVG: { make: 'Volkswagen', country: 'Allemagne' },

  // United Kingdom
  SAJ: { make: 'Jaguar', country: 'Royaume-Uni' },
  SAL: { make: 'Land Rover', country: 'Royaume-Uni' },
  SAR: { make: 'Rover', country: 'Royaume-Uni' },
  SCC: { make: 'Lotus', country: 'Royaume-Uni' },
  SCF: { make: 'Aston Martin', country: 'Royaume-Uni' },
  SDB: { make: 'Peugeot UK', country: 'Royaume-Uni' },
  SFD: { make: 'Alexander Dennis', country: 'Royaume-Uni' },
  SHH: { make: 'Honda', country: 'Royaume-Uni' },
  SHS: { make: 'Honda', country: 'Royaume-Uni' },
  SJK: { make: 'Nissan', country: 'Royaume-Uni' },
  SJN: { make: 'Nissan', country: 'Royaume-Uni' },
  TCC: { make: 'Micro Compact Car / Smart', country: 'Suisse' },

  // Italy
  ZFA: { make: 'Fiat', country: 'Italie' },
  ZAR: { make: 'Alfa Romeo', country: 'Italie' },
  ZFF: { make: 'Ferrari', country: 'Italie' },
  ZHW: { make: 'Lamborghini', country: 'Italie' },
  ZLA: { make: 'Lancia', country: 'Italie' },
  ZAM: { make: 'Maserati', country: 'Italie' },

  // Spain
  VSE: { make: 'SEAT', country: 'Espagne' },
  VSS: { make: 'SEAT', country: 'Espagne' },

  // Sweden
  YV1: { make: 'Volvo', country: 'Suède' },
  YV2: { make: 'Volvo Trucks', country: 'Suède' },
  YS3: { make: 'Saab', country: 'Suède' },

  // Czech Republic & Romania
  TMB: { make: 'Škoda', country: 'République Tchèque' },
  UU1: { make: 'Dacia', country: 'Roumanie' },

  // Japan & Asia
  JM1: { make: 'Mazda', country: 'Japon' },
  JN1: { make: 'Nissan', country: 'Japon' },
  JT1: { make: 'Toyota', country: 'Japon' },
  JTD: { make: 'Toyota', country: 'Japon' },
  JTE: { make: 'Toyota', country: 'Japon' },
  KMH: { make: 'Hyundai', country: 'Corée du Sud' },
  KNA: { make: 'Kia', country: 'Corée du Sud' },
  KNB: { make: 'Kia', country: 'Corée du Sud' },

  // North America
  '1FA': { make: 'Ford', country: 'USA' },
  '1FB': { make: 'Ford', country: 'USA' },
  '1FC': { make: 'Ford', country: 'USA' },
  '1FD': { make: 'Ford', country: 'USA' },
  '1FM': { make: 'Ford', country: 'USA' },
  '1FT': { make: 'Ford', country: 'USA' },
  '1G1': { make: 'Chevrolet', country: 'USA' },
  '1GC': { make: 'Chevrolet', country: 'USA' },
  '1HG': { make: 'Honda', country: 'USA' },
  '1J4': { make: 'Jeep', country: 'USA' },
  '1N4': { make: 'Nissan', country: 'USA' },
  '5YJ': { make: 'Tesla', country: 'USA' },
  '7SA': { make: 'Tesla', country: 'USA' },
  '2T1': { make: 'Toyota', country: 'Canada' },
  '3FA': { make: 'Ford', country: 'Mexique' },
  '3VW': { make: 'Volkswagen', country: 'Mexique' },
};

/**
 * Searches technical specs (mixed consumption, transmission, fuel) from ADEME Open Data.
 */
export async function searchAdemeSpecs(
  make: string,
  model: string,
  signal?: AbortSignal,
): Promise<Partial<VehicleSpecs> | null> {
  const cleanModel = model.trim();
  const cleanMake = make.trim();
  if (cleanModel.length < 2) return null;

  // Try queries in order of precision: "make model", then "model"
  const queries = cleanMake.length >= 2 ? [`${cleanMake} ${cleanModel}`, cleanModel] : [cleanModel];

  for (const query of queries) {
    try {
      const url = `${ADEME_BASE_URL}/lines?q=${encodeURIComponent(query)}&size=1`;
      const response = await fetch(url, { signal });
      if (!response.ok) continue;

      const data = (await response.json()) as { results?: AdemeCarResult[] };
      const car = data.results?.[0];
      if (!car) continue;

      const conso =
        typeof car.Conso_vitesse_mixte_Min === 'number' && typeof car.Conso_vitesse_mixte_Max === 'number'
          ? Number(((car.Conso_vitesse_mixte_Min + car.Conso_vitesse_mixte_Max) / 2).toFixed(1))
          : car.Conso_vitesse_mixte_Min ?? car.Conso_vitesse_mixte_Max;

      const { motorization, fuel } = parseAdemeEnergy(car.Energie);
      const transmissionType = parseAdemeTransmission(car.Type_de_boite, car.Nombre_rapports);

      if (
        conso !== undefined ||
        motorization !== undefined ||
        fuel !== undefined ||
        transmissionType !== undefined
      ) {
        return {
          averageConsumption: conso,
          motorization,
          fuel,
          transmissionType,
        };
      }
    } catch {
      /* continue to next query */
    }
  }

  return null;
}

function parseAdemeEnergy(energy?: string): { motorization?: MotorizationType; fuel?: FuelType } {
  const e = (energy ?? '').toUpperCase();
  if (!e) return {};

  if (e.includes('ELEC') && !e.includes('ESS') && !e.includes('GAZ') && !e.includes('DIES')) {
    return { motorization: 'electric' };
  }

  const isHybrid =
    e.includes('HNR') ||
    e.includes('HR') ||
    e.includes('HYBRIDE') ||
    (e.includes('ELEC') && (e.includes('ESS') || e.includes('GAZ') || e.includes('DIES')));

  const isDiesel = e.includes('DIESEL') || e.includes('GAZOLE');
  const isPetrol = e.includes('ESSENCE') || e.includes('ESS') || e.includes('GAZ');

  if (isHybrid) {
    return {
      motorization: 'hybrid',
      fuel: isDiesel ? 'diesel' : 'petrol',
    };
  }

  if (isDiesel) {
    return { motorization: 'thermal', fuel: 'diesel' };
  }

  if (isPetrol) {
    return { motorization: 'thermal', fuel: 'petrol' };
  }

  return {};
}

function parseAdemeTransmission(typeBoite?: string, rapports?: number): VehicleSpecs['transmissionType'] {
  const t = (typeBoite ?? '').toUpperCase();
  const r = rapports ?? 6;

  if (t.includes('AUTO')) {
    if (r === 10) return 'automatic-10';
    if (r === 8) return 'automatic-8';
    return 'automatic-6';
  }
  if (t.includes('VARIATION') || t.includes('CVT')) {
    return 'cvt';
  }
  if (t.includes('DOUBLE') || t.includes('DCT') || t.includes('DSG') || t.includes('EDC')) {
    return 'dual-clutch';
  }
  if (t.includes('ROBOT')) {
    return 'automated-manual';
  }
  if (t.includes('MECANIQUE') || t.includes('MANU')) {
    return r === 5 ? 'manual-5' : 'manual-6';
  }
  return undefined;
}

/**
 * Decodes a 17-character VIN with smart routing:
 * - North American VINs (1-5) are dispatched to the official NHTSA VPIC API.
 * - European VINs (S-Z, V...) are decoded via standard ISO 3779 WMI table,
 *   with make recognition and auto-enrichment via ADEME Open Data.
 */
export async function decodeVin(vin: string, signal?: AbortSignal): Promise<VehicleSpecs | null> {
  const cleanVin = vin.trim().toUpperCase();
  if (cleanVin.length !== 17) return null;

  const firstChar = cleanVin.charAt(0);
  const isNorthAmerican = firstChar >= '1' && firstChar <= '5';

  if (isNorthAmerican) {
    const nhtsaSpecs = await decodeVinViaNhtsa(cleanVin, signal);
    if (nhtsaSpecs) {
      return { ...nhtsaSpecs, origin: 'us', source: 'NHTSA VPIC (USA)' };
    }
  }

  // European or rest-of-world VIN: decode via WMI
  const wmi3 = cleanVin.slice(0, 3);
  const wmi2 = cleanVin.slice(0, 2);
  const wmiInfo = WMI_MAP[wmi3] ?? WMI_MAP[wmi2];

  if (wmiInfo) {
    const specs: VehicleSpecs = {
      make: wmiInfo.make,
      countryOfOrigin: wmiInfo.country,
      origin: 'eu',
      source: `Standard ISO 3779 (${wmiInfo.country})`,
    };
    return specs;
  }

  // Fallback: try NHTSA just in case it is known internationally
  const fallbackNhtsa = await decodeVinViaNhtsa(cleanVin, signal);
  if (fallbackNhtsa) {
    return { ...fallbackNhtsa, origin: 'unknown', source: 'NHTSA VPIC' };
  }

  return null;
}

async function decodeVinViaNhtsa(cleanVin: string, signal?: AbortSignal): Promise<VehicleSpecs | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const combinedSignal = signal
      ? AbortSignal.any
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal
      : controller.signal;

    const url = `${NHTSA_BASE_URL}/DecodeVinValues/${encodeURIComponent(cleanVin)}?format=json`;
    const response = await fetch(url, { signal: combinedSignal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = (await response.json()) as NhtsaApiResponse<Record<string, string | undefined>>;
    const res = data.Results?.[0];
    if (!res) return null;

    const rim = Number(res.WheelSizeFront) || Number(res.WheelSizeRear) || undefined;
    const year = Number(res.ModelYear) || undefined;

    const { motorization, fuel } = parseNhtsaEnergy(
      res.FuelTypePrimary,
      res.FuelTypeSecondary,
      res.ElectrificationLevel,
    );

    const specs: VehicleSpecs = {
      make: res.Make?.trim() || undefined,
      model: res.Model?.trim() || undefined,
      year: year && !Number.isNaN(year) ? year : undefined,
      motorization,
      fuel,
      transmissionType: parseNhtsaTransmission(res.TransmissionStyle, res.TransmissionSpeeds),
      driveType: parseNhtsaDriveType(res.DriveType),
      wheelRimInches: rim && rim >= 13 && rim <= 22 ? rim : undefined,
      countryOfOrigin: res.PlantCountry?.trim() || undefined,
    };

    const hasAnyData = Object.values(specs).some((val) => val !== undefined);
    return hasAnyData ? specs : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function parseNhtsaEnergy(
  primary?: string,
  secondary?: string,
  elecLevel?: string,
): { motorization?: MotorizationType; fuel?: FuelType } {
  const combined = `${primary ?? ''} ${secondary ?? ''} ${elecLevel ?? ''}`.toLowerCase();
  if (!combined.trim()) return {};

  if (combined.includes('electric') && !combined.includes('gas') && !combined.includes('hybrid')) {
    return { motorization: 'electric' };
  }

  const isHybrid =
    combined.includes('hybrid') ||
    (combined.includes('electric') && (combined.includes('gas') || combined.includes('diesel')));

  const isDiesel = combined.includes('diesel');
  const isPetrol = combined.includes('gasoline') || combined.includes('petrol');

  if (isHybrid) {
    return {
      motorization: 'hybrid',
      fuel: isDiesel ? 'diesel' : 'petrol',
    };
  }

  if (isDiesel) {
    return { motorization: 'thermal', fuel: 'diesel' };
  }

  if (isPetrol) {
    return { motorization: 'thermal', fuel: 'petrol' };
  }

  return {};
}

function parseNhtsaTransmission(style?: string, speeds?: string): VehicleSpecs['transmissionType'] {
  const s = (style ?? '').toLowerCase();
  const sp = Number(speeds);

  if (s.includes('manual') && !s.includes('automated')) {
    return sp === 5 ? 'manual-5' : 'manual-6';
  }
  if (s.includes('dual clutch') || s.includes('dct')) {
    return 'dual-clutch';
  }
  if (s.includes('continuously variable') || s.includes('cvt')) {
    return 'cvt';
  }
  if (s.includes('automated manual') || s.includes('automated')) {
    return 'automated-manual';
  }
  if (s.includes('sequential')) {
    return 'sequential';
  }
  if (s.includes('automatic')) {
    if (sp === 10) return 'automatic-10';
    if (sp === 8) return 'automatic-8';
    return 'automatic-6';
  }
  return undefined;
}

function parseNhtsaDriveType(drive?: string): VehicleSpecs['driveType'] {
  const d = (drive ?? '').toLowerCase();
  if (d.includes('all') || d.includes('awd') || d.includes('4wd') || d.includes('4x4')) {
    return 'awd';
  }
  if (d.includes('rear') || d.includes('rwd')) {
    return 'rwd';
  }
  if (d.includes('front') || d.includes('fwd') || d.includes('4x2')) {
    return 'fwd';
  }
  return undefined;
}
