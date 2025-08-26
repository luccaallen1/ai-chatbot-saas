#!/bin/bash

echo "🔨 Render build script starting..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run build

# Run database migrations (only if DATABASE_URL is available)
if [ ! -z "$DATABASE_URL" ]; then
  echo "🗄️ Running database migrations..."
  npx prisma migrate deploy
  
  # Seed database on first deploy
  if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run seed
  fi
else
  echo "⚠️ No DATABASE_URL found, skipping migrations"
fi

echo "✅ Build completed successfully!"