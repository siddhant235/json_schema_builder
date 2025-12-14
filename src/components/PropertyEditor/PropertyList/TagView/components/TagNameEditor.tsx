import { useRef, useEffect } from 'react';
import useSchemaStore from '../../../../../store/useSchemaStore';
import useValidationStore from '../../../../../store/useValidationStore';
import { convertValue } from '../../../../../utils/validation';
import type { Property, PropertyType } from '../../../../types';

interface TagNameEditorProps {
  property: Property;
  isEditing: boolean;
  editedName: string;
  localType: PropertyType;
  localDescription: string;
  localValue: string;
  localRequired: boolean;
  onNameChange: (name: string) => void;
  onNameSave: () => void;
  onCancel: () => void;
  onStartEdit?: () => void;
  autoFocus?: boolean;
}

const TagNameEditor = ({
  property,
  isEditing,
  editedName,
  localType,
  localDescription,
  localValue,
  localRequired,
  onNameChange,
  onNameSave,
  onCancel,
  onStartEdit,
  autoFocus = false,
}: TagNameEditorProps) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const updateProperty = useSchemaStore((state) => state.updateProperty);
  const validateProperty = useValidationStore((state) => state.validateProperty);
  const properties = useSchemaStore((state) => state.properties);
  const getFieldError = useValidationStore((state) => state.getFieldError);

  const keyError = getFieldError(property.id, 'key');
  const nameUpdateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isEditing && autoFocus) {
      const focusTimer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [isEditing, autoFocus]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onNameChange(newName);

    // Update property key in real-time
    updateProperty(property.id, { key: newName });

    // Validate on change (debounced)
    if (nameUpdateTimerRef.current) {
      clearTimeout(nameUpdateTimerRef.current);
    }

    nameUpdateTimerRef.current = setTimeout(() => {
      const tempProperty: Property = {
        ...property,
        key: newName.trim(),
        type: localType,
        description: localDescription,
        value: localValue ? convertValue(localValue, localType) : null,
        required: localRequired,
      };
      validateProperty(tempProperty, properties);
      nameUpdateTimerRef.current = null;
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNameSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleNameClick = () => {
    if (onStartEdit) {
      onStartEdit();
    }
  };

  if (isEditing) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          ref={nameInputRef}
          type="text"
          className={`tag-name-input ${keyError ? 'tag-name-input--error' : ''}`}
          value={editedName}
          onChange={handleNameChange}
          onBlur={onNameSave}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder="Enter key name"
        />
        {keyError && <span className="tag-error-message">{keyError}</span>}
      </div>
    );
  }

  return (
    <div
      className={`tag-name ${keyError ? 'tag-name--error' : ''}`}
      onClick={handleNameClick}
    >
      {property.key || '(unnamed)'}
    </div>
  );
};

export default TagNameEditor;
