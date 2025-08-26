#!/bin/bash

echo "🚀 Starting production deployment..."

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy || echo "⚠️ Migration deploy failed, trying to push schema..."
npx prisma db push || echo "⚠️ Schema push failed"

# Seed database if needed (only on first deploy)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run seed
fi

# Start the application
echo "✅ Starting server..."
npm start