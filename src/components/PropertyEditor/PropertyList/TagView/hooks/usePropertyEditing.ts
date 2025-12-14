import { useState, useEffect, useRef } from 'react';
import useSchemaStore from '../../../../../store/useSchemaStore';
import useValidationStore from '../../../../../store/useValidationStore';
import { convertValue, formatArrayForInput, formatObjectForInput } from '../../../../../utils/validation';
import type { Property, PropertyType } from '../../../../../types';

interface UsePropertyEditingProps {
  property: Property;
}

export const usePropertyEditing = ({ property }: UsePropertyEditingProps) => {
  const updateProperty = useSchemaStore((state) => state.updateProperty);
  const validateProperty = useValidationStore((state) => state.validateProperty);
  const properties = useSchemaStore((state) => state.properties);

  // Get formatted value for input
  const getFormattedValue = (value: any, type: PropertyType): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (type === 'array') {
      return formatArrayForInput(value);
    }
    if (type === 'object') {
      return formatObjectForInput(value);
    }
    return String(value);
  };

  const [localType, setLocalType] = useState<PropertyType>(property.type || 'string');
  const [localDescription, setLocalDescription] = useState<string>(property.description || '');
  const [localValue, setLocalValue] = useState<string>(
    property.value !== undefined ? getFormattedValue(property.value, property.type) : ''
  );
  const [localRequired, setLocalRequired] = useState<boolean>(property.required || false);

  // Sync local state with property changes
  useEffect(() => {
    const newType = property.type || 'string';
    const newDescription = property.description || '';
    const newValue = property.value !== undefined ? getFormattedValue(property.value, property.type) : '';
    const newRequired = property.required || false;

    if (localType !== newType) {
      setLocalType(newType);
    }
    if (localDescription !== newDescription) {
      setLocalDescription(newDescription);
    }
    if (localValue !== newValue) {
      setLocalValue(newValue);
    }
    if (localRequired !== newRequired) {
      setLocalRequired(newRequired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.type, property.description, property.value, property.required]);

  // Use refs to store debounce timers
  const valueUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueValidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypeChange = (newType: PropertyType) => {
    if (newType === localType) return;

    setLocalType(newType);

    // Convert value if type changed
    let newValue = localValue;
    let defaultValue: any = null;

    if ((!localValue || localValue.trim() === '') && (newType === 'object' || newType === 'array')) {
      if (newType === 'object') {
        defaultValue = {};
        newValue = formatObjectForInput({});
      } else if (newType === 'array') {
        defaultValue = [];
        newValue = '[]';
      }
      setLocalValue(newValue);
    } else if (localValue) {
      const converted = convertValue(localValue, newType);
      if (converted !== null) {
        if (newType === 'array') {
          newValue = formatArrayForInput(converted);
        } else if (newType === 'object') {
          newValue = formatObjectForInput(converted);
        } else {
          newValue = String(converted);
        }
      } else {
        newValue = '';
      }
      setLocalValue(newValue);
    }

    const updates: any = { type: newType };
    if (defaultValue !== null) {
      updates.value = defaultValue;
    } else if (newValue !== localValue && newValue) {
      updates.value = convertValue(newValue, newType);
    }
    updateProperty(property.id, updates);

    // Validate after type change
    const updatedProperty: Property = {
      ...property,
      type: newType,
      value: updates.value !== undefined ? updates.value : property.value,
    };
    validateProperty(updatedProperty, properties);
  };

  const handleDescriptionChange = (newDescription: string) => {
    if (newDescription === localDescription) return;
    setLocalDescription(newDescription);
    updateProperty(property.id, { description: newDescription });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue === localValue) return;

    setLocalValue(newValue);

    // Clear previous timers
    if (valueUpdateTimerRef.current) {
      clearTimeout(valueUpdateTimerRef.current);
    }
    if (valueValidationTimerRef.current) {
      clearTimeout(valueValidationTimerRef.current);
    }

    if (localType === 'object' || localType === 'array') {
      valueUpdateTimerRef.current = setTimeout(() => {
        updateProperty(property.id, { value: newValue || null });
        valueUpdateTimerRef.current = null;
      }, 400);

      valueValidationTimerRef.current = setTimeout(() => {
        const trimmed = newValue.trim();
        if (
          trimmed === '' ||
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
          const tempProperty: Property = {
            ...property,
            value: newValue as any,
            type: localType,
          };
          validateProperty(tempProperty, properties);
        }
        valueValidationTimerRef.current = null;
      }, 1000);
    } else {
      const converted = convertValue(newValue, localType);
      valueUpdateTimerRef.current = setTimeout(() => {
        const valueToSet = newValue === '' ? null : converted;
        updateProperty(property.id, { value: valueToSet });
        valueUpdateTimerRef.current = null;
      }, 400);

      valueValidationTimerRef.current = setTimeout(() => {
        const tempProperty: Property = {
          ...property,
          value: newValue as any,
          type: localType,
        };
        validateProperty(tempProperty, properties);
        valueValidationTimerRef.current = null;
      }, 600);
    }
  };

  const handleValueBlur = () => {
    if (valueUpdateTimerRef.current) {
      clearTimeout(valueUpdateTimerRef.current);
      valueUpdateTimerRef.current = null;
    }
    if (valueValidationTimerRef.current) {
      clearTimeout(valueValidationTimerRef.current);
      valueValidationTimerRef.current = null;
    }

    if (localType === 'object' || localType === 'array') {
      const converted = convertValue(localValue, localType);
      updateProperty(property.id, {
        value: converted !== null ? converted : localValue || null,
      });
    } else {
      const converted = convertValue(localValue, localType);
      updateProperty(property.id, { value: localValue === '' ? null : converted });
    }

    const tempProperty: Property = {
      ...property,
      value: localValue as any,
      type: localType,
    };
    validateProperty(tempProperty, properties);
  };

  const handleRequiredChange = (newRequired: boolean) => {
    if (newRequired === localRequired) return;
    setLocalRequired(newRequired);
    updateProperty(property.id, { required: newRequired });
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (valueUpdateTimerRef.current) {
        clearTimeout(valueUpdateTimerRef.current);
      }
      if (valueValidationTimerRef.current) {
        clearTimeout(valueValidationTimerRef.current);
      }
    };
  }, []);

  return {
    localType,
    localDescription,
    localValue,
    localRequired,
    handleTypeChange,
    handleDescriptionChange,
    handleValueChange,
    handleValueBlur,
    handleRequiredChange,
    getFormattedValue,
  };
};
