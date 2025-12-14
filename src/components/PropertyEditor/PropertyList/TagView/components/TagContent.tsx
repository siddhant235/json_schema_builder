import TagValueInput, { TagValueInputRef } from './TagValueInput';
import { useRef } from 'react';
import type { Property, PropertyType } from '../../../../types';

interface TagContentProps {
  property: Property;
  level: number;
  isNewProperty: boolean;
  localType: PropertyType;
  localDescription: string;
  localValue: string;
  localRequired: boolean;
  valueError: string | null;
  onDescriptionChange: (description: string) => void;
  onValueChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onValueBlur: () => void;
  onRequiredChange: (required: boolean) => void;
  valueInputRef?: React.RefObject<TagValueInputRef>;
}

const TagContent = ({
  property,
  level,
  isNewProperty,
  localType,
  localDescription,
  localValue,
  localRequired,
  valueError,
  onDescriptionChange,
  onValueChange,
  onValueBlur,
  onRequiredChange,
  valueInputRef,
}: TagContentProps) => {
  const internalRef = useRef<TagValueInputRef>(null);
  const ref = valueInputRef || internalRef;

  const paddingLeft = `${16 + (level + 1) * 20}px`;

  return (
    <div className="tag-content-inner">
      {/* Show inputs for new properties */}
      {isNewProperty && (
        <>
          {/* Description Input */}
          <div className="tag-data" style={{ paddingLeft }}>
            <label className="data-label">Description</label>
            <input
              type="text"
              className="data-input"
              value={localDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {/* Default Value Input */}
          <div
            className="tag-data"
            style={{
              paddingLeft,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
            }}
          >
            <label className="data-label">Default Value</label>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <TagValueInput
                ref={ref}
                property={property}
                type={localType}
                value={localValue}
                onChange={onValueChange}
                onBlur={onValueBlur}
                error={valueError}
              />
            </div>
          </div>

          {/* Required Checkbox */}
          <div className="tag-data" style={{ paddingLeft }}>
            <label className="checkbox-label-inline">
              <input
                type="checkbox"
                checked={localRequired}
                onChange={(e) => onRequiredChange(e.target.checked)}
              />
              <span>Required</span>
            </label>
          </div>

          {/* Info message for object type */}
          {localType === 'object' && (
            <div className="tag-data" style={{ paddingLeft }}>
              <label className="data-label">Info</label>
              <div className="data-description" style={{ fontStyle: 'normal', color: '#6c757d' }}>
                After saving, use "Add Child" to add nested properties
              </div>
            </div>
          )}
        </>
      )}

      {/* Render inputs for existing properties */}
      {!isNewProperty && (
        <>
          {/* Description Input */}
          <div className="tag-data" style={{ paddingLeft }}>
            <label className="data-label">Description</label>
            <input
              type="text"
              className="data-input"
              value={localDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {/* Default Value Input */}
          <div
            className="tag-data"
            style={{
              paddingLeft,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
            }}
          >
            <label className="data-label">Default Value</label>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <TagValueInput
                ref={ref}
                property={property}
                type={localType}
                value={localValue}
                onChange={onValueChange}
                onBlur={onValueBlur}
                error={valueError}
              />
            </div>
          </div>

          {/* Required Checkbox */}
          <div className="tag-data" style={{ paddingLeft }}>
            <label className="checkbox-label-inline">
              <input
                type="checkbox"
                checked={localRequired}
                onChange={(e) => onRequiredChange(e.target.checked)}
              />
              <span>Required</span>
            </label>
          </div>

          {/* Info message for object properties */}
          {property.type === 'object' && (
            <div className="tag-data" style={{ paddingLeft }}>
              <label className="data-label">Info</label>
              <div className="data-description" style={{ fontStyle: 'normal', color: '#6c757d' }}>
                Use "Add Child" button to add nested properties
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TagContent;
