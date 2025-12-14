import { useState, useCallback } from 'react';
import TagView from './TagView/TagView';
import Loader from '../../common/Loader/Loader';
import useSchemaStore from '../../../store/useSchemaStore';
import type { Property } from '../../../types';
import './PropertyList.css';

interface PropertyListProps {
  isLoading?: boolean;
}

const PropertyList = ({ isLoading = false }: PropertyListProps) => {
  const properties = useSchemaStore((state) => state.properties);
  const setSelectedProperty = useSchemaStore(
    (state) => state.setSelectedProperty
  );
  const removeProperty = useSchemaStore((state) => state.removeProperty);
  const addProperty = useSchemaStore((state) => state.addProperty);
  const getChildProperties = useSchemaStore(
    (state) => state.getChildProperties
  );

  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  // All hooks must be called before any conditional returns
  const toggleExpand = useCallback((propertyId: string) => {
    setExpandedProperties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  }, []);

  const rootProperties = properties.filter((p) => !p.parentId);

  // Show loader while loading
  if (isLoading) {
    return (
      <div className="property-list property-list--loading">
        <Loader size="md" message="Loading properties..." />
      </div>
    );
  }

  const handleEdit = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const handleDelete = (propertyId: string) => {
    // Confirmation is handled in TagView component
    removeProperty(propertyId);
  };

  const handleAddNested = (parentId: string) => {
    addProperty(parentId);
  };

  const handleAddRootProperty = () => {
    addProperty(null);
  };

  const renderProperty = (property: Property, level: number = 0) => {
    const isExpanded = expandedProperties.has(property.id);
    const children = getChildProperties(property.id);
    const hasChildren = children.length > 0;

    // All properties are expandable to show default value and required flag
    const canExpand = true;

    return (
      <TagView
        key={property.id}
        property={property}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleExpand={canExpand ? toggleExpand : undefined}
        onAddNested={
          property.type === 'object'
            ? handleAddNested
            : undefined
        }
        isExpanded={isExpanded}
        level={level}
        children={[]}
        getChildProperties={getChildProperties}
        expandedProperties={expandedProperties}
      />
    );
  };

  return (
    <div className="property-list">
      {rootProperties.length === 0 && (
        <div className="property-list__empty">
          <p className="property-list__empty-message">
            No properties yet. Click "Add Property" to get started.
          </p>
        </div>
      )}
      {rootProperties.map((property) => renderProperty(property))}
      <div className="property-list__add-root">
        <button className="add-root-btn" onClick={handleAddRootProperty}>
          + Add Property
        </button>
      </div>
    </div>
  );
};

export default PropertyList;
