import { useMemo } from 'react';
import IconButton from '../../../common/IconButton/IconButton';
import useValidationStore from '../../../../store/useValidationStore';
import type { Property } from '../../../../types';
import './PropertyCard.css';

// Stable empty object reference
const EMPTY_OBJECT: Record<string, string> = {};

interface PropertyCardProps {
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
  onToggleExpand?: () => void;
  isExpanded: boolean;
  onAddNested?: () => void;
  level?: number;
}

const PropertyCard = ({
  property,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded,
  onAddNested,
  level = 0,
}: PropertyCardProps) => {
  // Get the entire errors object once - Zustand will only re-render if this reference changes
  const allErrors = useValidationStore((state) => state.errors);

  // Memoize the property-specific errors to avoid creating new objects
  const errors = useMemo(() => {
    return allErrors[property.id] || EMPTY_OBJECT;
  }, [allErrors, property.id]);

  const hasErrors = useMemo(() => {
    return errors !== EMPTY_OBJECT && Object.keys(errors).length > 0;
  }, [errors]);

  const errorEntries = useMemo(() => Object.entries(errors), [errors]);

  // Check if property has nested children (for accordion display)
  // This will be determined by the parent component based on actual child properties in store
  const hasNested = onToggleExpand !== undefined;

  const marginLeft = `calc(${level} * var(--spacing-xl))`;

  return (
    <div
      className={`property-card ${hasErrors ? 'property-card--error' : ''}`}
      style={{ marginLeft }}
    >
      <div className="property-card__header">
        <div className="property-card__info">
          {hasNested && (
            <button
              type="button"
              className="property-card__expand"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={isExpanded ? 'expanded' : ''}
              >
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <div className="property-card__key-type">
            <span className="property-card__key">
              {property.key || '(unnamed)'}
            </span>
            <span className="property-card__type">{property.type}</span>
            {property.required && (
              <span className="property-card__required">required</span>
            )}
          </div>
        </div>
        <div className="property-card__actions">
          {property.type === 'object' && (
            <IconButton
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>
              }
              onClick={onAddNested}
              ariaLabel="Add nested property"
              variant="primary"
              size="sm"
            />
          )}
          <IconButton
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-9.5 7.5V11h.5a.5.5 0 0 1 .5-.5V10h-.5a.5 0 0 1-.5-.5V9h-.5v.5a.5.5 0 0 1-.5.5H4v.5a.5.5 0 0 1 .5.5H5v.5a.5.5 0 0 1 .293.207z" />
              </svg>
            }
            onClick={onEdit}
            ariaLabel="Edit property"
            variant="ghost"
            size="sm"
          />
          <IconButton
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                <path
                  fillRule="evenodd"
                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                />
              </svg>
            }
            onClick={onDelete}
            ariaLabel="Delete property"
            variant="danger"
            size="sm"
          />
        </div>
      </div>

      {(property.description || property.value !== null) && (
        <div className="property-card__details">
          {property.description && (
            <div className="property-card__description">
              {property.description}
            </div>
          )}
          {property.value !== null && property.value !== undefined && (
            <div className="property-card__value">
              <span className="property-card__value-label">Default:</span>
              <code>{JSON.stringify(property.value)}</code>
            </div>
          )}
        </div>
      )}

      {hasErrors && (
        <div className="property-card__errors">
          {errorEntries.map(([field, error]) => (
            <div key={field} className="property-card__error">
              <strong>{field}:</strong> {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
