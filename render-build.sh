#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npm run db:migrate

echo "Seeding database..."
npm run db:seed

echo "Building application..."
npm run build