import { useRef, forwardRef, useImperativeHandle } from 'react';
import useSchemaStore from '../../../../../store/useSchemaStore';
import useValidationStore from '../../../../../store/useValidationStore';
import type { Property, PropertyType } from '../../../../../types';

interface TagValueInputProps {
  property: Property;
  type: PropertyType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
  error?: string | null;
}

export interface TagValueInputRef {
  focus: () => void;
}

const TagValueInput = forwardRef<TagValueInputRef, TagValueInputProps>(
  ({ property, type, value, onChange, onBlur, error }, ref) => {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);
    const updateProperty = useSchemaStore((state) => state.updateProperty);
    const validateProperty = useValidationStore((state) => state.validateProperty);
    const properties = useSchemaStore((state) => state.properties);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const inputClassName = `data-input ${error ? 'data-input--error' : ''}`;

    if (type === 'boolean') {
      return (
        <>
          <select
            ref={inputRef as any}
            className={inputClassName}
            value={value}
            onChange={(e) => {
              const newValue = e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
              updateProperty(property.id, { value: newValue });
              // Validate after update
              const updatedProperty = { ...property, value: newValue, type };
              validateProperty(updatedProperty, properties);
              // Also trigger onChange for consistency
              const changeEvent = {
                target: { value: e.target.value },
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(changeEvent);
            }}
            onBlur={onBlur}
          >
            <option value="">None</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
          {error && <span className="tag-error-message">{error}</span>}
        </>
      );
    }

    if (type === 'array' || type === 'object') {
      return (
        <>
          <textarea
            ref={inputRef as any}
            className={`${inputClassName} data-input--textarea`}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={
              type === 'array' ? 'Enter comma-separated values or JSON array' : 'Enter JSON object'
            }
            rows={3}
          />
          {error && <span className="tag-error-message">{error}</span>}
        </>
      );
    }

    const inputType = type === 'number' ? 'number' : 'text';

    return (
      <>
        <input
          ref={inputRef as any}
          type={inputType}
          className={inputClassName}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={`Enter ${type} value`}
        />
        {error && <span className="tag-error-message">{error}</span>}
      </>
    );
  }
);

TagValueInput.displayName = 'TagValueInput';

export default TagValueInput;
