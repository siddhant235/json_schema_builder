import { create } from 'zustand';
import { validateProperty as validatePropertyUtil, validateAllProperties } from '../utils/validation';
import type { Property, ValidationErrors } from '../types';

const VALIDATION_DEBOUNCE_MS = 500;

interface ValidationStore {
  errors: ValidationErrors;
  isValid: boolean;
  validateProperty: (property: Property, allProperties: Property[]) => Record<string, string>;
  validateAll: (properties: Property[]) => ValidationErrors;
  clearErrors: (propertyId?: string) => void;
  getFieldError: (propertyId: string, field: string) => string | null;
  hasErrors: (propertyId: string) => boolean;
  getPropertyErrors: (propertyId: string) => Record<string, string>;
  autoValidate: (properties: Property[]) => void;
}

let validationTimer: NodeJS.Timeout | null = null;

const useValidationStore = create<ValidationStore>((set, get) => ({
  errors: {},
  isValid: true,

  /**
   * Validate a single property
   */
  validateProperty: (property: Property, allProperties: Property[]): Record<string, string> => {
    const errors = validatePropertyUtil(property, allProperties);

    set((state) => {
      const newErrors = { ...state.errors };

      if (Object.keys(errors).length > 0) {
        newErrors[property.id] = errors;
      } else {
        delete newErrors[property.id];
      }

      return {
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });

    return errors;
  },

  /**
   * Validate all properties
   */
  validateAll: (properties: Property[]): ValidationErrors => {
    const allErrors = validateAllProperties(properties);

    set({
      errors: allErrors,
      isValid: Object.keys(allErrors).length === 0,
    });

    return allErrors;
  },

  /**
   * Clear errors for a property
   */
  clearErrors: (propertyId?: string): void => {
    if (propertyId) {
      set((state) => {
        const newErrors = { ...state.errors };
        delete newErrors[propertyId];

        return {
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0,
        };
      });
    } else {
      set({
        errors: {},
        isValid: true,
      });
    }
  },

  /**
   * Get error for a specific field
   */
  getFieldError: (propertyId: string, field: string): string | null => {
    const errors = get().errors[propertyId];
    return errors?.[field] || null;
  },

  /**
   * Check if property has errors
   */
  hasErrors: (propertyId: string): boolean => {
    return !!get().errors[propertyId];
  },

  /**
   * Get all error messages for a property
   */
  getPropertyErrors: (propertyId: string): Record<string, string> => {
    return get().errors[propertyId] || {};
  },

  /**
   * Auto-validate properties with debouncing
   */
  autoValidate: (properties: Property[]): void => {
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    validationTimer = setTimeout(() => {
      const validProperties = properties.filter(
        (p) => p.key && p.key.trim() !== ''
      );
      if (validProperties.length > 0) {
        get().validateAll(validProperties);
      } else if (properties.length === 0) {
        get().clearErrors();
      }
    }, VALIDATION_DEBOUNCE_MS);
  },
}));

export default useValidationStore;
