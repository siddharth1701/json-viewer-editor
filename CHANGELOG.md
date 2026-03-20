# Changelog

All notable changes to the JSON Viewer & Editor project are documented in this file.

## [1.0.0] - March 2026

### Added

#### New Features
- **Expand Level Control**: New dropdown menu in Tree view with options to collapse all, expand to specific levels (1-6), or expand all
- **Clear Button**: Added clear/reset button to toolbar to clear current tab's JSON data
- **Toast Notifications**: Replaced all blocking alert() dialogs with non-blocking toast notifications using react-hot-toast
- **Per-Tab History**: Implemented independent undo/redo stacks for each tab (50 items max per tab)
- **Smart Change Detection**: Only shows success toast when JSON actually changes (prevents false positives)
- **Tree Traversal Utility**: Created reusable utility module with 7 core functions (eliminates code duplication)
- **URL Loading Improvements**: Added 30-second timeout, MIME type validation, and CORS error detection

#### Performance Optimizations
- **Code Splitting**: Separated vendor dependencies, D3 visualization, and UI components into distinct chunks
- **Bundle Size Reduction**: Optimized chunks reduce main bundle from 1,135 kB to 1,036 kB (uncompressed)
- **Module-Level Constants**: Cached regex patterns outside React components to prevent recreation on renders
- **Memory Efficiency**: Total gzipped size: 409 kB (0.4 MB) - reasonable for full-featured JSON editor
- **Lazy Loading**: D3 visualization only loaded when needed

#### Type Safety
- **Eliminated `any` Types**: Replaced 67 remaining `any` types with proper TypeScript types
- **D3 Type Definitions**: Added proper types for ZoomBehavior, ZoomTransform
- **Interface Definitions**: Created interfaces for QueryResult, AnalysisResults, JsonSchema
- **Better Type Coverage**: Full TypeScript strict mode compatibility

#### Code Quality
- **Removed Code Generation**: Deleted CodeGenerationModal (feature not applicable for JSON viewer)
- **Cleaned Dependencies**: Removed unused packages:
  - ajv (JSON Schema validator - not used)
  - jmespath (advanced queries not fully implemented)
  - jsondiffpatch (custom diff implementation preferred)
  - qrcode.react (QR code generation removed)
- **Removed Orphaned Code**: Deleted unused types (Snapshot, Comment, Bookmark)
- **Removed Dead State**: Cleaned up unused store properties (syntaxTheme, comparisonMode, etc.)

#### Error Handling & Validation
- **File Size Validation**: Added 50MB upload limit with user-friendly error messages
- **JSON String Limits**: Enforced 5MB JSON string limit for safety
- **File Extension Validation**: Accepts only .json, .jsonc, and text/plain MIME types
- **CORS Error Detection**: Improved error messages for cross-origin requests
- **PDF Size Handling**: Automatic JSON truncation for documents over 100KB

### Fixed

#### Bug Fixes
- **Collapse All**: Fixed non-functional collapse all feature (was using null instead of expandLevel = 0)
- **Expand Level Updates**: Fixed tree not updating when expansion level changes
- **Ctrl+S Shortcut**: Fixed keyboard shortcut to actually download JSON file instead of just preventing default
- **clearAllData Scope**: Fixed function clearing entire localStorage instead of just app storage
- **SearchModal Feedback**: Improved line click handler to show toast instead of logging to console

#### UI/UX Improvements
- **Toast Styling**: Custom success/error colors with bottom-right positioning
- **Disabled States**: Proper disabled state styling for buttons when content is empty
- **Loading States**: Added loading toast with dismissal capability
- **Error Messages**: More specific error messages for CORS, file size, and validation failures

### Changed

- **Notification System**: Migrated from alert() dialogs to react-hot-toast for non-blocking feedback
- **History Management**: Changed from global history to per-tab history (prevents cross-tab contamination)
- **Vite Config**: Optimized with code splitting and manual chunk configuration
- **Dependencies**: Updated to latest compatible versions
- **Documentation**: Updated README with current feature status and latest changes

### Performance Metrics

- **Bundle Size**: 409 kB (gzipped) - down from larger unsplit bundle
- **Memory (Idle)**: 40-60 MB
- **Memory (Typical JSON)**: 80-120 MB
- **Memory (Max Safe)**: 300-400 MB
- **Build Time**: ~3.4 seconds
- **File Support**: Up to 50MB with validation

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Known Issues

- PWA features (service worker, offline) not yet implemented
- Virtual scrolling for 10,000+ nodes not implemented
- Some advanced CSS features may not work on older browsers

### Migration Guide

If upgrading from previous version:

1. **Per-Tab History**: Undo/redo now only affects current tab. This fixes issues where switching tabs would contaminate history. Existing history is cleared on upgrade.

2. **Code Generation Removed**: If you were using code generation feature, it has been removed as it's not applicable for a JSON viewer. Consider using dedicated tools like json-schema-codegen for this functionality.

3. **Toast Notifications**: All alert() dialogs replaced with non-blocking toasts. No action needed - same functionality with better UX.

4. **Expand Level UI**: New dropdown control replaces previous expansion behavior. Default is "Auto" (shows depth 0-2).

---

## Previous Versions

For information about previous versions, please check the git commit history.

---

**Last Updated**: March 2026
**Version**: 1.0.0
**Status**: Production Ready
