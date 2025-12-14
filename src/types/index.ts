export type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface Property {
  id: string;
  key: string;
  description: string;
  type: PropertyType;
  value: any;
  required: boolean;
  parentId: string | null;
  properties: Property[];
  items?: Property;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface JSONSchemaProperty {
  key: string;
  type: PropertyType;
  description?: string;
  default?: any;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  items?: JSONSchemaProperty;
}

export interface SavedData {
  schema: JSONSchema;
  properties: Property[];
  timestamp: number;
}

export interface ValidationErrors {
  [propertyId: string]: {
    key?: string;
    type?: string;
    value?: string;
    nesting?: string;
  };
}

export interface PropertyUpdate {
  key?: string;
  description?: string;
  type?: PropertyType;
  value?: any;
  required?: boolean;
  parentId?: string | null;
  properties?: Property[];
  items?: Property;
}
