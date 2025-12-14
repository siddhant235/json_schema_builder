import React, { useState, useEffect, useRef } from "react";
import useSchemaStore from "../../../../store/useSchemaStore";
import useValidationStore from "../../../../store/useValidationStore";
import ConfirmDialog from "../../../common/ConfirmDialog/ConfirmDialog";
import { convertValue, formatArrayForInput, formatObjectForInput, validateInputValue } from "../../../../utils/validation";
import type { Property, PropertyType } from "../../../../types";
import "./TagView.css";

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'null', label: 'Null' },
];

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
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const valueInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  const updateProperty = useSchemaStore((state) => state.updateProperty);
  const validateProperty = useValidationStore((state) => state.validateProperty);
  const getFieldError = useValidationStore((state) => state.getFieldError);
  const properties = useSchemaStore((state) => state.properties);

  // Get validation errors for this property
  const keyError = getFieldError(property.id, 'key');
  const typeError = getFieldError(property.id, 'type');
  const valueError = getFieldError(property.id, 'value');

  // Get children if not provided
  const actualChildren = children.length > 0
    ? children
    : (getChildProperties ? getChildProperties(property.id) : []);

  const hasChildren = actualChildren.length > 0;
  const hasNested = hasChildren && property.type === 'object';

  // All properties should be expandable to show default value and required flag
  const isExpandable = true;

  // Check if property is new (empty key)
  const isNewProperty = !property.key || property.key.trim() === '';

  // Auto-expand new properties and focus name input
  useEffect(() => {
    if (isNewProperty) {
      setIsCollapsed(false);
      if (onToggleExpand && !expandedProperties?.has(property.id)) {
        onToggleExpand(property.id);
      }
      setIsEditingName(true);
      // Focus the name input after a small delay to ensure it's rendered
      const focusTimer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewProperty]); // Only run when isNewProperty changes

  // Sync collapsed state with isExpanded prop
  useEffect(() => {
    setIsCollapsed(!isExpanded);
  }, [isExpanded]);

  // Auto-expand and focus on value input if there's a value error
  useEffect(() => {
    if (valueError && isCollapsed) {
      // Expand the accordion
      setIsCollapsed(false);
      if (onToggleExpand) {
        onToggleExpand(property.id);
      }
      // Focus on value input after a short delay to ensure it's rendered
      setTimeout(() => {
        valueInputRef.current?.focus();
      }, 100);
    }
  }, [valueError, isCollapsed, property.id, onToggleExpand]);

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
  const [localValue, setLocalValue] = useState<string>(property.value !== undefined ? getFormattedValue(property.value, property.type) : '');
  const [localRequired, setLocalRequired] = useState<boolean>(property.required || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sync local state with property changes - only update if values actually changed
  useEffect(() => {
    const newType = property.type || 'string';
    const newDescription = property.description || '';
    const newValue = property.value !== undefined ? getFormattedValue(property.value, property.type) : '';
    const newRequired = property.required || false;

    // Only update if values actually changed to prevent infinite loops
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
    // Expand the parent to show the new child
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditedName(newName);

    // Update property key in real-time as user types
    updateProperty(property.id, { key: newName });

    // Validate on change (debounced)
    if (valueUpdateTimerRef.current) {
      clearTimeout(valueUpdateTimerRef.current);
    }

    valueUpdateTimerRef.current = setTimeout(() => {
      const tempProperty: Property = {
        ...property,
        key: newName.trim(),
        type: localType,
        description: localDescription,
        value: localValue ? convertValue(localValue, localType) : null,
        required: localRequired,
      };
      validateProperty(tempProperty, properties);
      valueUpdateTimerRef.current = null;
    }, 300);
  };

  const handleNameSave = () => {
    const trimmedKey = editedName.trim();
    // Key is already updated in real-time via handleNameChange
    // Just trim it and validate
    if (trimmedKey !== property.key.trim()) {
      updateProperty(property.id, { key: trimmedKey });
    }

    // Validate the final property
    const tempProperty: Property = {
      ...property,
      key: trimmedKey,
      type: localType,
      description: localDescription,
      value: localValue ? convertValue(localValue, localType) : null,
      required: localRequired,
    };
    validateProperty(tempProperty, properties);

    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setEditedName(property.key || "");
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as PropertyType;

    // Only update if type actually changed
    if (newType === localType) return;

    setLocalType(newType);

    // Convert value if type changed
    let newValue = localValue;
    let defaultValue: any = null;

    // Set default values for object and array types if no value exists
    if ((!localValue || localValue.trim() === '') && (newType === 'object' || newType === 'array')) {
      if (newType === 'object') {
        defaultValue = {};
        newValue = formatObjectForInput({});
      } else if (newType === 'array') {
        defaultValue = [];
        // Show [] in input for empty array to indicate it's an array type
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

    // Update property with new type and converted value or default value
    const updates: any = { type: newType };
    if (defaultValue !== null) {
      // Use default value for object/array
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
    const errors = validateProperty(updatedProperty, properties);

    // If there's a value error after type change, expand accordion and focus on value input
    if (errors.value) {
      // Expand the accordion
      setIsCollapsed(false);
      if (onToggleExpand) {
        onToggleExpand(property.id);
      }
      // Focus on value input after a short delay
      setTimeout(() => {
        valueInputRef.current?.focus();
      }, 150);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    // Only update if description actually changed
    if (newDescription === localDescription) return;

    setLocalDescription(newDescription);
    updateProperty(property.id, { description: newDescription });
  };

  // Use refs to store debounce timers
  const valueUpdateTimerRef = React.useRef<number | null>(null);
  const valueValidationTimerRef = React.useRef<number | null>(null);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Only update if value actually changed
    if (newValue === localValue) return;

    // Update local state immediately for responsive UI
    setLocalValue(newValue);

    // Clear previous timers
    if (valueUpdateTimerRef.current) {
      clearTimeout(valueUpdateTimerRef.current);
    }
    if (valueValidationTimerRef.current) {
      clearTimeout(valueValidationTimerRef.current);
    }

    // For object/array types, store raw string value without conversion while typing
    // This allows users to type incomplete JSON without errors
    if (localType === 'object' || localType === 'array') {
      // Store the raw string value (debounced) - don't convert while typing
      // This prevents interference with typing incomplete JSON
      valueUpdateTimerRef.current = setTimeout(() => {
        // Store as string for object/array types while typing - don't convert yet
        // This allows incomplete JSON to be stored without errors
        updateProperty(property.id, { value: newValue || null });
        valueUpdateTimerRef.current = null;
      }, 400); // Moderate debounce for value update

      // Validate only after user stops typing (longer debounce for validation)
      // Only validate complete-looking JSON
      valueValidationTimerRef.current = setTimeout(() => {
        const trimmed = newValue.trim();
        // Only validate if JSON looks complete or is empty
        if (trimmed === '' ||
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          const tempProperty: Property = {
            ...property,
            value: newValue as any, // Pass raw input for validation
            type: localType,
          };
          validateProperty(tempProperty, properties);
        }
        // Don't validate incomplete JSON - let user finish typing
        valueValidationTimerRef.current = null;
      }, 1000); // Longer debounce for validation to allow complete JSON typing
    } else {
      // For other types, convert and validate (debounced)
      const converted = convertValue(newValue, localType);

      // Update property value (debounced)
      valueUpdateTimerRef.current = setTimeout(() => {
        const valueToSet = newValue === '' ? null : converted;
        updateProperty(property.id, { value: valueToSet });
        valueUpdateTimerRef.current = null;
      }, 400); // Moderate debounce

      // Validate (with longer debounce)
      valueValidationTimerRef.current = setTimeout(() => {
        const tempProperty: Property = {
          ...property,
          value: newValue as any, // Pass raw input for validation
          type: localType,
        };
        validateProperty(tempProperty, properties);
        valueValidationTimerRef.current = null;
      }, 600); // Longer debounce for validation
    }
  };

  const handleValueBlur = () => {
    // Clear any pending timers
    if (valueUpdateTimerRef.current) {
      clearTimeout(valueUpdateTimerRef.current);
      valueUpdateTimerRef.current = null;
    }
    if (valueValidationTimerRef.current) {
      clearTimeout(valueValidationTimerRef.current);
      valueValidationTimerRef.current = null;
    }

    // For object/array types, try to convert the JSON on blur
    let finalValue = localValue;
    if (localType === 'object' || localType === 'array') {
      const converted = convertValue(localValue, localType);
      // If conversion succeeded, use converted value; otherwise keep raw string
      finalValue = converted !== null ? (typeof converted === 'string' ? converted : JSON.stringify(converted)) : localValue;
      updateProperty(property.id, { value: converted !== null ? converted : (localValue || null) });
    } else {
      // For other types, convert value
      const converted = convertValue(localValue, localType);
      finalValue = localValue;
      updateProperty(property.id, { value: localValue === '' ? null : converted });
    }

    // Validate on blur
    const tempProperty: Property = {
      ...property,
      value: localValue as any, // Pass raw input for validation
      type: localType,
    };

    const errors = validateProperty(tempProperty, properties);

    // If there's an input error, ensure it's set
    const inputError = validateInputValue(localValue, localType);
    if (inputError && !errors.value) {
      const currentErrors = useValidationStore.getState().errors;
      const propertyErrors = currentErrors[property.id] || {};
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
  };

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (valueUpdateTimerRef.current) {
        clearTimeout(valueUpdateTimerRef.current);
      }
      if (valueValidationTimerRef.current) {
        clearTimeout(valueValidationTimerRef.current);
      }
    };
  }, []);

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRequired = e.target.checked;
    // Only update if required flag actually changed
    if (newRequired === localRequired) return;

    setLocalRequired(newRequired);
    updateProperty(property.id, { required: newRequired });
  };

  const getValueInputType = (): 'text' | 'number' => {
    switch (localType) {
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  };

  const renderValueInput = () => {
    const inputClassName = `data-input ${valueError ? 'data-input--error' : ''}`;

    if (localType === 'boolean') {
      return (
        <>
          <select
            ref={valueInputRef as any}
            className={inputClassName}
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              const newValue = e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
              updateProperty(property.id, { value: newValue });
              // Validate after update
              const updatedProperty = { ...property, value: newValue, type: localType };
              validateProperty(updatedProperty, properties);
            }}
          >
            <option value="">None</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
          {valueError && <span className="tag-error-message">{valueError}</span>}
        </>
      );
    }

    if (localType === 'array' || localType === 'object') {
      return (
        <>
          <textarea
            ref={valueInputRef as any}
            className={`${inputClassName} data-input--textarea`}
            value={localValue}
            onChange={handleValueChange}
            onBlur={handleValueBlur}
            placeholder={localType === 'array' ? 'Enter comma-separated values or JSON array' : 'Enter JSON object'}
            rows={3}
          />
          {valueError && <span className="tag-error-message">{valueError}</span>}
        </>
      );
    }

    return (
      <>
        <input
          ref={valueInputRef as any}
          type={getValueInputType()}
          className={inputClassName}
          value={localValue}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
          placeholder={`Enter ${localType} value`}
        />
        {valueError && <span className="tag-error-message">{valueError}</span>}
      </>
    );
  };

  // Count all nested properties recursively
  const countNestedProperties = (parentId: string): number => {
    const directChildren = getChildProperties ? getChildProperties(parentId) : [];
    let count = directChildren.length;

    // Recursively count nested properties
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

  // Get nested property count for modal message
  const nestedCount = countNestedProperties(property.id);
  const propertyName = property.key && property.key.trim() !== ''
    ? property.key
    : 'this unnamed property';

  return (
    <div className={`tag-view ${level === 0 ? "root-tag" : ""} ${isSelectOpen ? "tag-view--select-open" : ""}`}>
      {/* Tag Header */}
      <div className="tag-header" style={{ paddingLeft: `${16 + level * 20}px` }}>
        {/* Collapse/Expand Button - All properties are expandable */}
        {isExpandable && (
          <button
            className="toggle-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? "›" : "∨"}
          </button>
        )}

        {/* Tag Name */}
        {isEditingName ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              ref={nameInputRef}
              type="text"
              className={`tag-name-input ${keyError ? 'tag-name-input--error' : ''}`}
              value={editedName}
              onChange={handleNameChange}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              autoFocus={isNewProperty}
              placeholder="Enter key name"
            />
            {keyError && (
              <span className="tag-error-message">{keyError}</span>
            )}
          </div>
        ) : (
          <div className={`tag-name ${keyError ? 'tag-name--error' : ''}`} onClick={handleNameClick}>
            {property.key || "(unnamed)"}
          </div>
        )}

        {/* Type Selector - Always editable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <select
            className={`type-select ${typeError ? 'type-select--error' : ''}`}
            value={localType}
            onChange={handleTypeChange}
            onFocus={() => setIsSelectOpen(true)}
            onBlur={() => setIsSelectOpen(false)}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {typeError && (
            <span className="tag-error-message" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
              {typeError}
            </span>
          )}
        </div>

        {/* Required Badge - Show if required */}
        {property.required && <span className="required-badge">required</span>}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          {!isNewProperty && property.type === 'object' && (
            <button className="add-child-btn" onClick={handleAddChild}>
              Add Child
            </button>
          )}
          <button className="delete-btn" onClick={handleDelete} title="Delete">
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

      {/* Tag Content - Animated collapse/expand */}
      <div className={`tag-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="tag-content-inner">
          {/* Show inline inputs for new properties */}
          {isNewProperty && (
            <>
              {/* Description Input */}
              <div
                className="tag-data"
                style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}
              >
                <label className="data-label">Description</label>
                <input
                  type="text"
                  className="data-input"
                  value={localDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Optional description"
                />
              </div>

              {/* Default Value Input - Show for all property types */}
              <div
                className="tag-data"
                style={{ paddingLeft: `${16 + (level + 1) * 20}px`, flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
              >
                <label className="data-label">Default Value</label>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {renderValueInput()}
                </div>
              </div>

              {/* Required Checkbox - Show for all property types */}
              <div
                className="tag-data"
                style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}
              >
                <label className="checkbox-label-inline">
                  <input
                    type="checkbox"
                    checked={localRequired}
                    onChange={handleRequiredChange}
                  />
                  <span>Required</span>
                </label>
              </div>

              {/* For object type, show info message about nested properties */}
              {localType === 'object' && (
                <div
                  className="tag-data"
                  style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}
                >
                  <label className="data-label">Info</label>
                  <div className="data-description" style={{ fontStyle: 'normal', color: '#6c757d' }}>
                    After saving, use "Add Child" to add nested properties
                  </div>
                </div>
              )}
            </>
          )}

          {/* Render inputs for existing properties - Show for all property types when expanded */}
          {!isNewProperty && (
            <>
              {/* Description Input - Always editable */}
              <div
                className="tag-data"
                style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}
              >
                <label className="data-label">Description</label>
                <input
                  type="text"
                  className="data-input"
                  value={localDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Optional description"
                />
              </div>

              {/* Default Value Input - Always editable for all property types */}
              <div
                className="tag-data"
                style={{ paddingLeft: `${16 + (level + 1) * 20}px`, flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
              >
                <label className="data-label">Default Value</label>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {renderValueInput()}
                </div>
              </div>

              {/* Required Checkbox - Always editable for all property types */}
              <div
                className="tag-data"
                style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}
              >
                <label className="checkbox-label-inline">
                  <input
                    type="checkbox"
                    checked={localRequired}
                    onChange={handleRequiredChange}
                  />
                  <span>Required</span>
                </label>
              </div>

              {/* For object properties, show info message about nested properties */}
              {property.type === 'object' && (
                <div
                  className="tag-data"
                  style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}
                >
                  <label className="data-label">Info</label>
                  <div className="data-description" style={{ fontStyle: 'normal', color: '#6c757d' }}>
                    Use "Add Child" button to add nested properties
                  </div>
                </div>
              )}
            </>
          )}

          {/* Render Children Recursively */}
          {hasNested && (
            <div className="tag-children">
              {actualChildren.map((child) => {
                const childIsExpanded = expandedProperties ? expandedProperties.has(child.id) : false;
                // All properties are expandable
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
