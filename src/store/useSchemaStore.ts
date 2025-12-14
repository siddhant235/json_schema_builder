import { create } from 'zustand';
import { propertiesToSchema, schemaToProperties, formatJSON } from '../utils/schemaTransform';
import { wouldCreateCircularReference, getNestingDepth } from '../utils/validation';
import type { Property, JSONSchema, PropertyUpdate } from '../types';

const generateId = (): string => Math.random().toString(36).substr(2, 9);

interface SchemaStore {
  properties: Property[];
  selectedPropertyId: string | null;
  schema: JSONSchema;
  schemaString: string;
  isValid: boolean;
  schemaData: any;
  addProperty: (parentId?: string | null) => string;
  updateProperty: (id: string, updates: PropertyUpdate) => void;
  removeProperty: (id: string) => void;
  reorderProperties: (fromIndex: number, toIndex: number, parentId?: string | null) => void;
  addNestedProperty: (parentId: string) => string | null;
  generateSchema: () => void;
  loadSchema: (schemaJson: JSONSchema | string) => void;
  restoreProperties: (savedProperties: Property[]) => void;
  clearSchema: () => void;
  setSelectedProperty: (id: string | null) => void;
  getProperty: (id: string) => Property | undefined;
  getChildProperties: (parentId: string) => Property[];
  copySchemaToClipboard: () => Promise<boolean>;
  validateSchema: () => boolean;
}

