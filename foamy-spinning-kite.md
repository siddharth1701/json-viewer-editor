# JSON Viewer & Editor — Project Assessment & Improvement Plan

## Context

This is a personal/side project that is feature-rich but has accumulated several broken integrations, orphaned code, and missing professional-grade infrastructure. The goal is to bring the project to genuine professional quality — fixing broken features, adding tests, improving UX, and closing the gap between what the README promises and what the app actually delivers.

---

## Audit Findings

### 🔴 Critical Issues (Broken Features)

| # | Issue | Location |
|---|---|---|
| 1 | **Format & Minify are identical** — both call `JSON.parse(JSON.stringify(...))` | `useJsonActions.ts:16-40` |
| 2 | **Code Generation is completely disconnected** — buttons exist, `codeGenerator.ts` is fully written, but nothing calls it | `Navbar.tsx:177`, `RightSidebar.tsx:41-53` |
| 3 | **PDF Export silently falls to JSON export** — no `case 'pdf'` in switch | `useJsonActions.ts`, `types/index.ts` |
| 4 | **Sensitive Data Masking does nothing** — store toggle exists, guided tour advertises it, but no view applies it | `useAppStore.ts:63-65` |
| 5 | **Unified Diff Mode checkbox** — wired to state, state never read in render | `ComparisonView.tsx:656` |
| 6 | **Search "Line X" click** — only does `console.log` | `SearchModal.tsx:192` |
| 7 | **Ctrl+S shortcut** — `preventDefault` but no action | `App.tsx:62-65` |
| 8 | **MIME type check on file drop** — silently rejects `.json` files with `text/plain` MIME | `JSONInput.tsx:96` |

### 🟠 UX/Code Quality Issues

| # | Issue | Location |
|---|---|---|
| 9 | **40+ `alert()` calls** for all feedback — no toast system | Widespread |
| 10 | **Undo/Redo is global** — switching tabs shares history | `useAppStore.ts:39-45` |
| 11 | **Line-by-line diff algorithm** — any insertion marks all subsequent lines as modified | `ComparisonView.tsx:176-253` |
| 12 | **TreeNode subscribes to store individually** — hundreds of subscriptions on large JSON | `TreeView.tsx:18-21` |
| 13 | **`clearAllData` calls `localStorage.clear()`** — clears ALL localStorage, not just app keys | `useAppStore.ts:259-262` |
| 14 | **File upload logic duplicated 3x** | `Navbar.tsx`, `JSONInput.tsx`, `ComparisonView.tsx` |
| 15 | **`ComparisonView.tsx` is 888 lines** — needs splitting | `ComparisonView.tsx` |

### 🟡 Orphaned / Dead Code

| # | Issue | Notes |
|---|---|---|
| 16 | `syntaxTheme` state never read by any view | `useAppStore.ts` |
| 17 | `comparisonJsonB`, `comparisonMode`, `setComparisonMode` in store, no UI uses them | `useAppStore.ts` |
| 18 | `Snapshot`, `Comment`, `Bookmark` types defined, never built | `types/index.ts` |
| 19 | `detectCircularReferences`, `findEmptyValues`, `findDuplicateValues` in `jsonUtils.ts`, LeftSidebar has inline duplicates | `jsonUtils.ts` |
| 20 | `react-error-boundary` package installed, not used | `package.json` |
| 21 | `jmespath`, `qrcode.react`, `ajv` packages installed but not imported anywhere in `/src` | `package.json` |

### 🔵 Missing Professional Infrastructure

| # | Issue | Notes |
|---|---|---|
| 22 | **Zero tests** — no Vitest/Jest setup, CI silently skips tests | Entire project |
| 23 | **`react-window` installed but unused** — no virtual scrolling | `TreeView.tsx` |
| 24 | **TypeScript strict mode disabled** | `tsconfig.json` |
| 25 | **No ESLint configuration** — CI skips linting silently | `package.json` |
| 26 | **No PWA** — no manifest, no service worker, no icons in `/public` | Public folder |
| 27 | **No per-view Error Boundaries** — one crash in D3 view takes down entire app | `main.tsx` |
| 28 | **README is outdated** — VisualizationView, GuidedTour, PerformanceMonitor, IgnoreKeyOrder all done but marked ⏳ | `README.md` |

