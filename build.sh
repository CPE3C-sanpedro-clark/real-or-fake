#!/bin/bash
# Hostinger Build Script
# This script runs after npm install completes

echo "🔨 Building frontend for production..."
npm run build

echo "📦 Copying frontend to public_html..."
# Remove old files first (except .htaccess if it exists)
find ../public_html -mindepth 1 -not -name '.htaccess' -delete 2>/dev/null || true
# Copy fresh build to public_html
cp -r dist/* ../public_html/
# Copy .htaccess for SPA routing
cp .htaccess ../public_html/

echo "✅ Build and deployment complete!"
