# JSON Schema Builder

A visual, interactive tool for building JSON Schema definitions with a modern React interface. Create, edit, and manage complex schemas with nested objects, arrays, and validation rules.

## 🚀 Setup & Run

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## 📦 Deployment to GitHub Pages

### Prerequisites

- GitHub repository set up
- GitHub Pages enabled in repository settings

### Option 1: Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically deploys on every push to `main` or `master` branch.

1. **Enable GitHub Pages**:

   - Go to repository Settings → Pages
   - Source: Select "GitHub Actions"

2. **Push to main branch**:

   ```bash
   git push origin main
   ```

   The workflow will automatically build and deploy your site.

3. **Access your site**:
   - URL: `https://<username>.github.io/json_schema_builder/`

### Option 2: Manual Deployment

1. **Install gh-pages** (if not already installed):

   ```bash
   npm install --save-dev gh-pages
   ```

2. **Deploy**:

   ```bash
   npm run deploy
   ```

3. **Configure GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Select "gh-pages" branch
   - Save

### Configuration

**Base Path**: The app is configured for repository name `json_schema_builder`.

If your repository has a different name:

1. Update `base` in `vite.config.ts` to match your repo name:
   ```typescript
   base: "/your-repo-name/";
   ```
2. Or set environment variable `VITE_BASE_PATH` in your build process

**For root domain** (username.github.io):

- Set `base: '/'` in `vite.config.ts`

### Important Notes

- The workflow automatically builds and deploys on push to main/master
- First deployment: Enable GitHub Pages in repository settings (Settings → Pages → Source: GitHub Actions)
- Deployment URL: `https://<username>.github.io/json_schema_builder/`

## 🏗️ Design Choices

### 1. **State Management: Zustand**

- **Why**: Lightweight, no boilerplate, perfect for this use case
- **Stores**:
  - `useSchemaStore`: Property management and schema generation
  - `useValidationStore`: Validation logic and error handling
  - `usePersistenceStore`: Auto-save to localStorage

### 2. **Separation of Concerns**

- **Components**: Pure presentational (dumb components)
- **Stores**: All business logic (auto-save, validation, schema generation)
- **Utils**: Reusable functions (validation, schema transformation)

### 3. **Property Model vs Schema Format**

- **Property Model**: Uses `required: boolean` per property (simple for UI)
- **Schema Format**: Uses `required: string[]` array (JSON Schema standard)
- **Why**: Maintains JSON Schema compliance while keeping UI simple. Conversion handled automatically in transform layer.

### 4. **Key Storage in Schema**

- Each property in schema includes `key` field explicitly
- **Why**: Makes schema self-documenting for schema builders, while maintaining JSON Schema compatibility

### 5. **CSS Variables**

- All colors, spacing, typography use CSS variables
- **Why**: Easy theming, consistent design system, maintainable styles

### 6. **Auto-save with Debouncing**

- Debounced auto-save (500ms) to localStorage
- **Why**: Prevents excessive writes, smooth UX, data persistence

## 📊 How It Works

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                          │
│  (Add/Edit/Delete Property, Toggle Required, etc.)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              useSchemaStore (Zustand)                        │
│  • Updates properties array                                  │
│  • Triggers generateSchema()                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         schemaTransform.ts (Utils)                           │
│  • propertiesToSchema(): Converts Property[] → JSONSchema    │
│  • Builds required arrays from boolean flags                │
│  • Handles nested objects recursively                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              useSchemaStore (Updated)                        │
│  • schema: JSONSchema object                                 │
│  • schemaString: Formatted JSON string                       │
│  • schemaData: Parsed object for preview                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  SchemaPreview   │        │ usePersistenceStore│
│  (Display JSON)  │        │  (Auto-save)      │
└──────────────────┘        └──────────────────┘
```

### Property Lifecycle

```
1. ADD PROPERTY
   User clicks "Add Property"
   → useSchemaStore.addProperty()
   → New Property with empty key added
   → Form opens for editing

2. EDIT PROPERTY
   User fills form (key, type, description, value, required)
   → useSchemaStore.updateProperty()
   → Property updated in array
   → generateSchema() triggered
   → Schema regenerated
   → Auto-save triggered (debounced)

3. DELETE PROPERTY
   User clicks delete
   → Confirmation dialog
   → useSchemaStore.removeProperty()
   → Property + nested children removed
   → generateSchema() triggered
   → Auto-save triggered

4. VALIDATION
   Property changes
   → useValidationStore.autoValidate() (debounced)
   → Validates key uniqueness, type, nesting depth
   → Errors stored in validation store
   → UI displays errors inline
```

### Schema Generation Process

```
Properties Array (Property[])
    │
    ├─ Filter root properties (no parentId)
    ├─ Filter properties with valid keys
    │
    ├─ For each property:
    │   ├─ Create JSONSchemaProperty
    │   ├─ If required: Add to required array
    │   ├─ If type === 'object':
    │   │   ├─ Find nested properties (by parentId)
    │   │   ├─ Recursively build nested schema
    │   │   └─ Build nested required array
    │   └─ If type === 'array':
    │       └─ Process items schema
    │
    └─ Return JSONSchema {
        type: 'object',
        properties: { ... },
        required: [ ... ]
      }
```

### Auto-save Flow

```
Property/Schema Change
    │
    ├─ usePersistenceStore.autoSave() called
    ├─ Check: isInitialLoad? → Skip if true
    ├─ Debounce timer (500ms)
    │
    └─ After debounce:
        ├─ Filter valid properties (non-empty keys)
        ├─ Save to localStorage:
        │   {
        │     schema: JSONSchema,
        │     properties: Property[],
        │     timestamp: number
        │   }
        └─ Done
```

### Load on Mount

```
App Mounts
    │
    ├─ usePersistenceStore.loadSchema()
    ├─ Read from localStorage
    │
    ├─ If data exists:
    │   ├─ If properties.length > 0:
    │   │   └─ restoreProperties() → Generate schema
    │   └─ If properties.length === 0:
    │       └─ clearSchema() → Clean state
    │
    └─ Set isInitialLoad = false
```

## 🎯 Key Features

- ✅ Visual property editor with inline editing
- ✅ Nested object support (recursive)
- ✅ Array type with item schemas
- ✅ Real-time validation with error display
- ✅ Auto-save to localStorage
- ✅ JSON Schema standard compliance
- ✅ Copy schema to clipboard
- ✅ Formatted and raw JSON preview

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── PropertyEditor/ # Main editor components
│   └── SchemaPreview/  # Schema display
├── store/              # Zustand stores (state management)
├── utils/              # Business logic utilities
├── types/              # TypeScript type definitions
└── styles/             # CSS variables and global styles
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **React Syntax Highlighter** - JSON preview

## 📝 Notes

- All schemas follow JSON Schema Draft 7 specification
- Properties are stored with explicit `key` field for schema builder format
- Validation is debounced (500ms) for performance
- Auto-save is debounced (500ms) to prevent excessive localStorage writes
