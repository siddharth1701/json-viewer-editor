# Shared Hosting Deployment Guide

Deploy the JSON Viewer & Editor to shared hosting platforms.

## Supported Platforms
- Hostinger Shared Hosting
- Bluehost
- SiteGround
- GoDaddy
- Namecheap
- DreamHost
- Any cPanel/Apache hosting

## Overview

Shared hosting is the simplest and most cost-effective option for deploying static sites. Since this is a client-side React application, it works perfectly on shared hosting.

## Prerequisites

- Shared hosting account with FTP/SFTP access
- Domain name (usually included)
- FTP client (FileZilla, WinSCP) or file manager access

## Deployment Steps

### Step 1: Build the Project Locally

On your local machine:

```bash
# Navigate to project directory
cd json-viewer

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with all the static files.

### Step 2: Upload Files

#### Option A: Using FTP Client (Recommended)

1. **Download FTP Client**
   - [FileZilla](https://filezilla-project.org/) (Windows, Mac, Linux)
   - [WinSCP](https://winscp.net/) (Windows)
   - [Cyberduck](https://cyberduck.io/) (Mac, Windows)

2. **Get FTP Credentials**
   - Login to your hosting control panel (cPanel/hPanel)
   - Find FTP accounts section
   - Note: hostname, username, password, port

3. **Connect and Upload**
   - Open FTP client
   - Enter your credentials
   - Navigate to `public_html` or `www` directory
   - Upload ALL contents from the `dist` folder
   - Also upload the `.htaccess` file from this directory

#### Option B: Using File Manager

1. Login to cPanel/hPanel
2. Open File Manager
3. Navigate to `public_html`
4. Click Upload
5. Select all files from `dist` folder
6. Upload `.htaccess` file

#### Option C: Using Git (if available)

Some hosts support Git deployment:

```bash
# On shared hosting via SSH (if available)
cd public_html
git clone YOUR_REPO_URL .
npm install
npm run build
cp -r dist/* .
```

### Step 3: Configure .htaccess

The `.htaccess` file in this directory is pre-configured with:

- ✅ SPA routing (redirects to index.html)
- ✅ Gzip compression
- ✅ Browser caching
- ✅ Security headers
- ✅ MIME types

**Important:** Make sure `.htaccess` is in the same directory as `index.html`

### Step 4: Verify Deployment

1. Visit your domain: `https://yourdomain.com`
2. Test all features:
   - Load JSON
   - Navigate different views
   - Refresh page (should not get 404)
3. Check browser console for errors

## Platform-Specific Instructions

### Hostinger Shared Hosting

1. Login to hPanel
2. Go to File Manager
3. Navigate to `public_html/yourdomain.com`
4. Upload files from `dist` folder
5. Upload `.htaccess` file
6. SSL is auto-configured

**Cost:** ~$2-10/month

### Bluehost

1. Login to Bluehost
2. Access cPanel
3. Open File Manager
4. Go to `public_html`
5. Upload files
6. Free SSL via Let's Encrypt (auto)

**Cost:** ~$3-10/month

### SiteGround

1. Login to Site Tools
2. Go to File Manager
3. Navigate to `public_html`
4. Upload files
5. Enable HTTPS in Site Tools

**Cost:** ~$3-15/month

### GoDaddy

1. Login to GoDaddy
2. Access cPanel or File Manager
3. Navigate to public folder
4. Upload files
5. Enable SSL in hosting settings

**Cost:** ~$5-15/month

### Namecheap

1. Login to cPanel
2. File Manager → public_html
3. Upload files
4. Free SSL available

**Cost:** ~$2-10/month

## File Structure After Upload

Your `public_html` should look like:

```
public_html/
├── .htaccess           # Apache configuration
├── index.html          # Main HTML file
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [other files from dist]
```

## SSL/HTTPS Setup

Most shared hosts offer free SSL:

### cPanel (Let's Encrypt)
1. Go to cPanel → SSL/TLS Status
2. Click "Run AutoSSL"
3. Wait for certificate installation

### hPanel (Hostinger)
1. SSL is automatic for all domains
2. Check Advanced → SSL

### Manual SSL
If not automatic:
1. Go to SSL/TLS section
2. Install Let's Encrypt certificate
3. Force HTTPS redirect (already in .htaccess)

## Domain Configuration

### Point Domain to Hosting

1. **Domain Registrar:**
   - Login to domain registrar
   - Update nameservers to hosting provider's NS

2. **DNS Settings:**
   - A Record: Point @ to hosting IP
   - CNAME: Point www to @

3. **Propagation:**
   - Wait 24-48 hours for DNS propagation
   - Check: https://dnschecker.org

### Subdomain Setup

To deploy to subdomain (e.g., `json.yourdomain.com`):

1. Create subdomain in cPanel
2. Navigate to subdomain folder
3. Upload files there
4. Add `.htaccess`

## Updating Your Site

When you make changes:

```bash
# On local machine
npm run build

# Upload new files via FTP
# Overwrite existing files in public_html
```

**Tip:** Clear browser cache after updates: Ctrl+Shift+R

## Performance Optimization

### Enable Compression

Already configured in `.htaccess`:
- Gzip compression for text files
- Browser caching for assets

### Optimize Images

```bash
# Use image optimization tools
npm install -g imagemin-cli
imagemin public/images/* --out-dir=dist/images
```

### CDN Integration

1. **CloudFlare (Free)**
   - Sign up at cloudflare.com
   - Add your site
   - Update nameservers
   - Enable auto-minify

2. **BunnyCDN**
   - Create pull zone
   - Point to your domain
   - Update asset URLs

## Common Issues & Solutions

### Issue 1: 404 on Page Refresh

**Problem:** Direct URL access or refresh gives 404

**Solution:** Ensure `.htaccess` is uploaded and mod_rewrite is enabled

```apache
# Add to .htaccess if missing
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Issue 2: Files Not Loading

**Problem:** CSS/JS not loading, blank page

**Solution:**
1. Check browser console for errors
2. Verify all files uploaded
3. Check file permissions (644 for files, 755 for directories)
4. Clear browser cache

### Issue 3: .htaccess Not Working

**Problem:** Rules not being applied

**Solution:**
1. Contact hosting to enable mod_rewrite
2. Check file name is exactly `.htaccess` (with the dot)
3. Verify file is in same directory as index.html

### Issue 4: SSL Not Working

**Problem:** Site not loading over HTTPS

**Solution:**
1. Enable SSL in hosting panel
2. Wait 10-15 minutes for activation
3. Force HTTPS via .htaccess (already included)
4. Clear browser cache

## File Permissions

Correct permissions for security:

```bash
# Directories: 755
find public_html -type d -exec chmod 755 {} \;

# Files: 644
find public_html -type f -exec chmod 644 {} \;
```

## Security Best Practices

1. **Keep .htaccess Updated**
   - Security headers configured
   - Prevent directory browsing

2. **Regular Backups**
   - Use hosting's backup feature
   - Download local copies monthly

3. **Update Dependencies**
   ```bash
   npm audit
   npm update
   npm run build
   ```

4. **Monitor Access Logs**
   - Available in cPanel → Metrics → Raw Access

## Cost Comparison

| Provider | Monthly Cost | SSL | Storage | Bandwidth |
|----------|--------------|-----|---------|-----------|
| Hostinger | $2-10 | Free | 30-100GB | Unlimited |
| Bluehost | $3-10 | Free | 50GB | Unlimited |
| SiteGround | $3-15 | Free | 10-40GB | Metered |
| GoDaddy | $5-15 | Free | 100GB | Unlimited |
| Namecheap | $2-10 | Free | 20-100GB | Unlimited |

## Limitations

- ❌ No server-side code (Node.js, Python, etc.)
- ❌ No custom server configuration
- ❌ Limited database options (MySQL only)
- ❌ Shared resources with other sites
- ✅ Perfect for static sites like this!

## Migration from Shared to VPS

When your site grows:

1. Export all files via FTP
2. Setup VPS (see ../vps/)
3. Upload files to VPS
4. Update DNS to point to VPS
5. Configure nginx/Apache on VPS

## Backup Strategy

### Automatic Backups

Most hosts offer:
- Daily backups (last 7-30 days)
- One-click restore
- Enable in cPanel → Backup

### Manual Backups

```bash
# Download via FTP regularly
# Or use cPanel backup tool
# Keep local copies of:
# - All website files
# - Database (if using one)
```

## Support Resources

- **cPanel Documentation:** https://docs.cpanel.net/
- **Hosting Provider Support:** Usually 24/7 chat/tickets
- **Community Forums:** WebHostingTalk, Reddit r/webhosting

## Next Steps

After deployment:
- Configure email (if needed)
- Setup analytics (Google Analytics)
- Monitor uptime (UptimeRobot - free)
- Optimize for SEO
- Configure CDN (optional)

## Troubleshooting Checklist

Before contacting support:

- [ ] All files from `dist` uploaded?
- [ ] `.htaccess` file present?
- [ ] File permissions correct?
- [ ] SSL enabled?
- [ ] DNS propagated? (check dnschecker.org)
- [ ] Browser cache cleared?
- [ ] Checked error logs in cPanel?

---

For advanced deployment options, see:
- [VPS Deployment](../vps/)
- [GitHub Pages](../github/)
- [Main Deployment Guide](../../DEPLOYMENT.md)
