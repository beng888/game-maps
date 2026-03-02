#!/bin/bash
set -e

echo "📁 Creating database directory..."
mkdir -p /opt/render/project/src/src/db
touch /opt/render/project/src/src/db/.keep

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migrations..."
NODE_ENV=production npm run db:migrate

echo "🏗️ Building application..."
NODE_ENV=production npm run build

echo "✅ Build complete!"