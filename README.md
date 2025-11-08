# Ultimate JSON Viewer & Editor

A professional, feature-rich web application for viewing, editing, validating, and analyzing JSON data. Built with React, TypeScript, and modern web technologies.

![JSON Viewer & Editor](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core Features

#### 1. JSON Input & Validation ✅
- ✅ Multiple input methods: textarea, file upload, URL import, drag-and-drop
- ✅ Real-time syntax validation with error messages
- ✅ Line and column number error reporting
- ✅ Support for large JSON files (10MB+)
- ✅ JSONC format support (JSON with comments)
- ✅ Intelligent JSON repair suggestions
- ✅ Auto-fix malformed JSON
- ✅ Clear/reset functionality

#### 2. Multiple View Modes ✅
- ✅ **Tree View**: Interactive collapsible/expandable hierarchical display
  - Icons and badges for data types
  - Value preview for complex objects
  - Array length and object key count display
- ✅ **Code View**: Monaco Editor with syntax highlighting
  - Line numbers
  - Real-time editing
  - Auto-formatting
- ✅ **Raw View**: Plain text display
- ⏳ **Visualization View**: Tree diagram (placeholder ready for D3.js implementation)

#### 3. Themes & UI ✅
- ✅ Light and dark mode toggle
- ✅ Clean, modern UI with smooth animations
- ✅ Fully responsive layout (mobile and desktop)
- ✅ Syntax highlighting themes (GitHub, Monokai, Dracula)

#### 4. Editing Capabilities ✅
- ✅ Click any value to edit inline
- ✅ Type preservation (string, number, boolean, null)
- ✅ Context menu on nodes (Edit, Copy path)
- ⏳ Add/Delete operations (structure in place)
- ⏳ Drag-and-drop reordering (structure in place)
- ✅ Full undo/redo stack
- ✅ Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+F, Ctrl+S)

#### 5. Search & Filter ⏳
- ⏳ Search bar with highlighting
- ⏳ Filter by keys or values
- ⏳ Regular expression support
- ⏳ Find and Replace
- ⏳ JSONPath query support
- ⏳ JMESPath support

#### 6. Formatting & Transform Tools ✅
- ✅ Prettify/Format with customizable indentation
- ✅ Minify/Compact
- ✅ Sort keys alphabetically (with recursive option)
- ✅ Remove duplicate keys
- ✅ Escape/Unescape strings
- ✅ Export as YAML
- ✅ Export as XML
- ✅ Export as CSV
- ✅ Export as TOML
- ✅ Export as HTML documentation
- ✅ Flatten/Unflatten structure

#### 7. JSON Comparison Mode ✅
- ✅ Split-pane comparison view
- ✅ Load JSON A and B via multiple methods
- ✅ Diff visualization with jsondiffpatch
- ✅ Side-by-side comparison
- ⏳ Unified diff view (structure ready)
- ⏳ Ignore key order option
- ⏳ Export diff report

#### 8. Query & Transform Panel ⏳
- ⏳ JSONPath tester
- ✅ Path extractor (click to copy path)
- ⏳ Schema generator
- ⏳ Schema validator
- ⏳ Validation error display

#### 9. Code Generation Tools ✅
- ✅ TypeScript interface generation
- ✅ JavaScript class generation
- ✅ Python dataclass generation
- ✅ Java class generation
- ✅ C# class generation
- ✅ Go struct generation
- ⏳ Generate mock data
- ⏳ Copy with syntax highlighting

#### 10. JSON Analysis Panel ✅
- ✅ File statistics dashboard
  - Total size (bytes, KB, MB)
  - Number of keys and values
  - Max nesting depth
  - Data type distribution
- ✅ Circular reference detection
- ✅ Find empty values/null values
- ✅ Find duplicate values
- ✅ Deep nesting warnings

#### 11. Visual Representation ⏳
- ⏳ Interactive D3.js tree diagram
- ⏳ Zoom and pan controls
- ⏳ Export as PNG/SVG
- ⏳ Minimap for large structures

