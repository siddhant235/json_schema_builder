import { useState, useEffect, FormEvent } from 'react';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import Button from '../../common/Button/Button';
import useSchemaStore from '../../../store/useSchemaStore';
import useValidationStore from '../../../store/useValidationStore';
import { convertValue, formatArrayForInput, formatObjectForInput } from '../../../utils/validation';
import type { Property, PropertyUpdate } from '../../../types';
import './PropertyForm.css';

const TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'null', label: 'Null' },
];

interface PropertyFormProps {
  property?: Property | null;
  onSubmit: (data: PropertyUpdate) => void;
  onCancel: () => void;
  isNested?: boolean;
}

interface FormData {
  key: string;
  description: string;
  type: Property['type'];
  value: string;
  required: boolean;
}

const PropertyForm = ({ property, onSubmit, onCancel, isNested = false }: PropertyFormProps) => {
  const updateProperty = useSchemaStore((state) => state.updateProperty);
  const validateProperty = useValidationStore((state) => state.validateProperty);
  const getFieldError = useValidationStore((state) => state.getFieldError);
  const properties = useSchemaStore((state) => state.properties);

  const getFormattedValue = (value: any, type: Property['type']): string => {
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

  const [formData, setFormData] = useState<FormData>({
    key: property?.key || '',
    description: property?.description || '',
    type: property?.type || 'string',
    value: property?.value !== undefined ? getFormattedValue(property.value, property.type) : '',
    required: property?.required || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (property) {
      setFormData({
        key: property.key || '',
        description: property.description || '',
        type: property.type || 'string',
        value: property.value !== undefined ? getFormattedValue(property.value, property.type) : '',
        required: property.required || false,
      });
    }
  }, [property]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // If type changed, try to convert value
    if (field === 'type' && formData.value) {
      const converted = convertValue(formData.value, value as string);
      if (converted !== null) {
        if (value === 'array') {
          newFormData.value = formatArrayForInput(converted);
        } else if (value === 'object') {
          newFormData.value = formatObjectForInput(converted);
        } else {
          newFormData.value = String(converted);
        }
      } else {
        newFormData.value = '';
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create property object for validation
    const propertyToValidate: Property = {
      id: property?.id || 'temp',
      key: formData.key.trim(),
      type: formData.type,
      description: formData.description.trim(),
      value: formData.value ? convertValue(formData.value, formData.type) : null,
      required: formData.required,
      parentId: property?.parentId || null,
      properties: property?.properties || [],
    };

    // Validate
    const validationErrors = validateProperty(propertyToValidate, properties);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit
    onSubmit({
      key: propertyToValidate.key,
      description: propertyToValidate.description,
      type: propertyToValidate.type,
      value: propertyToValidate.value,
      required: propertyToValidate.required,
    });
  };

  const getValueInputType = (): 'text' | 'number' => {
    switch (formData.type) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'text'; // Will use select instead
      default:
        return 'text';
    }
  };

  const renderValueInput = () => {
    if (formData.type === 'boolean') {
      return (
        <Select
          label="Default Value"
          value={formData.value}
          onChange={(e) => handleChange('value', e.target.value)}
          options={[
            { value: '', label: 'None' },
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
          ]}
          error={errors.value}
        />
      );
    }

    if (formData.type === 'array') {
      return (
        <div className="property-form__array-input">
          <Input
            type="textarea"
            label="Default Value (Array)"
            value={formData.value}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder='Enter comma-separated values (e.g., item1, item2, item3) or JSON array (e.g., ["item1", "item2"])'
            error={errors.value}
          />
          <p className="property-form__hint">
            💡 Tip: Use comma-separated values (e.g., apple, banana, cherry) or JSON array format for complex arrays with objects.
          </p>
        </div>
      );
    }

    if (formData.type === 'object') {
      return (
        <div className="property-form__object-input">
          <Input
            type="textarea"
            label="Default Value (Object)"
            value={formData.value}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder='Enter JSON object (e.g., {"key": "value", "number": 123})'
            error={errors.value}
          />
          <p className="property-form__hint">
            💡 Tip: Use JSON format for object values. Nested properties can be added separately.
          </p>
        </div>
      );
    }

    return (
      <Input
        type={getValueInputType()}
        label="Default Value"
        value={formData.value}
        onChange={(e) => handleChange('value', e.target.value)}
        placeholder={`Enter ${formData.type} value`}
        error={errors.value}
      />
    );
  };

  return (
    <form className={`property-form ${isNested ? 'property-form--nested' : ''}`} onSubmit={handleSubmit}>
      <div className="property-form__header">
        <h3 className="property-form__title">
          {property ? 'Edit Property' : 'Add Property'}
        </h3>
      </div>

      <div className="property-form__fields">
        <Input
          label="Key"
          value={formData.key}
          onChange={(e) => handleChange('key', e.target.value)}
          placeholder="propertyName"
          required
          error={errors.key}
          autoFocus
        />

        <Select
          label="Type"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={TYPE_OPTIONS}
          required
          error={errors.type}
        />

        <Input
          type="textarea"
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description"
          error={errors.description}
        />

        {renderValueInput()}

        <div className="property-form__checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.required}
              onChange={(e) => handleChange('required', e.target.checked)}
            />
            <span>Required</span>
          </label>
        </div>
      </div>

      <div className="property-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {property ? 'Update' : 'Add'} Property
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
