import { create } from 'zustand';
import type { JSONSchema, Property, SavedData } from '../types';

const STORAGE_KEY = 'json_schema_builder_schema';
const AUTO_SAVE_DEBOUNCE_MS = 500;

interface PersistenceStore {
  saveSchema: (schema: JSONSchema, properties: Property[]) => boolean;
  loadSchema: () => SavedData | null;
  clearSavedSchema: () => boolean;
  hasSavedSchema: () => boolean;
  autoSave: (schema: JSONSchema, properties: Property[]) => void;
  isInitialLoad: boolean;
  isLoading: boolean;
  setInitialLoad: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

let autoSaveTimer: NodeJS.Timeout | null = null;

const usePersistenceStore = create<PersistenceStore>((set, get) => ({
  isInitialLoad: true,
  isLoading: true,

  setInitialLoad: (value: boolean) => set({ isInitialLoad: value }),
  setLoading: (value: boolean) => set({ isLoading: value }),

  /**
   * Save schema to localStorage
   */
  saveSchema: (schema: JSONSchema, properties: Property[]): boolean => {
    try {
      const data: SavedData = {
        schema,
        properties,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving schema to localStorage:', error);
      return false;
    }
  },

  /**
   * Load schema from localStorage
   */
  loadSchema: (): SavedData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data) as SavedData;

      // Validate structure
      if (!parsed.schema || !parsed.properties) {
        console.warn('Invalid schema structure in localStorage');
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading schema from localStorage:', error);
      return null;
    }
  },

  /**
   * Clear saved schema
   */
  clearSavedSchema: (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing saved schema:', error);
      return false;
    }
  },

  /**
   * Check if saved schema exists
   */
  hasSavedSchema: (): boolean => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return false;
    }
  },

  /**
   * Auto-save schema with debouncing
   */
  autoSave: (schema: JSONSchema, properties: Property[]): void => {
    if (get().isInitialLoad) {
      return;
    }

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = setTimeout(() => {
      const validProperties = properties.filter(
        (p) => p.key && p.key.trim() !== ''
      );
      // Always save, even when empty, to properly persist deletions
      get().saveSchema(schema, validProperties);
    }, AUTO_SAVE_DEBOUNCE_MS);
  },

}));

export default usePersistenceStore;