---

## Recommended Implementation Plan

### Phase 1 — Fix Broken Core Features (Highest Priority)

**1.1 Fix Format vs Minify**
- `useJsonActions.ts`: Replace both functions to call the correct utilities:
  - `formatJson()` → serialize with `JSON.stringify(content, null, indentation)`
  - `minify()` → serialize with `JSON.stringify(content)`
- Both should also update the `rawText` in the store

**1.2 Wire Code Generation to UI**
- Add a `CodeGenerationModal` (new component) with language picker + output display
- `Navbar.tsx`: Add `onClick` to the Code2 button → open modal
- `RightSidebar.tsx`: Replace `exportAs(language as any)` with `generateCode(language)`
- Add `generateCode(language)` action to `useJsonActions.ts` that calls `codeGenerator.ts`

**1.3 Fix PDF Export**
- `useJsonActions.ts`: Add `case 'pdf'` using `jspdf` + `html2canvas` (both already installed)
- Generate a well-formatted HTML → canvas → PDF

**1.4 Implement Sensitive Data Masking**
- Add masking logic to `TreeView.tsx` — detect patterns (email, API key, password) and show `***` when `maskSensitiveData` is true
- Add a toggle button in Navbar or Settings panel

**1.5 Fix Unified Diff Mode**
- `ComparisonView.tsx`: Add a branch in render logic — if `unifiedDiffMode`, render a combined sequential list with `+`/`-` prefixes instead of side-by-side

**1.6 Fix Drop MIME Type Check**
- `JSONInput.tsx`: Change `file.type === 'application/json'` to also accept `text/plain` and `''` (empty MIME), check file extension instead

---

### Phase 2 — Add Toast Notification System

Replace all 40+ `alert()` calls with a lightweight in-app toast:
- Add `useToastStore` (Zustand slice or context) with queue of `{id, message, type, duration}`
- Add `ToastContainer` component in `App.tsx` layout
- Create helper `showToast(message, type)` utility
- Replace every `alert(...)` call site with `showToast(...)`

**Files affected**: `useJsonActions.ts`, `TreeView.tsx`, `ComparisonView.tsx`, `LeftSidebar.tsx`, `SearchModal.tsx`, `ViewTabs.tsx`, `Navbar.tsx`, `RightSidebar.tsx`

---

### Phase 3 — Testing Infrastructure

- Add Vitest + React Testing Library to devDependencies
- Add `"test": "vitest"` script to `package.json`
- Write unit tests for critical utilities:
  - `jsonUtils.ts`: `validateJSON`, `repairJSON`, `flattenJSON`, `removeDuplicateKeys`
  - `converters.ts`: YAML, XML, CSV round-trip tests
  - `codeGenerator.ts`: TypeScript and Python output validation
- Update CI to actually run tests (remove `|| echo "..."` fallback)
- Enable TypeScript strict mode (fix resulting errors)
- Add ESLint config (`eslint.config.js` is already referenced in docs)

---

### Phase 4 — Performance & Accessibility

**Virtual Scrolling (TreeView)**
- Use already-installed `react-window` (`FixedSizeList` or `VariableSizeList`)
- Flatten the visible tree nodes first, render them in the virtual list
- This fixes the 10,000+ node freeze issue

**D3 Visualization Optimization**
- Memoize `convertToTree` result
- Use D3's incremental update (enter/update/exit) instead of full SVG wipe on collapse

