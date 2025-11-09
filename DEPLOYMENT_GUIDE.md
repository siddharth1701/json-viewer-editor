# Deployment Guide - JSON Viewer & Editor

Your JSON Viewer & Editor is a React + Vite application that can be deployed to multiple free hosting platforms.

## Quick Summary

| Platform | Cost | Setup Time | Performance | Best For |
|----------|------|-----------|-------------|----------|
| **Vercel** | Free | 2 min | Excellent | 🏆 Recommended |
| **Netlify** | Free | 2 min | Excellent | Good alternative |
| **GitHub Pages** | Free | 5 min | Good | Using GitHub |
| **AWS Amplify** | Free Tier | 5 min | Good | Long-term usage |

---

## Option 1: Vercel (RECOMMENDED - Easiest)

### Why Vercel?
- ✅ One-click deployment from GitHub
- ✅ Automatic deployments on every push
- ✅ Excellent performance (global CDN)
- ✅ Free forever for open source
- ✅ Custom domain support
- ✅ Environment variables support

### Steps:

1. **Go to Vercel.com**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select your `json-viewer-editor` repository
   - Click "Import"

3. **Configure Project**
   - Framework: `Vite`
   - Build Command: `npm run build` (should auto-detect)
   - Output Directory: `dist` (should auto-detect)
   - Click "Deploy"

4. **Done!**
   - Your site is live at: `https://json-viewer-editor.vercel.app/` (or custom name)
   - Every push to GitHub automatically deploys

### Custom Domain (Optional)
- In Vercel dashboard → Settings → Domains
- Add your custom domain
- Follow DNS configuration

---

## Option 2: Netlify

### Steps:

1. **Go to Netlify.com**
   - Visit https://netlify.com
   - Sign up with GitHub

2. **Connect Repository**
   - Click "New site from Git"
   - Select GitHub
   - Choose `json-viewer-editor` repository

3. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

4. **Done!**
   - Your site is live at: `https://your-site-name.netlify.app/`
   - Auto-deploys on every push

---

## Option 3: GitHub Pages

### Steps:

1. **Update vite.config.ts**
   ```typescript
   base: '/json-viewer-editor/',  // Change if using GitHub Pages
   ```
   *Note: Only needed for GitHub Pages. Vercel/Netlify use `/`*

2. **Create GitHub Actions Workflow**

   Create file: `.github/workflows/deploy.yml`
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     deploy:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Directory: / (root)

4. **Done!**
   - Your site is live at: `https://siddharth1701.github.io/json-viewer-editor/`

---

## Option 4: AWS Amplify

### Steps:

1. **Go to AWS Amplify Console**
   - Visit https://console.aws.amazon.com/amplify

2. **New App**
   - Select "Host web app"
   - Choose GitHub
   - Authenticate with GitHub

3. **Select Repository**
   - Choose `json-viewer-editor`
   - Choose `main` branch

4. **Configure Build Settings**
   - buildSpec should auto-detect
   - Or use:
     ```
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: dist
         files:
           - '**/*'
       cache:
         paths:
           - node_modules/**/*
     ```

5. **Deploy**
   - Click "Save and deploy"

6. **Done!**
   - Your site is live
   - Auto-deploys on every push

---

## Testing Locally Before Deployment

```bash
# Build the project
npm run build

# Preview the build locally
npm run preview

# Visit http://localhost:4173
```

---

## Environment Variables

If you add API endpoints later, you can set environment variables:

```bash
# Create .env file for local testing
VITE_API_URL=https://api.example.com
```

For Vercel/Netlify/Amplify:
- Add in dashboard → Settings → Environment Variables
- Use in code: `import.meta.env.VITE_API_URL`

---

## Troubleshooting

### Issue: Blank page on deployment
**Solution:** Check if `base` in `vite.config.ts` is correct
- Vercel/Netlify: `base: '/'`
- GitHub Pages: `base: '/json-viewer-editor/'`

### Issue: Routes not working
**Solution:** Most platforms need routing configuration
- **Vercel/Netlify:** Auto-configured for SPA
- **GitHub Pages:** Works fine for single-page apps

### Issue: Large build size
**Solution:** Current build is ~500KB gzipped (normal for React + D3)
- All dependencies included for offline use
- No additional optimization needed

---

## Summary: Which Should You Choose?

### For Quick Setup: **Vercel** ⭐
- Fastest setup (2 minutes)
- Best performance
- Most features

### For Best Free Tier: **Netlify**
- Similar to Vercel
- Slightly different UI
- Equally reliable

### For GitHub Integration: **GitHub Pages**
- Free forever
- Uses GitHub Actions
- Slightly more setup

### For Long-term Growth: **AWS Amplify**
- Free tier for first year
- Pay-as-you-go after
- More scalable

---

## Next Steps

1. Choose your platform
2. Follow the deployment steps above
3. Push to GitHub (if using auto-deploy)
4. Share your link!

**Your app is ready to deploy! 🚀**

---

## Questions?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- GitHub Pages Docs: https://pages.github.com
- AWS Amplify: https://docs.amplify.aws
