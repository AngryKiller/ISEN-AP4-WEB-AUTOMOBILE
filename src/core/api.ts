/**
 * api.ts — Network calls using the Fetch API.
 */

import type { NhtsaApiResponse, NhtsaModelResult } from '../models';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

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
 * Fetches vehicle models for a given make from the NHTSA public REST API.
 */
export async function fetchModelsByMake(make: string, signal?: AbortSignal): Promise<string[]> {
  const key = make.trim().toLowerCase();
  if (!key) return [];
  if (modelsCache.has(key)) return modelsCache.get(key)!;

  const url = `${NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(key)}?format=json`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = (await response.json()) as NhtsaApiResponse<NhtsaModelResult>;
  const uniqueModels = [...new Set(data.Results.map((item) => item.Model_Name))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );

  modelsCache.set(key, uniqueModels);
  return uniqueModels;
}
