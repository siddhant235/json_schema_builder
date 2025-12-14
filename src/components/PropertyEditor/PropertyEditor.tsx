import { useState, useEffect } from 'react';
import PropertyList from './PropertyList/PropertyList';
import SchemaPreview from '../SchemaPreview/SchemaPreview';
import ConfirmDialog from '../common/ConfirmDialog/ConfirmDialog';
import useSchemaStore from '../../store/useSchemaStore';
import useValidationStore from '../../store/useValidationStore';
import usePersistenceStore from '../../store/usePersistenceStore';
import './PropertyEditor.css';

const PropertyEditor = () => {
  const properties = useSchemaStore((state) => state.properties);
  const schema = useSchemaStore((state) => state.schema);
  const clearSchema = useSchemaStore((state) => state.clearSchema);
  const restoreProperties = useSchemaStore((state) => state.restoreProperties);

  const autoValidate = useValidationStore((state) => state.autoValidate);
  const clearErrors = useValidationStore((state) => state.clearErrors);

  const loadSchema = usePersistenceStore((state) => state.loadSchema);
  const clearSavedSchema = usePersistenceStore((state) => state.clearSavedSchema);
  const autoSave = usePersistenceStore((state) => state.autoSave);
  const isLoading = usePersistenceStore((state) => state.isLoading);
  const isInitialLoad = usePersistenceStore((state) => state.isInitialLoad);
  const setLoading = usePersistenceStore((state) => state.setLoading);
  const setInitialLoad = usePersistenceStore((state) => state.setInitialLoad);

  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load saved schema on mount
  useEffect(() => {
    setLoading(true);
    const saved = loadSchema();
    console.log('Loading saved data:', saved);

    // Simulate a small delay to show loader (better UX)
    const loadTimer = setTimeout(() => {
      if (saved && saved.properties && Array.isArray(saved.properties)) {
        if (saved.properties.length > 0) {
          console.log('Restoring properties:', saved.properties);
          console.log('Properties count to restore:', saved.properties.length);
          // Restore properties - this will also generate the schema automatically
          restoreProperties(saved.properties);
        } else {
          // Empty properties array - clear the schema to ensure clean state
          console.log('Empty properties array found, clearing schema');
          clearSchema();
          clearErrors();
        }
      } else if (saved && saved.schema) {
        // Fallback: if we have schema but no properties, try to convert schema to properties
        console.log(
          'No properties found, but schema exists. Schema:',
          saved.schema
        );
      }
      setLoading(false);
      // Mark initial load as complete after a short delay to allow restore to finish
      setTimeout(() => {
        setInitialLoad(false);
      }, 100);
    }, 300); // Small delay to show loader

    return () => clearTimeout(loadTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-save schema (debounced) - handled by store
  useEffect(() => {
    autoSave(schema, properties);
  }, [schema, properties, autoSave]);

  // Auto-validate properties (debounced) - handled by store
  useEffect(() => {
    autoValidate(properties);
  }, [properties, autoValidate]);

  const handleClearAll = () => {
    setShowClearDialog(true);
  };

  const handleConfirmClear = () => {
    clearSchema();
    clearErrors();
    clearSavedSchema();
    setShowClearDialog(false);
    setInitialLoad(false);
  };

  const handleCancelClear = () => {
    setShowClearDialog(false);
  };

  return (
    <div className="property-editor">
      <div className="property-editor__panel">
        <div className="property-editor__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 className="property-editor__title">JSON Schema Builder</h1>
            <button
              className="clear-all-btn"
              onClick={handleClearAll}
              title="Clear all properties and reset"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9 15C5.685 15 3 12.315 3 9C3 5.685 5.685 3 9 3C12.315 3 15 5.685 15 9C15 12.315 12.315 15 9 15Z"
                  fill="#dc3545"
                />
                <path
                  d="M11.25 6.75L6.75 11.25M6.75 6.75L11.25 11.25"
                  stroke="#dc3545"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <div className="property-editor__list-container">
          <PropertyList isLoading={isLoading} />
        </div>
      </div>

      <div className="property-editor__preview">
        <SchemaPreview />
      </div>

      <ConfirmDialog
        isOpen={showClearDialog}
        title="Clear All Properties"
        message="Are you sure you want to clear all properties and reset the schema? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        variant="danger"
      />
    </div>
  );
};

export default PropertyEditor;
