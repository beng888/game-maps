#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Creating database directory..."
mkdir -p /opt/render/project/src/data

echo "Running database migrations..."
NODE_ENV=production npm run db:migrate

echo "Seeding database..."
NODE_ENV=production npm run db:seed || true

echo "Building application..."
npm run build