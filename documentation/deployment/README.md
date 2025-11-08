# Deployment Options

Choose the deployment method that best fits your needs.

## Quick Comparison

| Method | Difficulty | Cost | Best For | Setup Time |
|--------|-----------|------|----------|------------|
| **[GitHub Pages](./github/)** | Easy | Free | Open source, demos | 5 minutes |
| **[Shared Hosting](./shared-hosting/)** | Easy | $2-15/mo | Simple sites | 10 minutes |
| **[VPS](./vps/)** | Medium | $4-50/mo | Full control | 30 minutes |

## Deployment Guides

### 1. [GitHub Pages](./github/) - Recommended for Beginners

**Perfect for:**
- Portfolio projects
- Open source projects
- Quick demos
- Learning and experimentation

**Pros:**
- ✅ 100% Free
- ✅ Automatic HTTPS
- ✅ CDN-backed
- ✅ Easy CI/CD with GitHub Actions
- ✅ Custom domain support

**Cons:**
- ❌ Public repository required for free tier
- ❌ 100GB bandwidth limit/month
- ❌ Static sites only

[📖 Read GitHub Deployment Guide](./github/)

---

### 2. [Shared Hosting](./shared-hosting/) - Simplest Option

**Perfect for:**
- Personal projects
- Small business sites
- Low-traffic applications
- Budget-conscious deployments

**Pros:**
- ✅ Very affordable ($2-15/month)
- ✅ Easy setup (drag & drop)
- ✅ Managed hosting
- ✅ Free SSL included
- ✅ Email hosting included

**Cons:**
- ❌ Shared resources
- ❌ Limited control
- ❌ No Node.js support
- ❌ Performance limitations

[📖 Read Shared Hosting Guide](./shared-hosting/)

---

### 3. [VPS](./vps/) - Maximum Control

**Perfect for:**
- Production applications
- High-traffic sites
- Custom configurations
- Learning server management

**Pros:**
- ✅ Full control
- ✅ Scalable resources
- ✅ Better performance
- ✅ Can run backend services
- ✅ Multiple sites on one server

**Cons:**
- ❌ Higher cost ($4-50/month)
- ❌ Requires technical knowledge
- ❌ Manual server management
- ❌ Security responsibility

[📖 Read VPS Deployment Guide](./vps/)

---

## Quick Start Commands

### GitHub Pages
```bash
# Already configured! Just push:
git push origin main
# Visit: https://USERNAME.github.io/json-viewer/
```

### Shared Hosting
```bash
# Build and upload
npm run build
# Upload dist/ contents via FTP to public_html/
```

### VPS
```bash
# On your VPS
cd /var/www/json-viewer
../../scripts/deploy.sh
```

---

## Platform Recommendations

### For Learning/Portfolio
→ **GitHub Pages** - Free, easy, and looks great on your resume

### For Small Projects
→ **Shared Hosting** - Simple, affordable, managed

### For Startups/Growing Projects
→ **VPS** - Scalable, full control, professional

### For Enterprise
→ **VPS + CDN** - VPS with CloudFlare/CloudFront CDN

---

## Cost Breakdown

### Monthly Operating Costs

**Free Tier:**
- GitHub Pages: $0
- Cloudflare (optional CDN): $0

**Budget Tier ($2-10/month):**
- Hostinger Shared: $2-4
- Namecheap Shared: $2-5
- Contabo VPS: $4-5

**Standard Tier ($10-30/month):**
- Digital Ocean Droplet: $6-12
- Hostinger VPS: $8-15
- AWS EC2 t3.small: $15-20

**Premium Tier ($30-100/month):**
- AWS EC2 t3.medium: $30-50
- Managed hosting: $50-100
- High-performance VPS: $50-100

---

## Feature Comparison

| Feature | GitHub Pages | Shared | VPS |
|---------|--------------|--------|-----|
| **SSL/HTTPS** | ✅ Auto | ✅ Free | ✅ Let's Encrypt |
| **Custom Domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **CDN** | ✅ Built-in | ❌ Optional | ❌ Optional |
| **FTP Access** | ❌ No | ✅ Yes | ✅ Yes |
| **SSH Access** | ❌ No | ⚠️ Sometimes | ✅ Yes |
| **Database** | ❌ No | ✅ MySQL | ✅ Any |
| **Server Config** | ❌ No | ⚠️ Limited | ✅ Full |
| **Auto Scaling** | ✅ Yes | ❌ No | ⚠️ Manual |
| **Backups** | ✅ Git | ✅ Auto | ⚠️ Manual |

---

## Migration Paths

### Starting Small → Growing

1. **Start:** GitHub Pages (free, learn the app)
2. **Grow:** Shared Hosting (add custom domain)
3. **Scale:** VPS (more traffic, more control)
4. **Enterprise:** Cloud Platform (AWS/GCP/Azure)

### Moving Between Platforms

All platforms use the same build output (`npm run build`), making migration easy:

```bash
# Build once
npm run build

# Deploy anywhere
# - Upload dist/ to shared hosting
# - Deploy dist/ to VPS
# - Push to GitHub for Pages
```

---

## Support & Help

### Documentation
- [Main Deployment Guide](../../docs/DEPLOYMENT.md)
- [GitHub Guide](./github/README.md)
- [Shared Hosting Guide](./shared-hosting/README.md)
- [VPS Guide](./vps/README.md)

### Community
- GitHub Issues
- GitHub Discussions
- Stack Overflow

### Professional Help
- Hosting provider support (24/7 for most)
- Managed hosting services
- DevOps consultants

---

## Next Steps

1. **Choose your deployment method** based on needs and budget
2. **Read the specific guide** for your chosen method
3. **Follow the step-by-step instructions**
4. **Deploy and test** your application
5. **Set up monitoring** (UptimeRobot, Pingdom)
6. **Configure backups** (automated or manual)

---

## Additional Resources

- [CI/CD Setup](../github/README.md#github-actions-cicd)
- [SSL Configuration](../vps/README.md#setup-ssl)
- [Performance Optimization](../../docs/DEPLOYMENT.md#performance-optimization)
- [Security Best Practices](../../docs/DEPLOYMENT.md#security-best-practices)

---

**Need Help?** Open an issue on GitHub or consult the specific deployment guide for your platform.
