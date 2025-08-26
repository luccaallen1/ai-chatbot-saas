#!/bin/bash

echo "🚀 Starting production deployment..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed database if needed (only on first deploy)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run seed
fi

# Start the application
echo "✅ Starting server..."
npm start