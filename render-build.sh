#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Creating database directory..."
mkdir -p /opt/render/project/src/data

echo "Running database migrations..."
NODE_ENV=production npm run db:migrate

echo "Seeding database..."
# Run seed with explicit NODE_ENV and capture output
NODE_ENV=production npm run db:seed 2>&1 | tee seed-output.log

# Check if seed failed
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ Seeding failed! Check seed-output.log for details"
    exit 1
fi

echo "✅ Seeding completed successfully"

echo "Building application..."
npm run build