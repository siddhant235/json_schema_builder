import { useState } from 'react';
import './JsonViewer.css';

interface JsonViewerProps {
  data: any;
  level?: number;
  collapsed?: boolean;
}

interface JsonValueProps {
  value: any;
  level?: number;
}

interface JsonEntryProps {
  entryKey: string;
  value: any;
  level: number;
  isLast: boolean;
}

const JsonEntry = ({ entryKey: k, value, level, isLast }: JsonEntryProps) => {
  const isNestedObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isNestedArray = Array.isArray(value);
  const hasNestedStructure = isNestedObject || isNestedArray;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get count for collapsed placeholder
  const getCollapsedPlaceholder = () => {
    if (isNestedObject) {
      const count = Object.keys(value).length;
      return `{${count} ${count === 1 ? 'key' : 'keys'}}`;
    } else if (isNestedArray) {
      return `[${value.length} ${value.length === 1 ? 'item' : 'items'}]`;
    }
    return '';
  };

  return (
    <div className="json-viewer__entry">
      {hasNestedStructure ? (
        <>
          <button
            className="json-viewer__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <span className={`json-viewer__toggle-icon ${isCollapsed ? 'json-viewer__toggle-icon--collapsed' : ''}`}>
              ▼
            </span>
          </button>
          <span className="json-viewer__key">"{k}"</span>
          <span className="json-viewer__colon">:</span>
          {isCollapsed ? (
            <span className="json-viewer__collapsed-placeholder">
              {getCollapsedPlaceholder()}
            </span>
          ) : (
            <div className="json-viewer__nested-value">
              <JsonValue value={value} level={level + 1} />
            </div>
          )}
        </>
      ) : (
        <>
          <span className="json-viewer__key">"{k}"</span>
          <span className="json-viewer__colon">:</span>
          <span className="json-viewer__value">
            <JsonValue value={value} level={level + 1} />
          </span>
        </>
      )}
      {!isLast && <span className="json-viewer__comma">,</span>}
    </div>
  );
};

interface JsonArrayItemProps {
  value: any;
  level: number;
  isLast: boolean;
}

const JsonArrayItem = ({ value, level, isLast }: JsonArrayItemProps) => {
  const isNestedObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isNestedArray = Array.isArray(value);
  const hasNestedStructure = isNestedObject || isNestedArray;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get count for collapsed placeholder
  const getCollapsedPlaceholder = () => {
    if (isNestedObject) {
      const count = Object.keys(value).length;
      return `{${count} ${count === 1 ? 'key' : 'keys'}}`;
    } else if (isNestedArray) {
      return `[${value.length} ${value.length === 1 ? 'item' : 'items'}]`;
    }
    return '';
  };

  return (
    <div className="json-viewer__entry">
      {hasNestedStructure ? (
        <>
          <button
            className="json-viewer__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <span className={`json-viewer__toggle-icon ${isCollapsed ? 'json-viewer__toggle-icon--collapsed' : ''}`}>
              ▼
            </span>
          </button>
          {isCollapsed ? (
            <span className="json-viewer__collapsed-placeholder">
              {getCollapsedPlaceholder()}
            </span>
          ) : (
            <div className="json-viewer__nested-value">
              <JsonValue value={value} level={level + 1} />
            </div>
          )}
        </>
      ) : (
        <span className="json-viewer__value">
          <JsonValue value={value} level={level + 1} />
        </span>
      )}
      {!isLast && <span className="json-viewer__comma">,</span>}
    </div>
  );
};

const JsonObject = ({ value, level = 0 }: { value: Record<string, any>; level: number }) => {
  const entries = Object.entries(value);
  const isEmpty = entries.length === 0;

  return (
    <div className="json-viewer__object">
      <span className="json-viewer__brace">{'{'}</span>
      {isEmpty ? (
        <span className="json-viewer__empty">{'}'}</span>
      ) : (
        <>
          <div className="json-viewer__content">
            {entries.map(([k, v], index) => (
              <JsonEntry
                key={k}
                entryKey={k}
                value={v}
                level={level}
                isLast={index === entries.length - 1}
              />
            ))}
          </div>
          <span className="json-viewer__brace">{'}'}</span>
        </>
      )}
    </div>
  );
};

const JsonArray = ({ value, level = 0 }: { value: any[]; level: number }) => {
  const isEmpty = value.length === 0;

  return (
    <div className="json-viewer__array">
      <span className="json-viewer__bracket">[</span>
      {isEmpty ? (
        <span className="json-viewer__empty">]</span>
      ) : (
        <>
          <div className="json-viewer__content">
            {value.map((item, index) => (
              <JsonArrayItem
                key={index}
                value={item}
                level={level}
                isLast={index === value.length - 1}
              />
            ))}
          </div>
          <span className="json-viewer__bracket">]</span>
        </>
      )}
    </div>
  );
};

const JsonValue = ({ value, level = 0 }: JsonValueProps) => {
  if (value === null) {
    return <span className="json-viewer__null">null</span>;
  }

  if (value === undefined) {
    return <span className="json-viewer__undefined">undefined</span>;
  }

  const valueType = Array.isArray(value) ? 'array' : typeof value;

  switch (valueType) {
    case 'object':
      return <JsonObject value={value as Record<string, any>} level={level} />;

    case 'array':
      return <JsonArray value={value as any[]} level={level} />;

    case 'string':
      return <span className="json-viewer__string">"{String(value)}"</span>;

    case 'number':
      return <span className="json-viewer__number">{String(value)}</span>;

    case 'boolean':
      return <span className="json-viewer__boolean">{String(value)}</span>;

    default:
      return <span className="json-viewer__string">"{String(value)}"</span>;
  }
};

const JsonViewer = ({ data, level = 0, collapsed = false }: JsonViewerProps) => {
  return (
    <div className="json-viewer">
      <JsonValue value={data} level={level} />
    </div>
  );
};

export default JsonViewer;
