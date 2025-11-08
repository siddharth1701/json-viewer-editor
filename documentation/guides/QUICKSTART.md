# Quick Start Guide

## Getting Started in 60 Seconds

### 1. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at: **http://localhost:3000**

### 2. Try It Out

#### Option A: Paste JSON
1. The home screen shows a large textarea
2. Paste any JSON (try the example below)
3. Click "Parse JSON"
4. Your JSON appears in Tree View!

```json
{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "hobbies": ["reading", "coding", "hiking"],
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA"
  }
}
```

#### Option B: Load Sample Data
1. Look at the **left sidebar**
2. Under "Sample Data", click any sample
3. Instantly loads pre-configured JSON
4. Try "REST API Response" or "Large Dataset"

#### Option C: Upload a File
1. Drag & drop any `.json` file onto the upload area
2. Or click to browse and select a file
3. File loads instantly

### 3. Explore Features

#### View Modes (Top Tabs)
- **Tree**: Collapsible hierarchy with type badges
- **Code**: Full Monaco editor (like VS Code)
- **Raw**: Plain text view
- **Visualize**: Placeholder for future D3.js diagram

#### Left Sidebar
- **Statistics**: File size, key count, depth
- **Sample Data**: Quick load examples
- **Recent Files**: Your last 10 files
- **Bookmarks**: Save favorite paths

#### Right Sidebar
- **Comments**: Add notes to JSON paths
- **Snapshots**: Save versions with timestamps
- **Information**: Privacy and storage details

#### Top Navbar Actions
- **Undo/Redo**: Track all changes (Ctrl+Z / Ctrl+Y)
- **Compare**: Side-by-side JSON diff
- **Search**: Find in JSON (Ctrl+F)
- **Generate Code**: Export as TypeScript, Python, etc.
- **Upload/Download**: File operations
- **Copy**: Copy to clipboard
- **Help**: Keyboard shortcuts
- **Theme Toggle**: Light/dark mode

### 4. Common Tasks

#### Edit JSON
1. In Tree View: Click any value to edit inline
2. In Code View: Edit directly like any code editor
3. Changes auto-save to tab state
4. Use Undo/Redo as needed

#### Format/Minify
1. Load JSON in any view
2. Click "Format" to prettify
3. Click "Minify" to compress
4. Choose indentation (2 or 4 spaces)

#### Export to Other Formats
1. Load your JSON
2. Use format converters:
   - YAML: `jsonToYAML()`
   - XML: `jsonToXML()`
   - CSV: `jsonToCSV()` (arrays only)
   - TOML: `jsonToTOML()`
   - HTML: `jsonToHTML()`

#### Compare Two JSONs
1. Click "Compare" icon in navbar
2. Paste JSON A in left panel, click "Load"
3. Paste JSON B in right panel, click "Load"
4. View differences at the bottom
5. Green = added, Red = removed, Yellow = modified

#### Generate Code
1. Load JSON
2. Use code generator utilities:
   - TypeScript interfaces
   - JavaScript classes
   - Python dataclasses
   - Java/C#/Go structs

#### Work with Multiple Files
1. Click **+** to add a new tab
2. Each tab has independent JSON state
3. Close tabs with **X**
4. Switch between tabs by clicking

#### Save Snapshots
1. Load JSON
2. Right sidebar → "Save snapshot"
3. Add a label (optional)
4. Restore anytime with "Restore" button
5. Snapshots persist in localStorage

### 5. Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + F`: Search (in Code view)
- `Ctrl/Cmd + S`: Save/Download

### 6. Tips & Tricks

#### 🔍 Find Errors Quickly
- Validation errors show line and column numbers
- Click "Apply Fixes" for auto-repair suggestions
- JSONC (JSON with comments) is supported

#### 📊 Analyze JSON
- Left sidebar shows detailed statistics
- Find circular references automatically
- Detect empty/null values
- Find duplicate values
- Warning for deep nesting (>10 levels)

#### 🎨 Customize Appearance
- Toggle dark mode with sun/moon icon
- Monaco editor supports multiple themes
- Responsive design works on mobile

#### 💾 Data Persistence
- Recent files (last 10) saved in localStorage
- Bookmarks persist across sessions
- Snapshots stored locally
- Session restores on page reload

#### 🔒 Privacy First
- All processing happens in your browser
- No data sent to any server
- No tracking, no cookies
- "Client-side only" badge in footer
- Optional sensitive data masking

### 7. Troubleshooting

#### "Invalid JSON" Error
- Check for trailing commas
- Ensure keys are in double quotes
- Try "Apply Fixes" for auto-repair
- JSONC mode handles comments

#### Large Files Slow
- Tree view collapses large structures by default
- Use Code or Raw view for very large files
- Virtual scrolling coming in future update

#### Tab Not Responding
- Refresh the page (data in localStorage persists)
- Check browser console for errors
- Try clearing browser cache

### 8. What's Next?

Once comfortable with basics, explore:
- JSON comparison for diff analysis
- Code generation for your programming language
- Advanced analysis (duplicates, circular refs)
- Snapshot management for version control
- Export to various formats

## Need Help?

- Press `?` or Help icon for shortcuts
- Check [README.md](./README.md) for full documentation
- See [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md) for all features

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Built files will be in the `dist/` directory.

---

**Enjoy using the Ultimate JSON Viewer & Editor!** 🚀

For the best experience:
- Use Chrome, Edge, or Firefox (latest versions)
- Enable JavaScript (required)
- Allow localStorage for persistence
