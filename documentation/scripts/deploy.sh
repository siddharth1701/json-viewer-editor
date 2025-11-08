#!/bin/bash

# ================================================
# Deployment Script for JSON Viewer & Editor
# For VPS deployments (AWS, DigitalOcean, etc.)
# ================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/json-viewer"
BRANCH="main"
BACKUP_DIR="/var/www/json-viewer-backups"
MAX_BACKUPS=5

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}JSON Viewer Deployment Script${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running from correct directory
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Please run from project root."
    exit 1
fi

# Create backup
print_message "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

if [ -d "dist" ]; then
    tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" dist/
    print_message "Backup created: backup_$TIMESTAMP.tar.gz"

    # Keep only last N backups
    cd "$BACKUP_DIR"
    ls -t backup_*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
    cd -
else
    print_warning "No dist directory found to backup"
fi

# Git operations
print_message "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
print_message "Current branch: $CURRENT_BRANCH"

print_message "Fetching latest changes..."
git fetch origin

print_message "Pulling latest changes from $BRANCH..."
git pull origin "$BRANCH"

# Check for changes
if [ $? -ne 0 ]; then
    print_error "Git pull failed. Please resolve conflicts manually."
    exit 1
fi

# Check Node.js version
print_message "Checking Node.js version..."
NODE_VERSION=$(node -v)
print_message "Node.js version: $NODE_VERSION"

# Install dependencies
print_message "Installing dependencies..."
npm ci --production=false

if [ $? -ne 0 ]; then
    print_error "npm install failed"
    exit 1
fi

# Run build
print_message "Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"

    # Restore from backup if available
    if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" ]; then
        print_warning "Restoring from backup..."
        tar -xzf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
        print_message "Backup restored"
    fi

    exit 1
fi

# Set permissions
print_message "Setting file permissions..."
find dist -type f -exec chmod 644 {} \;
find dist -type d -exec chmod 755 {} \;

# Reload/restart web server
print_message "Restarting web server..."

if command -v systemctl &> /dev/null; then
    # Using systemd (nginx)
    if systemctl is-active --quiet nginx; then
        sudo systemctl reload nginx
        print_message "Nginx reloaded"
    else
        print_warning "Nginx is not running"
    fi
elif command -v service &> /dev/null; then
    # Using service command
    sudo service nginx reload
    print_message "Nginx reloaded"
else
    print_warning "Could not reload nginx automatically"
fi

# Run health check (if applicable)
# Uncomment and modify if you have a health endpoint
# print_message "Running health check..."
# HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
# if [ "$HEALTH_CHECK" = "200" ]; then
#     print_message "Health check passed"
# else
#     print_error "Health check failed with status: $HEALTH_CHECK"
# fi

# Display deployment info
print_message "Deployment completed successfully!"
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Branch: ${YELLOW}$BRANCH${NC}"
echo -e "Commit: ${YELLOW}$(git rev-parse --short HEAD)${NC}"
echo -e "Build time: ${YELLOW}$(date +'%Y-%m-%d %H:%M:%S')${NC}"
echo -e "Build size: ${YELLOW}$(du -sh dist/ | cut -f1)${NC}"
echo -e "${GREEN}================================${NC}"

# Optional: Send notification (uncomment and configure)
# Send Slack notification
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"JSON Viewer deployed successfully!"}' \
#   YOUR_SLACK_WEBHOOK_URL

# Send Discord notification
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"content":"JSON Viewer deployed successfully!"}' \
#   YOUR_DISCORD_WEBHOOK_URL

exit 0
