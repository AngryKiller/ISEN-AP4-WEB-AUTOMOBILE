/**
 * api.model.ts — Types des réponses de l'API REST publique NHTSA.
 */

export interface NhtsaModelResult {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

export interface NhtsaApiResponse<T> {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: T[];
}
