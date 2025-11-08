# Quick Start Guide

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Deployment

### GitHub Pages (Free, Easiest)
1. Push code to GitHub
2. Enable GitHub Pages in Settings → Pages
3. Source: GitHub Actions
4. Done! Auto-deploys on every push to main

See: [deployment/github/](deployment/github/)

### Shared Hosting ($2-10/month)
1. Build: `npm run build`
2. Upload `dist/` folder contents to `public_html/`
3. Upload [deployment/shared-hosting/.htaccess](deployment/shared-hosting/.htaccess)
4. Done!

See: [deployment/shared-hosting/](deployment/shared-hosting/)

### VPS ($4-50/month)
1. Setup VPS with nginx
2. Clone repo to `/var/www/json-viewer`
3. Run: `./scripts/deploy.sh`
4. Done!

See: [deployment/vps/](deployment/vps/)

## Directory Structure

```
json-viewer/
├── .github/workflows/    # GitHub Actions CI/CD
├── deployment/           # Deployment configs & guides
│   ├── github/          # GitHub Pages
│   ├── shared-hosting/  # Shared hosting (with .htaccess)
│   ├── vps/             # VPS (with nginx.conf)
│   └── README.md        # Deployment options
├── docs/                 # Documentation
│   ├── DEPLOYMENT.md    # Comprehensive deployment guide
│   └── PROJECT_STRUCTURE.md
├── scripts/              # Utility scripts
│   └── deploy.sh        # VPS deployment script
├── src/                  # Source code
├── .env.example         # Environment variables template
└── README.md            # Main project README
```

## Key Features

✅ Tree, Raw, and Code views
✅ JSON comparison with diff navigation
✅ Search (text & JSONPath)
✅ Format conversion (YAML, XML, CSV, TOML)
✅ Code generation (TypeScript, Python, Java, etc.)
✅ Inline editing with validation
✅ Dark mode
✅ Undo/Redo
✅ Copy/Export functionality

## Documentation

- **[README.md](README.md)** - Project overview
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Full deployment guide
- **[PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - Code organization
- **[deployment/](deployment/)** - Platform-specific guides

## Support

- GitHub Issues
- Documentation in [docs/](docs/)
- Platform-specific guides in [deployment/](deployment/)

---

**Built with:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand

**License:** MIT
