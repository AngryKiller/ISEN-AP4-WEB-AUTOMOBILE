/**
 * validation.model.ts — Types for form validation.
 */

import type { VehicleFormInput } from './vehicle.model';

export type ValidationErrors = Partial<Record<keyof VehicleFormInput, string>>;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}
