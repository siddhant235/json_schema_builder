import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useSchemaStore from '../../store/useSchemaStore';
import JsonViewer from './JsonViewer/JsonViewer';
import './SchemaPreview.css';

const SchemaPreview = () => {
  const schemaString = useSchemaStore((state) => state.schemaString);
  const isValid = useSchemaStore((state) => state.isValid);
  const schemaData = useSchemaStore((state) => state.schemaData);
  const copySchemaToClipboard = useSchemaStore((state) => state.copySchemaToClipboard);
  const validateSchema = useSchemaStore((state) => state.validateSchema);

  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('raw');

  // Validate schema when it changes
  useEffect(() => {
    validateSchema();
  }, [schemaString, validateSchema]);

  const handleCopy = async () => {
    const success = await copySchemaToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="schema-preview">
      <div className="schema-preview__header">
        <h2 className="schema-preview__title">Schema Preview</h2>
        <div className="schema-preview__actions">
          {schemaData && (
            <div className="schema-preview__view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'formatted' ? 'active' : ''}`}
                onClick={() => setViewMode('formatted')}
                title="Formatted view"
              >
                Formatted
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
                title="Raw JSON view"
              >
                Raw
              </button>
            </div>
          )}
          <button
            className="export-btn"
            onClick={handleCopy}
            disabled={!isValid || !schemaString || schemaString === '{}'}
          >
            {copied ? '✓ Copied!' : '📋 Copy JSON'}
          </button>
        </div>
      </div>

      <div className="schema-preview__content">
        {!isValid && schemaString && schemaString !== '{}' && (
          <div className="schema-preview__error">
            Invalid JSON schema. Please check for errors.
          </div>
        )}

        {schemaString && schemaString !== '{}' ? (
          <div className="schema-preview__code">
            {viewMode === 'formatted' && schemaData ? (
              <div className="schema-preview__json-viewer">
                <JsonViewer data={schemaData} />
              </div>
            ) : (
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: 'var(--spacing-lg)',
                  borderRadius: 'var(--border-radius-md)',
                  fontSize: 'var(--font-size-lg)',
                  lineHeight: '1.6',
                  background: 'var(--color-bg-tertiary)',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: 'var(--font-size-lg)',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                  },
                }}
              >
                {schemaString}
              </SyntaxHighlighter>
            )}
          </div>
        ) : (
          <div className="schema-preview__empty">
            <p>No schema generated yet. Add properties to see the schema preview.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaPreview;