**Accessibility**
- Add `role="tree"` / `role="treeitem"` / `aria-expanded` to TreeView nodes
- Add focus trapping to modals (use `react-focus-lock` or `@headlessui/react`'s Dialog)
- Add keyboard navigation (arrow keys) to tree
- Add `skip to content` link in app shell
- Add `role="img"` + `aria-label` to D3 SVG

---

### Phase 5 — PWA Setup

- Add `manifest.json` to `/public` (name, icons, theme color, display: standalone)
- Create app icons in `/public` (at minimum 192x192 and 512x512)
- Configure `vite-plugin-pwa` in `vite.config.ts`
- Register service worker with basic cache-first strategy for static assets
- Test installability in Chrome DevTools

---

### Phase 6 — README & Docs Cleanup

Update `README.md` to accurately reflect current status:
- Mark VisualizationView, GuidedTour, PerformanceMonitor, IgnoreKeyOrder as ✅
- Remove Rust from code generation list
- Update Known Limitations section

---

### Phase 7 — Code Organization

**Split `ComparisonView.tsx` (888 lines)**
- Extract `useDiff` custom hook for all diff state and logic
- Extract `DiffPane` component for a single input pane (left or right)
- Keep outer layout in `ComparisonView.tsx`

**Fix Per-Tab Undo History**
- Move `history` and `historyIndex` into each `Tab` object in the store
- `pushHistory`, `undo`, `redo` operate only on the `activeTabId`'s tab

**Fix `clearAllData`**
- Change `localStorage.clear()` to targeted `localStorage.removeItem('json-viewer-storage')`

**Extract File Upload Hook**
- Create `useFileUpload()` hook with FileReader logic
- Use in `Navbar.tsx`, `JSONInput.tsx`, `ComparisonView.tsx`

**Connect Existing Utils to LeftSidebar**
- Replace inline `analyze()` in `LeftSidebar.tsx` with calls to `detectCircularReferences`, `findEmptyValues`, `findDuplicateValues` from `jsonUtils.ts`

---

## Priority Order

| Priority | Phase | Impact |
|---|---|---|
| P0 | Phase 1 | Fix broken features — these are silent failures |
| P1 | Phase 2 | Toast system — 40+ alert() calls hurt UX badly |
| P2 | Phase 3 | Testing — no safety net for any future work |
| P3 | Phase 4 | Performance/Accessibility — professional grade |
| P4 | Phase 5 | PWA — nice to have, installable app |
| P5 | Phase 6+7 | Cleanup — maintenance quality |

---

## Critical Files

| File | Changes Needed |
|---|---|
| `src/hooks/useJsonActions.ts` | Fix format/minify, add generateCode, add PDF case |
| `src/stores/useAppStore.ts` | Per-tab history, fix clearAllData, clean orphaned state |
| `src/components/Views/TreeView.tsx` | Hoist store subscriptions, add virtual scrolling, accessibility |
| `src/components/Views/ComparisonView.tsx` | Fix unified diff, split into smaller pieces |
| `src/components/Layout/RightSidebar.tsx` | Wire code generation properly |
| `src/components/Layout/Navbar.tsx` | Wire Code2 button, add masking toggle |
| `src/components/Views/JSONInput.tsx` | Fix MIME type check |
| `src/utils/jsonUtils.ts` | Already has good utilities — just wire them to LeftSidebar |
| `src/App.tsx` | Add ToastContainer, per-view ErrorBoundaries |
| `src/types/index.ts` | Clean up orphaned types |
| `tsconfig.json` | Enable strict mode |
| `package.json` | Add Vitest, ESLint, vite-plugin-pwa |
| `README.md` | Update accuracy |

---

## Verification

After implementing each phase:
- Phase 1: Manually test format/minify produce different output; test code generation opens modal with correct language output; test PDF export produces a .pdf file
- Phase 2: Trigger each former `alert()` action and verify toast appears without blocking UI
- Phase 3: `npm test` runs and passes; CI shows green test step
- Phase 4: Load a 1000-node JSON and verify TreeView scrolls smoothly; tab through the UI with keyboard only
- Phase 5: Open Chrome DevTools > Application > Manifest and verify installability
- Phase 6-7: `npm run type-check` passes in strict mode; ComparisonView file < 300 lines
