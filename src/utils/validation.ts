import type { Property } from '../types';

const MAX_NESTING_DEPTH = 10;
const VALID_TYPES: Array<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'> = ['string', 'number', 'boolean', 'object', 'array', 'null'];
const KEY_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * Validates a property key
 * @param {string} key - The key to validate
 * @param {Array} existingKeys - Array of existing keys at the same level
 * @param {string} currentId - ID of current property (to exclude from uniqueness check)
 * @returns {string|null} Error message or null if valid
 */
export const validateKey = (key: string, existingKeys: Property[] = [], currentId: string | null = null): string | null => {
  if (!key || key.trim() === '') {
    return 'Key is required';
  }

  const trimmedKey = key.trim();

  if (!KEY_PATTERN.test(trimmedKey)) {
    return 'Key must start with a letter, underscore, or $ and contain only alphanumeric characters, underscores, or $';
  }

  // Check uniqueness (excluding current property)
  const duplicateKey = existingKeys.find(
    (item) => item.id !== currentId && item.key === trimmedKey
  );

  if (duplicateKey) {
    return 'Key already exists at this level';
  }

  return null;
};

/**
 * Validates a property type
 * @param {string} type - The type to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateType = (type: string): string | null => {
  if (!type) {
    return 'Type is required';
  }

  if (!VALID_TYPES.includes(type as Property['type'])) {
    return `Type must be one of: ${VALID_TYPES.join(', ')}`;
  }

  return null;
};

/**
 * Validates a value against a type
 * @param {any} value - The value to validate
 * @param {string} type - The expected type
 * @returns {boolean} True if valid
 */
export const validateValue = (value: any, type: string): boolean => {
  if (value === null || value === undefined || value === '') {
    return true; // Optional values are allowed
  }

  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' || !isNaN(Number(value));
    case 'boolean':
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return false;
  }
};

/**
 * Validates a raw input string against a type (stricter validation)
 * @param {string} inputValue - The raw input string to validate
 * @param {string} type - The expected type
 * @returns {string | null} Error message or null if valid
 */
export const validateInputValue = (inputValue: string, type: string): string | null => {
  if (!inputValue || inputValue.trim() === '') {
    return null; // Empty values are allowed (optional)
  }

  const trimmed = inputValue.trim();

  switch (type) {
    case 'string':
      // String type accepts any text input
      return null;

    case 'number':
      // Number type should only accept numeric values
      const numValue = Number(trimmed);
      if (isNaN(numValue)) {
        return 'Value must be a valid number';
      }
      // Check if the trimmed string is exactly the number (no extra characters)
      if (String(numValue) !== trimmed && String(numValue) !== trimmed.replace(/^0+/, '') && trimmed !== `-${numValue}`) {
        // Allow scientific notation and decimals
        if (!/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed)) {
          return 'Value must be a valid number';
        }
      }
      return null;

    case 'boolean':
      // Boolean type should only accept true/false
      const lowerTrimmed = trimmed.toLowerCase();
      if (lowerTrimmed !== 'true' && lowerTrimmed !== 'false') {
        return 'Value must be either "true" or "false"';
      }
      return null;

    case 'object':
      // Object type should be valid JSON object
      // Be lenient - only validate if it looks like complete JSON
      const trimmedObj = trimmed.trim();
      if (trimmedObj === '') {
        return null; // Empty is allowed
      }

      // Check if it looks like incomplete JSON (starts with { but doesn't end with })
      if (trimmedObj.startsWith('{') && !trimmedObj.endsWith('}')) {
        // Incomplete JSON - don't validate yet (user is still typing)
        return null;
      }

      // If it looks complete, validate it
      if (trimmedObj.startsWith('{') && trimmedObj.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmedObj);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return 'Value must be a valid JSON object (not an array)';
          }
          return null;
        } catch {
          return 'Value must be a valid JSON object';
        }
      }

      // If it doesn't start with {, it's invalid
      return 'Value must be a valid JSON object (start with {)';

    case 'array':
      // Array type should be valid JSON array or comma-separated
      const trimmedArr = trimmed.trim();
      if (trimmedArr === '') {
        return null; // Empty is allowed
      }

      // Check if it looks like incomplete JSON array (starts with [ but doesn't end with ])
      if (trimmedArr.startsWith('[') && !trimmedArr.endsWith(']')) {
        // Incomplete JSON - don't validate yet (user is still typing)
        return null;
      }

      // If it looks like complete JSON array, validate it
      if (trimmedArr.startsWith('[') && trimmedArr.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmedArr);
          if (!Array.isArray(parsed)) {
            return 'Value must be a valid JSON array';
          }
          return null;
        } catch {
          return 'Value must be a valid JSON array';
        }
      }

      // Comma-separated values are acceptable for arrays
      return null;

    case 'null':
      // Null type should be empty or "null"
      if (trimmed.toLowerCase() !== 'null' && trimmed !== '') {
        return 'Value must be empty or "null"';
      }
      return null;

    default:
      return `Unknown type: ${type}`;
  }
};

/**
 * Parses comma-separated string into array
 * Handles strings, numbers, booleans, and JSON objects
 * @param {string} value - Comma-separated string
 * @returns {any[]} Parsed array
 */
export const parseCommaSeparatedArray = (value: string): any[] => {
  if (!value || value.trim() === '') {
    return [];
  }

  // Try to parse as JSON first (for complex arrays)
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not valid JSON, continue with comma-separated parsing
  }

  // Parse comma-separated values
  const items = value.split(',').map(item => {
    const trimmed = item.trim();

    // Try to parse as JSON (for objects, nested arrays, etc.)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // If JSON parsing fails, treat as string
        return trimmed;
      }
    }

    // Try to parse as number
    if (/^-?\d+\.?\d*$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        return num;
      }
    }

    // Try to parse as boolean
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Return as string
    return trimmed;
  });

  return items;
};

