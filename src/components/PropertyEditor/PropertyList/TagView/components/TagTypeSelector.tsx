import { useState } from 'react';
import useValidationStore from '../../../../../store/useValidationStore';
import type { Property, PropertyType } from '../../../../types';

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'null', label: 'Null' },
];

interface TagTypeSelectorProps {
  property: Property;
  value: PropertyType;
  onChange: (type: PropertyType) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const TagTypeSelector = ({ property, value, onChange, onFocus, onBlur }: TagTypeSelectorProps) => {
  const getFieldError = useValidationStore((state) => state.getFieldError);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const typeError = getFieldError(property.id, 'type');

  const handleFocus = () => {
    setIsSelectOpen(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsSelectOpen(false);
    onBlur?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <select
        className={`type-select ${typeError ? 'type-select--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value as PropertyType)}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {typeError && (
        <span className="tag-error-message" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          {typeError}
        </span>
      )}
    </div>
  );
};

export default TagTypeSelector;
