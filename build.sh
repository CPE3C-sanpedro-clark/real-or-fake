#!/bin/bash
# Hostinger Build Script
# This script runs after npm install completes

echo "🔨 Building frontend for production..."
npm run build

echo "✅ Build complete! Frontend will be served from dist/ folder"
