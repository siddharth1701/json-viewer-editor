# Project Structure

This document outlines the organization of the JSON Viewer & Editor project.

## Directory Overview

```
json-viewer/
├── .github/                    # GitHub-specific files
│   └── workflows/              # GitHub Actions CI/CD workflows
│       ├── ci.yml             # Continuous integration
│       ├── deploy-github-pages.yml
│       └── deploy-vps.yml
│
├── deployment/                 # Deployment configurations
│   ├── github/                # GitHub Pages deployment
│   │   └── README.md
│   ├── shared-hosting/        # Shared hosting deployment
│   │   ├── .htaccess         # Apache configuration
│   │   └── README.md
│   ├── vps/                   # VPS deployment
│   │   ├── nginx.conf        # Nginx configuration
│   │   └── README.md
│   └── README.md              # Deployment options overview
│
├── docs/                       # Documentation
│   ├── DEPLOYMENT.md          # Main deployment guide
│   └── PROJECT_STRUCTURE.md   # This file
│
├── public/                     # Static assets
│   └── vite.svg               # Vite logo
│
├── scripts/                    # Utility scripts
│   └── deploy.sh              # VPS deployment script
│
├── src/                        # Source code
│   ├── components/            # React components
│   │   ├── Layout/           # Layout components
│   │   │   ├── LeftSidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── RightSidebar.tsx
│   │   ├── Modals/           # Modal dialogs
│   │   │   ├── HelpModal.tsx
│   │   │   ├── SearchModal.tsx
│   │   │   └── SettingsModal.tsx
│   │   └── Views/            # View components
│   │       ├── CodeView.tsx
│   │       ├── ComparisonView.tsx
│   │       ├── RawView.tsx
│   │       ├── TreeView.tsx
│   │       ├── ViewTabs.tsx
│   │       └── VisualizationView.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useJsonActions.ts
│   │
│   ├── stores/                # State management (Zustand)
│   │   └── useAppStore.ts
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── codeGenerator.ts  # Code generation
│   │   ├── converters.ts     # Format conversion
│   │   ├── jsonUtils.ts      # JSON utilities
│   │   └── samples.ts        # Sample data
│   │
│   ├── App.tsx               # Main app component
│   ├── index.css             # Global styles
│   └── main.tsx              # Entry point
│
├── .env.example               # Environment variables template
├── .gitignore                # Git ignore patterns
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML entry point
├── package.json              # Dependencies & scripts
├── postcss.config.js         # PostCSS configuration
├── README.md                 # Project README
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.*.json           # TypeScript configurations
└── vite.config.ts            # Vite build configuration
```

## Key Directories Explained

### `.github/workflows/`
Contains GitHub Actions workflows for automated CI/CD:
- **ci.yml**: Runs build and tests on every push
- **deploy-github-pages.yml**: Deploys to GitHub Pages
- **deploy-vps.yml**: Deploys to VPS via SSH

### `deployment/`
Organized deployment guides and configurations:
- **github/**: GitHub Pages deployment instructions
- **shared-hosting/**: Shared hosting setup with .htaccess
- **vps/**: VPS deployment with nginx configuration
- Each subdirectory has its own README.md with detailed instructions

### `docs/`
Project documentation:
- **DEPLOYMENT.md**: Comprehensive deployment guide
- **PROJECT_STRUCTURE.md**: This file

### `scripts/`
Utility scripts for automation:
- **deploy.sh**: Automated VPS deployment with backup/restore

### `src/components/`
React components organized by purpose:
- **Layout/**: Application shell (navbar, sidebars)
- **Modals/**: Dialog components (help, search, settings)
- **Views/**: Different JSON view modes

### `src/stores/`
Zustand state management:
- Global application state
- Tabs management
- Undo/redo functionality
- Settings persistence

### `src/utils/`
Helper functions:
- JSON validation and parsing
- Format conversion (YAML, XML, CSV, TOML)
- Code generation (TypeScript, Python, Java, etc.)
- Sample data library

## File Naming Conventions

- **React Components**: PascalCase (e.g., `TreeView.tsx`)
- **Utilities**: camelCase (e.g., `jsonUtils.ts`)
- **Configuration**: kebab-case (e.g., `tailwind.config.js`)
- **Documentation**: UPPERCASE (e.g., `README.md`)

## Build Output

When you run `npm run build`, Vite creates:

```
dist/
├── assets/
│   ├── index-[hash].js    # Bundled JavaScript
│   ├── index-[hash].css   # Bundled CSS
│   └── [other assets]
└── index.html             # HTML entry point
```

The `dist/` directory contains all files needed for deployment.

## Import Paths

The project uses path aliases configured in `tsconfig.json`:

```typescript
// @ points to src/
import { useAppStore } from '@/stores/useAppStore';
import { TreeView } from '@/components/Views/TreeView';
```

## Code Organization Best Practices

1. **Separation of Concerns**: Components, logic, and styles are separated
2. **Type Safety**: TypeScript types in dedicated `types/` directory
3. **Reusability**: Shared utilities in `utils/` directory
4. **State Management**: Centralized in Zustand stores
5. **Component Structure**: Small, focused components
6. **File Size**: Keep files under 300 lines when possible

## Adding New Features

When adding a new feature:

1. **Create Component**: Add to appropriate `components/` subdirectory
2. **Add Types**: Define types in `src/types/index.ts`
3. **Add Utilities**: Helper functions in `src/utils/`
4. **Update Store**: Add state/actions to `useAppStore.ts` if needed
5. **Add Tests**: Create test file alongside component
6. **Document**: Update README or docs as needed

## Configuration Files

### Development
- **vite.config.ts**: Vite bundler configuration
- **tsconfig.json**: TypeScript compiler options
- **eslint.config.js**: Linting rules
- **tailwind.config.js**: Tailwind CSS customization

### Deployment
- **.env.example**: Environment variable template
- **deployment/vps/nginx.conf**: Nginx server config
- **deployment/shared-hosting/.htaccess**: Apache config
- **.github/workflows/*.yml**: CI/CD pipelines

## Dependencies

### Core
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.1.12

### UI
- Tailwind CSS 4.1.16
- Monaco Editor 4.7.0
- Lucide React (icons)

### Utilities
- Zustand 5.0.8 (state)
- JSONPath Plus (queries)
- js-yaml, xml-js, papaparse (conversion)

See `package.json` for complete list.

## Environment Variables

All environment variables must be prefixed with `VITE_` to be exposed to the client:

```env
VITE_APP_NAME=JSON Viewer & Editor
VITE_ENABLE_ANALYTICS=false
```

See `.env.example` for all available options.

## Scripts

Available npm scripts:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Version Control

### Branching Strategy
- `main`: Production-ready code
- `develop`: Integration branch (optional)
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Commit Convention
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Deployment Artifacts

### GitHub Pages
- Workflow builds and deploys to `gh-pages` branch
- Accessible at: `https://username.github.io/repo-name/`

### VPS
- Script deploys to: `/var/www/json-viewer/`
- Nginx serves from: `/var/www/json-viewer/dist/`

### Shared Hosting
- Upload `dist/` contents to: `public_html/`
- Include `.htaccess` for routing

## Maintenance

### Regular Tasks
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Clean node_modules: `rm -rf node_modules && npm install`
- Rebuild: `npm run build`

### Before Deployment
- Run build: `npm run build`
- Test locally: `npm run preview`
- Check for errors: `npm run lint`
- Type check: `npm run type-check`

---

For more information:
- [Main README](../README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Component Documentation](../src/components/)