/**
 * Formats array value for display in input
 * @param {any} value - Array value
 * @returns {string} Formatted string
 */
export const formatArrayForInput = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    // For simple arrays, show comma-separated
    // For complex arrays (with objects), show JSON
    const hasComplexItems = value.some(item =>
      typeof item === 'object' && item !== null && !Array.isArray(item)
    );

    if (hasComplexItems) {
      return JSON.stringify(value);
    }

    return value.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) return JSON.stringify(item);
      return String(item);
    }).join(', ');
  }

  return String(value);
};

/**
 * Formats object value for display in input
 * @param {any} value - Object value
 * @returns {string} Formatted JSON string
 */
export const formatObjectForInput = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

/**
 * Converts a value to the appropriate type
 * @param {any} value - The value to convert
 * @param {string} type - The target type
 * @returns {any} Converted value
 */
export const convertValue = (value: any, type: string): any => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  try {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
      case 'object':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value;
        }
        return null;
      case 'array':
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          // Try JSON first
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // If JSON fails, try comma-separated
          }
          // Parse comma-separated values
          return parseCommaSeparatedArray(value);
        }
        return null;
      case 'null':
        return null;
      default:
        return value;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Gets nesting depth of a property
 * @param {string} propertyId - ID of the property
 * @param {Array} allProperties - All properties in the store
 * @param {number} currentDepth - Current depth (internal use)
 * @returns {number} Depth level
 */
export const getNestingDepth = (propertyId: string, allProperties: Property[], currentDepth: number = 0): number => {
  if (currentDepth >= MAX_NESTING_DEPTH) {
    return MAX_NESTING_DEPTH;
  }

  const property = allProperties.find((p) => p.id === propertyId);
  if (!property || !property.parentId) {
    return currentDepth;
  }

  return getNestingDepth(property.parentId, allProperties, currentDepth + 1);
};

/**
 * Gets parent chain to check for circular references
 * @param {string} propertyId - ID of the property
 * @param {Array} allProperties - All properties in the store
 * @param {Array} chain - Current chain (internal use)
 * @returns {Array} Array of parent IDs
 */
export const getParentChain = (propertyId: string, allProperties: Property[], chain: string[] = []): string[] => {
  const property = allProperties.find((p) => p.id === propertyId);
  if (!property || !property.parentId) {
    return chain;
  }

  // Check for circular reference
  if (chain.includes(property.parentId)) {
    return [...chain, property.parentId];
  }

  return getParentChain(property.parentId, allProperties, [...chain, property.parentId]);
};

/**
 * Checks if adding a nested property would create a circular reference
 * @param {string} parentId - ID of the parent property
 * @param {string} propertyId - ID of the property to add
 * @param {Array} allProperties - All properties in the store
 * @returns {boolean} True if circular reference would be created
 */
export const wouldCreateCircularReference = (parentId: string, propertyId: string, allProperties: Property[]): boolean => {
  const parentChain = getParentChain(parentId, allProperties);
  return parentChain.includes(propertyId) || propertyId === parentId;
};

/**
 * Validates a complete property
 * @param {Object} property - The property to validate
 * @param {Array} allProperties - All properties in the store
 * @returns {Object} Object with field errors
 */
export const validateProperty = (property: Property, allProperties: Property[] = []): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Get sibling properties for uniqueness check
  const siblings = allProperties.filter(
    (p) => p.parentId === property.parentId && p.id !== property.id
  );

  // Validate key
  const keyError = validateKey(property.key, siblings, property.id);
  if (keyError) {
    errors.key = keyError;
  }

  // Validate type
  const typeError = validateType(property.type);
  if (typeError) {
    errors.type = typeError;
  }

  // Validate nesting depth
  if (property.parentId) {
    const depth = getNestingDepth(property.parentId, allProperties);
    if (depth >= MAX_NESTING_DEPTH) {
      errors.nesting = `Maximum nesting depth of ${MAX_NESTING_DEPTH} reached`;
    }
  }

  // Validate value if provided - use stricter validation
  if (property.value !== null && property.value !== undefined && property.value !== '') {
    // If value is a string and type is not string, it might be raw input
    // Validate it strictly
    if (typeof property.value === 'string' && property.type !== 'string') {
      const inputError = validateInputValue(property.value, property.type);
      if (inputError) {
        errors.value = inputError;
      } else {
        // Also validate the converted value
        const converted = convertValue(property.value, property.type);
        if (converted === null && property.value.trim() !== '') {
          // Conversion failed but input is not empty
          errors.value = `Value does not match type ${property.type}`;
        } else if (!validateValue(converted, property.type)) {
          errors.value = `Value does not match type ${property.type}`;
        }
      }
    } else {
      // Validate converted value
      if (!validateValue(property.value, property.type)) {
        errors.value = `Value does not match type ${property.type}`;
      }
    }
  }

  return errors;
};

/**
 * Validates all properties
 * @param {Array} properties - All properties to validate
 * @returns {Object} Object mapping property IDs to their errors
 */
export const validateAllProperties = (properties: Property[]): Record<string, Record<string, string>> => {
  const allErrors: Record<string, Record<string, string>> = {};

  properties.forEach((property) => {
    const errors = validateProperty(property, properties);
    if (Object.keys(errors).length > 0) {
      allErrors[property.id] = errors;
    }
  });

  return allErrors;
};