#### 12. Workspace Management ✅
- ✅ Multiple tabs support
- ✅ Add/close tab functionality
- ✅ Tab labels with filename or "Untitled"
- ✅ Independent JSON state per tab
- ✅ Recent files sidebar (stores last 10)
- ✅ localStorage persistence
- ✅ Session restore on page load
- ✅ Bookmarks feature

#### 13. Export & Share ✅
- ✅ Download as .json file
- ✅ Copy to clipboard
- ✅ Export as HTML documentation
- ⏳ Export as PDF report
- ⏳ Generate shareable link with URL encoding
- ⏳ QR code generation

#### 14. Large File Handling ⏳
- ⏳ Virtual scrolling for 1000+ nodes
- ✅ Lazy loading (collapse by default)
- ⏳ Performance monitor
- ⏳ Chunk mode for huge files
- ✅ Loading states

#### 15. Data Protection ✅
- ✅ "Client-side only" badge in footer
- ✅ Sensitive data masking toggle
- ✅ Auto-detect patterns (API keys, passwords, etc.)
- ⏳ Configurable regex patterns
- ✅ Clear all data functionality
- ✅ No server uploads, no tracking

#### 16. Annotations & Comments ✅
- ✅ Add comments to JSON paths
- ✅ Comment panel with all annotations
- ⏳ Export JSON with embedded comments
- ✅ Version snapshots
- ✅ Snapshot history with timestamps
- ✅ Restore previous snapshots

#### 17. Sample Library ✅
- ✅ Load sample dropdown
- ✅ REST API response sample
- ✅ Package.json config sample
- ✅ GeoJSON data sample
- ✅ Large dataset sample (50 items)
- ✅ Deeply nested object sample
- ✅ Array of objects sample
- ✅ Instant loading

#### 18. Help & Tutorial ✅
- ✅ Help button with shortcuts modal
- ✅ Keyboard shortcuts reference
- ✅ Privacy information tooltips
- ⏳ Guided tour
- ⏳ First-time user onboarding

#### 19. Accessibility ⏳
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators
- ⏳ Full keyboard navigation
- ⏳ Screen reader optimization
- ⏳ High contrast mode

#### 20. Progressive Web App ⏳
- ⏳ Installable as desktop/mobile app
- ⏳ Offline functionality
- ⏳ Service worker caching
- ⏳ App manifest with icons

## Technology Stack

- **Frontend Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.12
- **State Management**: Zustand 5.0.8
- **Styling**: Tailwind CSS 4.1.16
- **Code Editor**: Monaco Editor 4.7.0
- **JSON Processing**:
  - jsonpath-plus 10.3.0
  - jsondiffpatch 0.7.3
  - ajv 8.17.1 (JSON Schema validator)
- **Data Conversion**:
  - js-yaml 4.1.0
  - xml-js 1.6.11
  - papaparse 5.5.3
- **Visualization**: D3.js 7.9.0
- **UI Components**:
  - lucide-react 0.552.0 (icons)
  - @headlessui/react 2.2.9
- **Utilities**:
  - date-fns 4.1.0
  - html2canvas 1.4.1
  - jspdf 3.0.3
  - qrcode.react 4.2.0

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd json
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Loading JSON Data

1. **Paste JSON**: Directly paste JSON into the textarea on the home screen
2. **Upload File**: Click the upload area or drag & drop a `.json` file
3. **Load from URL**: Click "Load from URL" and enter a JSON endpoint
4. **Sample Data**: Use the left sidebar to load pre-configured sample data

### Viewing JSON

- Switch between **Tree**, **Code**, **Raw**, and **Visualization** views using the tabs
- Tree view allows collapsing/expanding nodes by clicking arrows
- Code view provides full Monaco editor capabilities
- Raw view shows minified JSON text

### Editing JSON

- In Tree view: Click any value to edit inline
- In Code view: Edit directly in the Monaco editor
- Use Undo (Ctrl+Z) and Redo (Ctrl+Y) to revert changes

### Comparing JSON

1. Click the Compare icon in the navbar
2. Paste or load JSON into both panels (A and B)
3. Click "Load" for each panel
4. View differences highlighted at the bottom

