import React, { useState, useEffect, useRef } from "react";
import useSchemaStore from "../../../../store/useSchemaStore";
import useValidationStore from "../../../../store/useValidationStore";
import ConfirmDialog from "../../../common/ConfirmDialog/ConfirmDialog";
import { validateInputValue } from "../../../../utils/validation";
import type { Property, PropertyType } from "../../../../types";
import { usePropertyEditing } from "./hooks/usePropertyEditing";
import TagHeader from "./components/TagHeader";
import TagContent from "./components/TagContent";
import { TagValueInputRef } from "./components/TagValueInput";
import "./TagView.css";

interface TagViewProps {
  property: Property;
  onEdit: (propertyId: string) => void;
  onDelete: (propertyId: string) => void;
  onToggleExpand?: (propertyId: string) => void;
  isExpanded: boolean;
  onAddNested?: (propertyId: string) => void;
  level?: number;
  children?: Property[];
  getChildProperties?: (parentId: string) => Property[];
  expandedProperties?: Set<string>;
}

/**
 * TagView Component - Recursive component for rendering nested property hierarchy
 * Adapted from ai-monk-tag-view to work with Property structure
 */
const TagView: React.FC<TagViewProps> = React.memo(({
  property,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded,
  onAddNested,
  level = 0,
  children = [],
  getChildProperties,
  expandedProperties,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(!isExpanded);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(property.key || "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const valueInputRef = useRef<TagValueInputRef>(null);

  const getFieldError = useValidationStore((state) => state.getFieldError);
  const validateProperty = useValidationStore((state) => state.validateProperty);
  const properties = useSchemaStore((state) => state.properties);

  // Use custom hook for property editing logic
  const {
    localType,
    localDescription,
    localValue,
    localRequired,
    handleTypeChange,
    handleDescriptionChange,
    handleValueChange,
    handleValueBlur,
    handleRequiredChange,
  } = usePropertyEditing({ property });

  // Get validation errors
  const valueError = getFieldError(property.id, 'value');

  // Get children if not provided
  const actualChildren = children.length > 0
    ? children
    : (getChildProperties ? getChildProperties(property.id) : []);

  const hasChildren = actualChildren.length > 0;
  const hasNested = hasChildren && property.type === 'object';
  const isNewProperty = !property.key || property.key.trim() === '';

  // Auto-expand new properties and focus name input
  useEffect(() => {
    if (isNewProperty) {
      setIsCollapsed(false);
      if (onToggleExpand && !expandedProperties?.has(property.id)) {
        onToggleExpand(property.id);
      }
      setIsEditingName(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewProperty]);

  // Sync collapsed state with isExpanded prop
  useEffect(() => {
    setIsCollapsed(!isExpanded);
  }, [isExpanded]);

  // Auto-expand and focus on value input if there's a value error
  useEffect(() => {
    if (valueError && isCollapsed) {
      setIsCollapsed(false);
      if (onToggleExpand) {
        onToggleExpand(property.id);
      }
      setTimeout(() => {
        valueInputRef.current?.focus();
      }, 100);
    }
  }, [valueError, isCollapsed, property.id, onToggleExpand]);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onToggleExpand) {
      onToggleExpand(property.id);
    }
  };

  const handleAddChild = () => {
    if (onAddNested) {
      onAddNested(property.id);
    }
    if (isCollapsed) {
      setIsCollapsed(false);
      if (onToggleExpand) {
        onToggleExpand(property.id);
      }
    }
  };

  const handleNameClick = () => {
    setIsEditingName(true);
    setEditedName(property.key || "");
  };

  const handleNameChange = (name: string) => {
    setEditedName(name);
    // Note: Actual update happens in TagNameEditor component
  };

  const handleNameSave = () => {
    const trimmedKey = editedName.trim();
    if (trimmedKey !== (property.key || '').trim()) {
      useSchemaStore.getState().updateProperty(property.id, { key: trimmedKey });
    }

    // Validate the final property
    const tempProperty: Property = {
      ...property,
      key: trimmedKey,
      type: localType,
      description: localDescription,
      value: property.value, // Keep existing value for validation
      required: localRequired,
    };
    validateProperty(tempProperty, properties);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName(property.key || "");
  };

  // Handle value blur with validation
  const handleValueBlurWithValidation = () => {
    handleValueBlur();

    // Additional validation for input value
    const tempProperty: Property = {
      ...property,
      value: localValue as any,
      type: localType,
    };

    validateProperty(tempProperty, properties);
    const inputError = validateInputValue(localValue, localType);

    if (inputError) {
      const currentErrors = useValidationStore.getState().errors;
      const propertyErrors = currentErrors[property.id] || {};
      const hasValueError = propertyErrors.value;

      if (!hasValueError) {
        useValidationStore.setState({
          errors: {
            ...currentErrors,
            [property.id]: {
              ...propertyErrors,
              value: inputError,
            },
          },
        });
      }
    }
  };

  // Handle type change with focus management
  const handleTypeChangeWithFocus = (type: PropertyType) => {
    handleTypeChange(type);

    // Check if there's a value error after type change
    setTimeout(() => {
      const errors = useValidationStore.getState().errors[property.id];
      if (errors?.value) {
        setIsCollapsed(false);
        if (onToggleExpand) {
          onToggleExpand(property.id);
        }
        setTimeout(() => {
          valueInputRef.current?.focus();
        }, 150);
      }
    }, 100);
  };

  // Count all nested properties recursively
  const countNestedProperties = (parentId: string): number => {
    const directChildren = getChildProperties ? getChildProperties(parentId) : [];
    let count = directChildren.length;

    directChildren.forEach((child) => {
      count += countNestedProperties(child.id);
    });

    return count;
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(property.id);
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const nestedCount = countNestedProperties(property.id);
  const propertyName = property.key && property.key.trim() !== ''
    ? property.key
    : 'this unnamed property';

  return (
    <div className={`tag-view ${level === 0 ? "root-tag" : ""}`}>
      {/* Tag Header */}
      <TagHeader
        property={property}
        level={level}
        isExpanded={!isCollapsed}
        isEditingName={isEditingName}
        editedName={editedName}
        localType={localType}
        localDescription={localDescription}
        localValue={localValue}
        localRequired={localRequired}
        isNewProperty={isNewProperty}
        onToggleCollapse={toggleCollapse}
        onNameChange={handleNameChange}
        onNameSave={handleNameSave}
        onNameCancel={handleNameCancel}
        onNameClick={handleNameClick}
        onTypeChange={handleTypeChangeWithFocus}
        onAddChild={handleAddChild}
        onDelete={handleDelete}
      />

      {/* Tag Content - Animated collapse/expand */}
      <div className={`tag-content ${isCollapsed ? "collapsed" : ""}`}>
        <TagContent
          property={property}
          level={level}
          isNewProperty={isNewProperty}
          localType={localType}
          localDescription={localDescription}
          localValue={localValue}
          localRequired={localRequired}
          valueError={valueError}
          onDescriptionChange={handleDescriptionChange}
          onValueChange={handleValueChange}
          onValueBlur={handleValueBlurWithValidation}
          onRequiredChange={handleRequiredChange}
          valueInputRef={valueInputRef as React.RefObject<TagValueInputRef>}
        />

        {/* Render Children Recursively */}
        {hasNested && (
          <div className="tag-children">
            {actualChildren.map((child) => {
              const childIsExpanded = expandedProperties ? expandedProperties.has(child.id) : false;
              return (
                <TagView
                  key={child.id}
                  property={child}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleExpand={onToggleExpand}
                  isExpanded={childIsExpanded}
                  onAddNested={child.type === 'object' && onAddNested ? onAddNested : undefined}
                  level={level + 1}
                  children={[]}
                  getChildProperties={getChildProperties}
                  expandedProperties={expandedProperties}
                />
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Property"
        message={
          <>
            <p>Do you want to delete this key: <strong>"{propertyName}"</strong>?</p>
            {nestedCount > 0 && (
              <p>It has <strong>{nestedCount}</strong> nested {nestedCount === 1 ? 'property' : 'properties'} that will also be deleted.</p>
            )}
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  );
});

TagView.displayName = "TagView";

export default TagView;
