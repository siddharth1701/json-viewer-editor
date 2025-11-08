# Deployment Guide - JSON Viewer & Editor

This guide covers deploying the JSON Viewer & Editor application to various hosting platforms.

## Table of Contents
- [VPS Deployment (AWS, Digital Ocean, Hostinger, Contabo)](#vps-deployment)
- [Shared Hosting Deployment](#shared-hosting-deployment)
- [GitHub Setup (Private & Public)](#github-setup)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)

---

## VPS Deployment

### Prerequisites
- VPS with Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name (optional but recommended)

### 1. Initial VPS Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Install certbot for SSL (if using domain)
sudo apt install -y certbot python3-certbot-nginx

# Install git
sudo apt install -y git

# Verify installations
node --version
npm --version
nginx -v
```

### 2. Clone and Build Your Project

```bash
# Create application directory
sudo mkdir -p /var/www/json-viewer
sudo chown -R $USER:$USER /var/www/json-viewer

# Clone your repository (replace with your repo URL)
cd /var/www/json-viewer
git clone https://github.com/yourusername/json-viewer.git .

# Install dependencies
npm install

# Build for production
npm run build
```

### 3. Configure Nginx

Create nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/json-viewer
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or use _ for IP

    root /var/www/json-viewer/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

Enable the site and restart nginx:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/json-viewer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

### 4. Setup SSL with Let's Encrypt (if using domain)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically, test it:
sudo certbot renew --dry-run
```

### 5. Setup Automatic Deployment Script

Create a deployment script:

```bash
nano /var/www/json-viewer/deploy.sh
```

Add the following:

```bash
#!/bin/bash

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/json-viewer

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build project
echo "Building project..."
npm run build

# Restart nginx
echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Deployment complete!"
```

Make it executable:

```bash
chmod +x /var/www/json-viewer/deploy.sh
```

### 6. Platform-Specific Notes

#### AWS EC2
- Open port 80 and 443 in Security Groups
- Use Elastic IP for static IP address
- Consider using AWS CloudFront for CDN

#### Digital Ocean
- Use their one-click Node.js droplet for faster setup
- Enable Digital Ocean firewall
- Consider using Spaces for asset hosting

#### Hostinger VPS
- Access via their VPS control panel
- Use their DNS management for domain setup
- Pre-configured with cPanel (optional)

#### Contabo
- Budget-friendly option
- Higher resource allocation
- Manual setup required (no one-click apps)

---

## Shared Hosting Deployment

Most shared hosting supports static file hosting. Here's how to deploy:

### 1. Build Your Project Locally

```bash
# On your local machine
npm run build
```

This creates a `dist` folder with all static files.

### 2. Upload via FTP/SFTP

Use FileZilla, WinSCP, or your hosting's file manager:

1. Connect to your hosting via FTP/SFTP
2. Navigate to `public_html` or `www` directory
3. Upload all contents of the `dist` folder
4. Ensure `index.html` is in the root

### 3. Configure .htaccess (for Apache)

Create a `.htaccess` file in the root:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
```

### 4. Popular Shared Hosting Platforms

#### cPanel Hosting
1. Login to cPanel
2. Use File Manager to upload `dist` contents
3. Or use FTP credentials from cPanel

#### Hostinger Shared
1. Use hPanel file manager
2. Upload to `public_html`
3. SSL certificate auto-installed

#### Bluehost/SiteGround
1. Use their file manager or FTP
2. Upload to `public_html`
3. Free SSL available via cPanel

---

## GitHub Setup

### Option 1: Private Repository

```bash
# Initialize git (if not already done)
git init

# Add .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
Thumbs.db
EOF

# Add all files
git add .

# Commit
git commit -m "Initial commit: JSON Viewer & Editor application"

# Create private repository on GitHub
# Then add remote and push
git remote add origin https://github.com/yourusername/json-viewer.git
git branch -M main
git push -u origin main
```

### Option 2: Public Repository

Same as above, but create a public repository on GitHub.

**Additional steps for public repos:**

1. Add a comprehensive README.md
2. Add LICENSE file (MIT, Apache, etc.)
3. Add CONTRIBUTING.md
4. Add screenshots/demo GIF
5. Consider GitHub Pages for hosting

### GitHub Pages Deployment (for Public Repos)

1. Build with correct base path:

```bash
# Update vite.config.ts
export default defineConfig({
  base: '/json-viewer/', // Replace with your repo name
  // ... rest of config
})
```

2. Build and deploy:

```bash
npm run build
```

3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: /dist
   - Or use GitHub Actions workflow (see below)

---

## CI/CD with GitHub Actions

### Automatic Deployment to GitHub Pages

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Automatic Deployment to VPS

Create `.github/workflows/deploy-vps.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/json-viewer
            git pull origin main
            npm install
            npm run build
            sudo systemctl restart nginx
```

**Setup GitHub Secrets:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VPS_HOST`: Your VPS IP or domain
   - `VPS_USERNAME`: SSH username (usually `root` or `ubuntu`)
   - `VPS_SSH_KEY`: Your private SSH key

---

## Environment Variables

Create `.env.example` for documentation:

```bash
# .env.example
# Copy this to .env and fill in your values

# Optional: Analytics
VITE_GA_TRACKING_ID=

# Optional: API endpoints (if needed in future)
VITE_API_URL=

# Optional: Feature flags
VITE_ENABLE_ANALYTICS=false
```

---

## Quick Deployment Checklist

### Before Deployment
- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm run preview`
- [ ] Update version in package.json
- [ ] Check all environment variables
- [ ] Review .gitignore file
- [ ] Test on different browsers

### VPS Deployment
- [ ] VPS provisioned and accessible
- [ ] Node.js and nginx installed
- [ ] Project cloned and built
- [ ] Nginx configured and running
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured (ports 80, 443)

### Shared Hosting
- [ ] Build created locally
- [ ] FTP/SFTP credentials ready
- [ ] Files uploaded to public_html
- [ ] .htaccess file in place
- [ ] Test website access

### GitHub
- [ ] Repository created (private/public)
- [ ] Code pushed to main branch
- [ ] README.md updated
- [ ] CI/CD workflow configured (optional)
- [ ] GitHub Pages enabled (if public)

---

## Troubleshooting

### Common Issues

**404 on page refresh:**
- Ensure nginx `try_files` is configured correctly
- For shared hosting, check .htaccess rewrite rules

**Assets not loading:**
- Check base path in vite.config.ts
- Verify file permissions (755 for directories, 644 for files)

**Build fails:**
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 16+)

**SSL issues:**
- Verify domain DNS points to VPS IP
- Check certbot logs: `sudo certbot certificates`
- Ensure ports 80/443 are open

---

## Performance Optimization

### After Deployment

1. **Enable CDN** (CloudFlare, AWS CloudFront)
2. **Optimize images** (use WebP format)
3. **Enable brotli compression** (in addition to gzip)
4. **Monitor with Google Lighthouse**
5. **Setup uptime monitoring** (UptimeRobot, Pingdom)

---

## Support & Updates

### Keeping Your Deployment Updated

```bash
# On VPS
cd /var/www/json-viewer
./deploy.sh

# Or manually
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
```

### Rollback

```bash
# View commit history
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>
npm install
npm run build
sudo systemctl restart nginx
```

---

## Security Best Practices

1. **Keep dependencies updated:** `npm audit` and `npm update`
2. **Use HTTPS only** (redirect HTTP to HTTPS)
3. **Set security headers** (see nginx config)
4. **Regular backups** of database/content
5. **Monitor logs:** `sudo tail -f /var/log/nginx/access.log`
6. **Use strong SSH keys** (disable password auth)
7. **Enable firewall:** `sudo ufw enable`
8. **Regular OS updates:** `sudo apt update && sudo apt upgrade`

---

## Cost Comparison

| Platform | Monthly Cost | Best For |
|----------|-------------|----------|
| **AWS EC2** | $5-50+ | Scalability, enterprise |
| **Digital Ocean** | $5-20 | Developers, startups |
| **Hostinger VPS** | $4-30 | Budget-friendly |
| **Contabo** | $4-15 | High resources, budget |
| **Shared Hosting** | $2-10 | Simple static sites |
| **GitHub Pages** | Free | Open source, demos |

---

For questions or issues, please open an issue on GitHub or contact support.