### Managing Tabs

- Click **+** to add a new tab
- Click **X** on a tab to close it
- Switch between tabs by clicking on them
- Each tab maintains independent JSON state

### Exporting Data

1. Click the **Export** button in the view tabs
2. Choose format: JSON, YAML, XML, CSV, TOML, or HTML
3. Download or copy to clipboard

### Using Snapshots

1. Load JSON data in any tab
2. In the right sidebar, add a snapshot with a label
3. Restore any previous snapshot by clicking "Restore"
4. Snapshots are persisted in localStorage

### Keyboard Shortcuts

- `Ctrl + Z` / `Cmd + Z`: Undo
- `Ctrl + Y` / `Cmd + Y`: Redo
- `Ctrl + F` / `Cmd + F`: Search (in Monaco editor)
- `Ctrl + S` / `Cmd + S`: Save (downloads JSON)

## Project Structure

```
json/
├── src/
│   ├── components/
│   │   ├── Layout/          # Layout components (Navbar, Sidebars, etc.)
│   │   ├── Views/           # View components (Tree, Code, Raw, etc.)
│   │   ├── Modals/          # Modal dialogs
│   │   └── UI/              # Reusable UI components
│   ├── stores/
│   │   └── useAppStore.ts   # Zustand global state
│   ├── utils/
│   │   ├── jsonUtils.ts     # JSON validation, parsing, utilities
│   │   ├── converters.ts    # Format conversion (YAML, XML, etc.)
│   │   ├── codeGenerator.ts # Code generation for multiple languages
│   │   └── samples.ts       # Sample JSON data library
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── styles/
│   │   └── index.css        # Global styles and Tailwind imports
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── FEATURES_CHECKLIST.md   # Detailed feature checklist (~250 items)
└── README.md               # This file
```

## Features Checklist

See [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md) for a detailed breakdown of all ~250 features with completion status.

## Privacy & Security

- **100% Client-Side**: All JSON processing happens in your browser
- **No Data Upload**: Your data never leaves your device
- **No Tracking**: No analytics, cookies, or third-party scripts
- **Local Storage**: Settings and recent files are stored locally in your browser
- **Data Masking**: Optional sensitive data detection and masking

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Deployment

See [documentation/guides/DEPLOYMENT.md](./documentation/guides/DEPLOYMENT.md) for comprehensive deployment guides.

**Quick Links:**
- [GitHub Pages Setup](./documentation/deployment/github/)
- [Shared Hosting Guide](./documentation/deployment/shared-hosting/)
- [VPS Deployment](./documentation/deployment/vps/)

### Quick Start

```bash
# Build for production
npm run build

# Deploy to GitHub Pages - just push
git push origin main

# Deploy to VPS
./documentation/scripts/deploy.sh

# Deploy to shared hosting - upload dist/ folder
```

## Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## Known Limitations

- D3.js visualization is a placeholder (structure in place, implementation pending)
- Some advanced features like full JSONPath queries are placeholders
- PWA features (service worker, manifest) are not yet implemented
- Search/filter functionality has UI placeholders but needs full implementation

## Performance

- Handles JSON files up to 10MB efficiently
- Tree view uses lazy loading for large nested structures
- Monaco editor provides virtual scrolling for large documents
- Undo/redo history limited to last 50 states to prevent memory issues

## Future Enhancements

1. Complete D3.js tree visualization with zoom/pan
2. Full JSONPath and JMESPath query implementation
3. Advanced search with regex and replace all
4. JSON Schema generation and validation UI
5. Complete PWA support with offline mode
6. Virtual scrolling for tree view with 10,000+ nodes
7. Export diffs as reports
8. Generate shareable links with URL compression
9. Enhanced accessibility with screen reader support
10. Guided tour for first-time users

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

Built with love using:
- React Team for React
- Microsoft for Monaco Editor
- Tailwind Labs for Tailwind CSS
- And all other amazing open-source libraries

---

**Version**: 1.0.0
**Last Updated**: November 2024
**Status**: Production Ready (Core Features)

For questions or issues, please check the GitHub repository.
