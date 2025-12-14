import type { Property, PropertyType, JSONSchema, JSONSchemaProperty } from '../types';

/**
 * Generates a default value based on type
 * @param {string} type - The property type
 * @returns {any} Default value
 */
export const generateDefaultValue = (type: PropertyType): any => {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'array':
      return [];
    case 'null':
      return null;
    default:
      return null;
  }
};

/**
 * Transforms a property to JSON Schema format
 * @param {Object} property - The property object
 * @param {Array} allProperties - All properties for nested handling
 * @returns {Object} JSON Schema property definition
 */
const propertyToSchemaProperty = (property: Property, allProperties: Property[]): JSONSchemaProperty => {
  const schemaProperty: JSONSchemaProperty = {
    key: property.key,
    type: property.type,
  };

  if (property.description) {
    schemaProperty.description = property.description;
  }

  // Handle default value
  if (property.value !== null && property.value !== undefined && property.value !== '') {
    schemaProperty.default = property.value;
  }

  // Handle object type with nested properties (find children by parentId)
  if (property.type === 'object') {
    // Filter nested properties with valid keys
    const nestedProperties = allProperties.filter(
      (p) => p.parentId === property.id && p.key && p.key.trim() !== ''
    );

    if (nestedProperties.length > 0) {
      schemaProperty.properties = {};
      schemaProperty.required = [];

      nestedProperties.forEach((nestedProp) => {
        // Double check key is valid
        if (nestedProp.key && nestedProp.key.trim() !== '') {
          const nestedSchema = propertyToSchemaProperty(nestedProp, allProperties);
          schemaProperty.properties![nestedProp.key] = nestedSchema;

          if (nestedProp.required) {
            schemaProperty.required!.push(nestedProp.key);
          }
        }
      });

      if (schemaProperty.required!.length === 0) {
        delete schemaProperty.required;
      }
    }
  }

  // Handle array type with item schema
  if (property.type === 'array' && property.items) {
    schemaProperty.items = propertyToSchemaProperty(property.items, allProperties);
  }

  return schemaProperty;
};

/**
 * Converts properties array to JSON Schema
 * @param {Array} properties - Array of property objects
 * @returns {Object} JSON Schema object
 */
export const propertiesToSchema = (properties: Property[]): JSONSchema => {
  // Filter root-level properties (no parentId) and exclude properties with empty keys
  const rootProperties = properties.filter((p) => !p.parentId && p.key && p.key.trim() !== '');

  if (rootProperties.length === 0) {
    return {
      type: 'object',
      properties: {},
    };
  }

  const schema: JSONSchema = {
    type: 'object',
    properties: {},
  };

  const required: string[] = [];

  rootProperties.forEach((property) => {
    // Double check key is valid before adding to schema
    if (property.key && property.key.trim() !== '') {
      const schemaProperty = propertyToSchemaProperty(property, properties);
      schema.properties[property.key] = schemaProperty;

      if (property.required) {
        required.push(property.key);
      }
    }
  });

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
};

/**
 * Converts JSON Schema to properties array
 * @param {Object} schema - JSON Schema object
 * @param {string} parentId - Parent property ID (for nested)
 * @param {Function} generateId - Function to generate unique IDs
 * @returns {Array} Array of property objects
 */
export const schemaToProperties = (
  schema: JSONSchema,
  parentId: string | null = null,
  generateId: () => string = () => Math.random().toString(36).substr(2, 9)
): Property[] => {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return [];
  }

  const properties: Property[] = [];

  Object.entries(schema.properties).forEach(([key, schemaProperty]) => {
    // Use key from schemaProperty if available, otherwise fall back to object key (for backward compatibility)
    const propertyKey = schemaProperty.key || key;
    const property: Property = {
      id: generateId(),
      key: propertyKey,
      type: schemaProperty.type || 'string',
      description: schemaProperty.description || '',
      value: schemaProperty.default !== undefined ? schemaProperty.default : null,
      required: schema.required?.includes(key) || false,
      parentId,
      properties: [],
    };

    // Handle nested object properties
    if (schemaProperty.type === 'object' && schemaProperty.properties) {
      const nestedProperties = Object.entries(schemaProperty.properties).map(([nestedKey, nestedSchema]) => {
        // Use key from nestedSchema if available, otherwise fall back to object key (for backward compatibility)
        const nestedPropertyKey = nestedSchema.key || nestedKey;
        return {
          id: generateId(),
          key: nestedPropertyKey,
          type: nestedSchema.type || 'string',
          description: nestedSchema.description || '',
          value: nestedSchema.default !== undefined ? nestedSchema.default : null,
          required: schemaProperty.required?.includes(nestedKey) || false,
          parentId: property.id,
          properties: [],
        } as Property;
      });

      property.properties = nestedProperties;
      properties.push(...nestedProperties);
    }

    // Handle array items
    if (schemaProperty.type === 'array' && schemaProperty.items) {
      property.items = {
        id: generateId(),
        key: 'item',
        type: schemaProperty.items.type || 'string',
        description: schemaProperty.items.description || '',
        value: schemaProperty.items.default !== undefined ? schemaProperty.items.default : null,
        required: false,
        parentId: property.id,
        properties: [],
      };
    }

    properties.push(property);
  });

  return properties;
};

/**
 * Formats JSON with proper indentation
 * @param {Object} json - JSON object to format
 * @param {number} indent - Indentation spaces (default: 2)
 * @returns {string} Formatted JSON string
 */
export const formatJSON = (json: any, indent: number = 2): string => {
  try {
    return JSON.stringify(json, null, indent);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return '{}';
  }
};