const useSchemaStore = create<SchemaStore>((set, get) => ({
  properties: [],
  selectedPropertyId: null,
  schema: {
    type: 'object',
    properties: {},
  },
  schemaString: '{}',
  isValid: true,
  schemaData: null,

  /**
   * Add a new property
   */
  addProperty: (parentId: string | null = null): string => {
    const newProperty: Property = {
      id: generateId(),
      key: '',
      description: '',
      type: 'string',
      value: null,
      required: false,
      parentId,
      properties: [],
    };

    set((state) => ({
      properties: [...state.properties, newProperty],
      selectedPropertyId: newProperty.id,
    }));

    // Don't generate schema yet - wait until property has a valid key
    // get().generateSchema();
    return newProperty.id;
  },

  /**
   * Update a property
   */
  updateProperty: (id: string, updates: PropertyUpdate): void => {
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.id === id ? { ...prop, ...updates } : prop
      ),
    }));

    // Only generate schema if the property has a valid key
    const updatedProperty = get().properties.find(p => p.id === id);
    if (updatedProperty && updatedProperty.key && updatedProperty.key.trim() !== '') {
      get().generateSchema();
    }
  },

  /**
   * Remove a property and its nested properties
   */
  removeProperty: (id: string): void => {
    set((state) => {
      // Find all nested properties recursively
      const findNestedIds = (parentId: string): string[] => {
        const nested = state.properties.filter((p) => p.parentId === parentId);
        const nestedIds = nested.map((p) => p.id);
        const allNestedIds = [...nestedIds];

        nestedIds.forEach((nestedId) => {
          allNestedIds.push(...findNestedIds(nestedId));
        });

        return allNestedIds;
      };

      const idsToRemove = [id, ...findNestedIds(id)];

      return {
        properties: state.properties.filter((p) => !idsToRemove.includes(p.id)),
        selectedPropertyId: state.selectedPropertyId === id ? null : state.selectedPropertyId,
      };
    });

    get().generateSchema();
  },

  /**
   * Reorder properties
   */
  reorderProperties: (fromIndex: number, toIndex: number, parentId: string | null = null): void => {
    set((state) => {
      const siblings = state.properties.filter((p) => p.parentId === parentId);
      const otherProperties = state.properties.filter((p) => p.parentId !== parentId);

      const [moved] = siblings.splice(fromIndex, 1);
      siblings.splice(toIndex, 0, moved);

      return {
        properties: [...otherProperties, ...siblings],
      };
    });

    get().generateSchema();
  },

  /**
   * Add nested property to an object
   */
  addNestedProperty: (parentId: string): string | null => {
    const state = get();

    // Check for circular reference
    const parentProperty = state.properties.find((p) => p.id === parentId);
    if (!parentProperty) {
      return null;
    }

    // Check nesting depth
    const depth = getNestingDepth(parentId, state.properties);
    if (depth >= 10) {
      console.warn('Maximum nesting depth reached');
      return null;
    }

    // Check for circular reference
    if (wouldCreateCircularReference(parentId, parentId, state.properties)) {
      console.warn('Circular reference detected');
      return null;
    }

    return get().addProperty(parentId);
  },

  /**
   * Generate JSON schema from properties
   */
  generateSchema: (): void => {
    const state = get();
    // Filter out properties with empty keys before generating schema
    const validProperties = state.properties.filter(p => p.key && p.key.trim() !== '');
    const schema = propertiesToSchema(validProperties);
    const schemaString = formatJSON(schema);

    // Validate schema and set schemaData
    let isValid = true;
    try {
      JSON.parse(schemaString);
      isValid = true;
    } catch {
      isValid = false;
    }

    set({
      schema,
      schemaString,
      isValid,
      schemaData: isValid ? schema : null,
    });
  },

  /**
   * Load schema from JSON
   */
  loadSchema: (schemaJson: JSONSchema | string): void => {
    try {
      const schema = typeof schemaJson === 'string' ? JSON.parse(schemaJson) as JSONSchema : schemaJson;
      // Convert schema to properties
      const properties = schemaToProperties(schema, null, generateId);
      const schemaString = formatJSON(schema);

      set({
        properties,
        schema,
        schemaString,
        selectedPropertyId: null,
      });
    } catch (error) {
      console.error('Error loading schema:', error);
    }
  },

  /**
   * Restore properties from saved data
   */
  restoreProperties: (savedProperties: Property[]): void => {
    try {
      if (!Array.isArray(savedProperties)) {
        console.warn('Invalid properties data:', savedProperties);
        return;
      }

      if (savedProperties.length === 0) {
        console.warn('No properties to restore');
        return;
      }

      console.log('Restoring properties array:', savedProperties);
      console.log('Properties count:', savedProperties.length);

      // Ensure all properties have required fields
      const normalizedProperties: Property[] = savedProperties.map(prop => ({
        id: prop.id || generateId(),
        key: prop.key || '',
        description: prop.description || '',
        type: prop.type || 'string',
        value: prop.value !== undefined ? prop.value : null,
        required: prop.required || false,
        parentId: prop.parentId !== undefined ? prop.parentId : null,
        properties: prop.properties || [],
      }));

      console.log('Normalized properties:', normalizedProperties);
      console.log('Root properties count:', normalizedProperties.filter(p => !p.parentId).length);

      // Set properties and schema in one update to ensure consistency
      const validProperties = normalizedProperties.filter(p => p.key && p.key.trim() !== '');
      const schema = propertiesToSchema(validProperties);
      const schemaString = formatJSON(schema);

      set({
        properties: normalizedProperties,
        selectedPropertyId: null,
        schema,
        schemaString,
      });

      // Verify properties were set
      const currentProperties = get().properties;
      console.log('Properties after restore:', currentProperties);
      console.log('Properties count after restore:', currentProperties.length);
      console.log('Root properties:', currentProperties.filter(p => !p.parentId));
    } catch (error) {
      console.error('Error restoring properties:', error);
    }
  },

  /**
   * Clear all properties
   */
  clearSchema: (): void => {
    set({
      properties: [],
      selectedPropertyId: null,
      schema: {
        type: 'object',
        properties: {},
      },
      schemaString: '{}',
    });
  },

  /**
   * Set selected property
   */
  setSelectedProperty: (id: string | null): void => {
    set({ selectedPropertyId: id });
  },

  /**
   * Get property by ID
   */
  getProperty: (id: string): Property | undefined => {
    return get().properties.find((p) => p.id === id);
  },

  /**
   * Get child properties
   */
  getChildProperties: (parentId: string): Property[] => {
    return get().properties.filter((p) => p.parentId === parentId);
  },

  /**
   * Validate schema JSON
   */
  validateSchema: (): boolean => {
    const state = get();
    try {
      JSON.parse(state.schemaString);
      set({ isValid: true });
      return true;
    } catch {
      set({ isValid: false });
      return false;
    }
  },

  /**
   * Copy schema to clipboard
   */
  copySchemaToClipboard: async (): Promise<boolean> => {
    const state = get();
    if (!state.schemaString || state.schemaString === '{}' || !state.isValid) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(state.schemaString);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },
}));

export default useSchemaStore;
