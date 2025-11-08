# GitHub Deployment Guide

Deploy the JSON Viewer & Editor using GitHub (repository hosting and GitHub Pages).

## Table of Contents
1. [Repository Setup (Private & Public)](#repository-setup)
2. [GitHub Pages Deployment](#github-pages-deployment)
3. [GitHub Actions CI/CD](#github-actions-cicd)
4. [Automated Deployments](#automated-deployments)

---

## Repository Setup

### Create New Repository

#### Option 1: Private Repository

**Use Case:** Personal projects, proprietary code, work in progress

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: JSON Viewer & Editor"

# Create private repo on GitHub (via web or CLI)
# Using GitHub CLI:
gh repo create json-viewer --private --source=. --remote=origin

# Or manually: Create repo on GitHub.com (check "Private" option)
# Then:
git remote add origin https://github.com/USERNAME/json-viewer.git
git branch -M main
git push -u origin main
```

**Benefits:**
- ✅ Code is not publicly visible
- ✅ Can add collaborators
- ✅ Still use GitHub Actions (2,000 minutes/month free)
- ✅ Can still deploy to GitHub Pages
- ✅ Free for unlimited private repos

#### Option 2: Public Repository

**Use Case:** Open source projects, portfolio projects, community contributions

```bash
# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: JSON Viewer & Editor"

# Create public repo
gh repo create json-viewer --public --source=. --remote=origin

# Or manually: Create repo on GitHub.com (check "Public" option)
# Then:
git remote add origin https://github.com/USERNAME/json-viewer.git
git branch -M main
git push -u origin main
```

**Additional Steps for Public Repos:**
1. Add LICENSE file (MIT, Apache, etc.)
2. Update README with screenshots/demo
3. Add CONTRIBUTING.md
4. Add CODE_OF_CONDUCT.md
5. Enable issue templates
6. Add topics/tags for discoverability

### Repository Structure

Your repository includes:

```
.
├── .github/
│   └── workflows/           # CI/CD workflows
│       ├── ci.yml          # Build and test
│       ├── deploy-github-pages.yml
│       └── deploy-vps.yml
├── deployment/              # Deployment guides
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── src/                     # Source code
├── .gitignore
├── README.md
└── package.json
```

---

## GitHub Pages Deployment

### What is GitHub Pages?

- Free static site hosting by GitHub
- Supports custom domains
- Automatic HTTPS
- CDN-backed for fast loading
- Perfect for React/Vue/Angular apps

### Setup GitHub Pages

#### Method 1: Using GitHub Actions (Recommended)

**Step 1:** Update `vite.config.ts` for correct base path

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/json-viewer/', // Replace with your repo name
})
```

**Step 2:** The workflow file is already created at `.github/workflows/deploy-github-pages.yml`

**Step 3:** Enable GitHub Pages

1. Go to repository Settings
2. Click "Pages" in sidebar
3. Under "Source", select "GitHub Actions"
4. Save

**Step 4:** Push to main branch

```bash
git add .
git commit -m "Configure for GitHub Pages"
git push origin main
```

The workflow will automatically:
- Build the project
- Deploy to GitHub Pages
- Make it available at: `https://USERNAME.github.io/json-viewer/`

#### Method 2: Manual Deployment

```bash
# Build the project
npm run build

# Create gh-pages branch
git checkout -b gh-pages

# Copy dist contents to root
cp -r dist/* .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Switch back to main
git checkout main
```

Then enable Pages with source: gh-pages branch

### Custom Domain

To use custom domain (e.g., json.yourdomain.com):

**Step 1:** Add CNAME file to `public/` folder:

```bash
echo "json.yourdomain.com" > public/CNAME
```

**Step 2:** Configure DNS at your domain registrar:

```
Type: CNAME
Name: json (or @ for root domain)
Value: USERNAME.github.io
```

**Step 3:** Enable custom domain in GitHub:

1. Repository Settings → Pages
2. Enter custom domain: `json.yourdomain.com`
3. Check "Enforce HTTPS"
4. Wait for DNS check to pass

### GitHub Pages Limitations

- ❌ 100GB soft bandwidth limit per month
- ❌ 1GB repository size limit
- ❌ No server-side code (perfect for static sites)
- ✅ Free SSL/HTTPS
- ✅ CDN-backed
- ✅ Works with custom domains

---

## GitHub Actions CI/CD

### Available Workflows

#### 1. CI Workflow (`ci.yml`)

Runs on every push and pull request:

- ✅ Builds the project on Node 18 & 20
- ✅ Runs type checking
- ✅ Runs linting
- ✅ Runs tests (if configured)
- ✅ Uploads build artifacts

**Trigger:**
```bash
git push origin main
# or create a pull request
```

#### 2. GitHub Pages Deployment (`deploy-github-pages.yml`)

Automatically deploys to GitHub Pages:

- ✅ Builds on every push to main
- ✅ Deploys to Pages
- ✅ Available at USERNAME.github.io/REPO

**Trigger:**
```bash
git push origin main
```

#### 3. VPS Deployment (`deploy-vps.yml`)

Automatically deploys to your VPS:

- ✅ SSH into VPS
- ✅ Pull latest code
- ✅ Build and deploy
- ✅ Restart nginx

**Setup Required:**

1. Generate SSH key pair:
```bash
ssh-keygen -t ed25519 -C "github-actions"
```

2. Add public key to VPS:
```bash
# On VPS
echo "PUBLIC_KEY" >> ~/.ssh/authorized_keys
```

3. Add secrets to GitHub:
   - Go to repo Settings → Secrets and variables → Actions
   - Add secrets:
     - `VPS_HOST`: Your VPS IP or domain
     - `VPS_USERNAME`: SSH username (ubuntu, root, etc.)
     - `VPS_SSH_KEY`: Private key content
     - `VPS_PORT`: SSH port (usually 22)

**Trigger:**
```bash
git push origin main
```

### Workflow Customization

Edit workflow files in `.github/workflows/`:

```yaml
# Example: Run on different branches
on:
  push:
    branches: [ main, develop, staging ]

# Example: Schedule deployment
on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM
```

### Monitoring Workflows

1. Go to repository → Actions tab
2. See all workflow runs
3. Click on a run to see details
4. View logs for debugging

---

## Automated Deployments

### Deploy on Every Push

Already configured! Every push to `main` triggers:
1. CI workflow (build & test)
2. GitHub Pages deployment
3. VPS deployment (if secrets configured)

### Deploy on Tag/Release

Create a release-based deployment:

```yaml
# .github/workflows/release.yml
name: Release Deployment

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ... deployment steps
```

Usage:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Or create release on GitHub.com
```

### Deploy on Schedule

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
```

### Manual Deployment

Trigger workflow manually:

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow" button

Or via CLI:
```bash
gh workflow run deploy-github-pages.yml
```

---

## Branch Strategy

### Simple Strategy (Single Developer)

```
main (production)
  └── All commits go here
```

### Feature Branch Strategy

```
main (production)
  ├── develop (integration)
  │    ├── feature/new-feature
  │    ├── feature/another-feature
  │    └── bugfix/fix-issue
  └── hotfix/critical-fix
```

**Workflow:**
```bash
# Create feature branch
git checkout -b feature/search-improvements

# Make changes
git add .
git commit -m "Improve search functionality"

# Push and create PR
git push origin feature/search-improvements
gh pr create --base main --head feature/search-improvements
```

---

## Collaboration Features

### Issues

Track bugs and features:

```bash
# Create issue via CLI
gh issue create --title "Bug: Search not working" --body "Description..."

# Or use GitHub.com Issues tab
```

### Pull Requests

Code review workflow:

```bash
# Create PR
gh pr create --title "Add search feature" --body "Implements #123"

# Review PR
gh pr review 1 --approve

# Merge PR
gh pr merge 1
```

### Discussions

Enable Discussions for Q&A:
1. Repository Settings → Features
2. Check "Discussions"

---

## Security

### Dependabot

Enable automatic dependency updates:

1. Repository Settings → Code security
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"

### Code Scanning

Enable CodeQL scanning:

```yaml
# .github/workflows/codeql.yml
name: CodeQL

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
      - uses: github/codeql-action/analyze@v2
```

### Secrets Management

Never commit secrets! Use GitHub Secrets:

1. Settings → Secrets and variables → Actions
2. Add secret
3. Use in workflows: `${{ secrets.SECRET_NAME }}`

---

## Performance Optimization

### Workflow Optimization

```yaml
# Cache dependencies
- uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'

# Parallel jobs
jobs:
  build:
    strategy:
      matrix:
        node-version: [18.x, 20.x]
```

### Build Optimization

```bash
# Use npm ci instead of npm install
npm ci

# Build only on changes
git diff --quiet && exit 0 || npm run build
```

---

## Costs

| Feature | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Private Repos** | Unlimited | N/A |
| **Public Repos** | Unlimited | N/A |
| **GitHub Pages** | Free | Free |
| **Actions Minutes** | 2,000/month | $0.008/min |
| **Storage** | 500MB | $0.25/GB/month |
| **Bandwidth** | 100GB/month | Free |

**For this project:** Free tier is more than sufficient!

---

## Troubleshooting

### Workflow Fails

1. Check Actions tab for error logs
2. Verify secrets are set correctly
3. Check permissions in workflow file

### Pages Not Updating

1. Check workflow completed successfully
2. Wait 1-2 minutes for CDN update
3. Clear browser cache (Ctrl+Shift+R)
4. Check base path in vite.config.ts

### VPS Deployment Fails

1. Verify SSH connection works locally:
   ```bash
   ssh -i private_key user@host
   ```
2. Check VPS has git installed
3. Verify project path exists on VPS
4. Check VPS firewall rules

---

## Best Practices

1. ✅ Use descriptive commit messages
2. ✅ Create branches for features
3. ✅ Write pull request descriptions
4. ✅ Keep workflows simple
5. ✅ Document workflow requirements
6. ✅ Use environment variables for config
7. ✅ Enable branch protection rules
8. ✅ Require PR reviews before merge
9. ✅ Run CI on all PRs
10. ✅ Keep dependencies updated

---

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

---

## Next Steps

After setup:
- [ ] Enable branch protection on main
- [ ] Set up issue templates
- [ ] Configure Dependabot
- [ ] Add status badges to README
- [ ] Enable discussions (optional)
- [ ] Set up project board (optional)

For other deployment methods:
- [VPS Deployment](../vps/)
- [Shared Hosting](../shared-hosting/)
- [Main Deployment Guide](../../DEPLOYMENT.md)
