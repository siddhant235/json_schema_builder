import TagNameEditor from './TagNameEditor';
import TagTypeSelector from './TagTypeSelector';
import type { Property, PropertyType } from '../../../../types';

interface TagHeaderProps {
  property: Property;
  level: number;
  isExpanded: boolean;
  isEditingName: boolean;
  editedName: string;
  localType: PropertyType;
  localDescription: string;
  localValue: string;
  localRequired: boolean;
  isNewProperty: boolean;
  onToggleCollapse: () => void;
  onNameChange: (name: string) => void;
  onNameSave: () => void;
  onNameCancel: () => void;
  onNameClick: () => void;
  onTypeChange: (type: PropertyType) => void;
  onAddChild?: () => void;
  onDelete: () => void;
}

const TagHeader = ({
  property,
  level,
  isExpanded,
  isEditingName,
  editedName,
  localType,
  localDescription,
  localValue,
  localRequired,
  isNewProperty,
  onToggleCollapse,
  onNameChange,
  onNameSave,
  onNameCancel,
  onNameClick,
  onTypeChange,
  onAddChild,
  onDelete,
}: TagHeaderProps) => {
  return (
    <div className="tag-header" style={{ paddingLeft: `${16 + level * 20}px` }}>
      {/* Collapse/Expand Button */}
      <button
        className="toggle-btn"
        onClick={onToggleCollapse}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? '∨' : '›'}
      </button>

      {/* Tag Name */}
      <TagNameEditor
        property={property}
        isEditing={isEditingName}
        editedName={editedName}
        localType={localType}
        localDescription={localDescription}
        localValue={localValue}
        localRequired={localRequired}
        onNameChange={onNameChange}
        onNameSave={onNameSave}
        onCancel={onNameCancel}
        onStartEdit={onNameClick}
        autoFocus={isNewProperty}
      />

      {/* Type Selector */}
      <TagTypeSelector
        property={property}
        value={localType}
        onChange={onTypeChange}
      />

      {/* Required Badge */}
      {property.required && <span className="required-badge">required</span>}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        {!isNewProperty && property.type === 'object' && onAddChild && (
          <button className="add-child-btn" onClick={onAddChild}>
            Add Child
          </button>
        )}
        <button className="delete-btn" onClick={onDelete} title="Delete">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.5 5.5C5.77614 5.5 6 5.72386 6 6V11C6 11.2761 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.2761 5 11V6C5 5.72386 5.22386 5.5 5.5 5.5Z"
              fill="currentColor"
            />
            <path
              d="M8 5.5C8.27614 5.5 8.5 5.72386 8.5 6V11C8.5 11.2761 8.27614 11.5 8 11.5C7.72386 11.5 7.5 11.2761 7.5 11V6C7.5 5.72386 7.72386 5.5 8 5.5Z"
              fill="currentColor"
            />
            <path
              d="M10.5 6C10.5 5.72386 10.7239 5.5 11 5.5C11.2761 5.5 11.5 5.72386 11.5 6V11C11.5 11.2761 11.2761 11.5 11 11.5C10.7239 11.5 10.5 11.2761 10.5 11V6Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.5 3C15.0523 3 15.5 3.44772 15.5 4V4.5C15.5 5.05228 15.0523 5.5 14.5 5.5H13V13C13 14.1046 12.1046 15 11 15H5C3.89543 15 3 14.1046 3 13V5.5H1.5C0.947715 5.5 0.5 5.05228 0.5 4.5V4C0.5 3.44772 0.947715 3 1.5 3H6C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3H14.5ZM4 5.5V13C4 13.2761 4.22386 13.5 4.5 13.5H11.5C11.7761 13.5 12 13.2761 12 13V5.5H4ZM1.5 4H14.5V4.5H1.5V4Z"
              fill="currentColor"
            />
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default TagHeader;
