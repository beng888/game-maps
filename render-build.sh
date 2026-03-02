#!/bin/bash
set -e

echo "Creating database directory..."
mkdir -p src/db

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npm run db:migrate

echo "Building application..."
npm run build