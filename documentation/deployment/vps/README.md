# VPS Deployment Guide

Deploy the JSON Viewer & Editor to a VPS (Virtual Private Server).

## Supported Platforms
- AWS EC2
- Digital Ocean Droplets
- Hostinger VPS
- Contabo VPS
- Linode
- Vultr
- Any Ubuntu/Debian-based VPS

## Quick Start

### 1. Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install git
sudo apt install -y git

# Verify installations
node --version
npm --version
nginx -v
```

### 2. Clone and Build Project

```bash
# Create application directory
sudo mkdir -p /var/www/json-viewer
sudo chown -R $USER:$USER /var/www/json-viewer

# Clone repository
cd /var/www/json-viewer
git clone YOUR_REPO_URL .

# Install dependencies
npm install

# Build for production
npm run build
```

### 3. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/json-viewer

# Edit the configuration file
sudo nano /etc/nginx/sites-available/json-viewer
# Replace 'your-domain.com' with your actual domain or use '_' for IP-based access

# Enable the site
sudo ln -s /etc/nginx/sites-available/json-viewer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 4. Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 5. Setup SSL (if using domain)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Deploy Updates

For future deployments, use the deployment script:

```bash
cd /var/www/json-viewer
../../scripts/deploy.sh
```

## Platform-Specific Notes

### AWS EC2

**Security Group Configuration:**
- Add inbound rule for HTTP (port 80)
- Add inbound rule for HTTPS (port 443)
- Add inbound rule for SSH (port 22)

**Elastic IP:**
- Allocate and associate an Elastic IP for static IP address

**Instance Types:**
- t2.micro (Free tier): Good for testing
- t3.small: Recommended for production
- t3.medium: High traffic sites

**Cost:** ~$5-20/month

### Digital Ocean

**Droplet Setup:**
- Use Ubuntu 22.04 LTS
- Basic droplet ($6/month) is sufficient
- Enable backups ($1.20/month additional)

**Floating IP:**
- Free static IP available

**Managed Databases:**
- Not needed for this static site

**Cost:** ~$6-12/month

### Hostinger VPS

**Access:**
- Use hPanel for management
- SSH access via terminal

**DNS Management:**
- Point A record to VPS IP
- Add CNAME for www subdomain

**SSL:**
- Free SSL via Let's Encrypt
- Auto-renewal configured

**Cost:** ~$4-30/month

### Contabo

**Value Option:**
- High resources for low cost
- 8GB RAM starting at ~$5/month

**Setup:**
- Manual setup required
- No one-click apps
- Full root access

**Cost:** ~$4-15/month

## Nginx Configuration

The `nginx.conf` file includes:

- ✅ Gzip compression
- ✅ Browser caching
- ✅ Security headers
- ✅ SPA routing (try_files)
- ✅ Static asset optimization
- ✅ SSL/HTTPS ready

## Deployment Script

The deployment script (`../../scripts/deploy.sh`) handles:

- Automatic backups before deployment
- Git pull latest changes
- Dependency installation
- Production build
- Nginx reload
- Rollback on failure

## Monitoring & Maintenance

### Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/json-viewer-access.log

# Error logs
sudo tail -f /var/log/nginx/json-viewer-error.log
```

### System Resources

```bash
# Check disk space
df -h

# Check memory
free -m

# Check CPU
top
```

### Update Application

```bash
cd /var/www/json-viewer
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### 502 Bad Gateway
- Check if application is built: `ls dist/`
- Check nginx error logs
- Verify nginx config: `sudo nginx -t`

### SSL Certificate Issues
- Check domain DNS points to server IP
- Verify ports 80/443 are open
- Run certbot again: `sudo certbot --nginx`

### Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/json-viewer

# Fix permissions
sudo chmod -R 755 /var/www/json-viewer/dist
```

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use SSH Keys** (disable password auth)
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

3. **Configure Fail2Ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular Backups**
   - Enable VPS provider backups
   - Backup database (if added later)
   - Keep git repository updated

5. **Monitor Logs**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

## Performance Optimization

### Enable HTTP/2

Already configured in nginx.conf when SSL is enabled.

### Enable Brotli Compression

```bash
sudo apt install brotli
# Add to nginx config
```

### CDN Integration

Consider using:
- CloudFlare (Free tier available)
- AWS CloudFront
- Fastly

## Backup Strategy

The deployment script creates backups automatically in `/var/www/json-viewer-backups/`.

**Manual Backup:**
```bash
cd /var/www/json-viewer
tar -czf backup-$(date +%Y%m%d).tar.gz dist/
```

**Restore from Backup:**
```bash
tar -xzf backup-YYYYMMDD.tar.gz
sudo systemctl reload nginx
```

## Cost Optimization

1. **Choose Right Instance Size:** Start small, scale up if needed
2. **Reserved Instances:** AWS offers 30-75% discount
3. **Use Free Tiers:** AWS (12 months), GCP (always free)
4. **Monitor Usage:** Set up billing alerts
5. **Spot Instances:** AWS spot instances for dev/staging

## Next Steps

After deployment:
- Set up monitoring (Uptime Robot, Pingdom)
- Configure analytics (optional)
- Setup automated backups
- Configure CI/CD (see ../github/)
- Add health check endpoints

## Support

For issues specific to this deployment method, check:
- Nginx documentation
- Your VPS provider's support
- [Main Deployment Guide](../DEPLOYMENT.md)
