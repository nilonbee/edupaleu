#!/bin/bash

echo "🚀 Starting Complete Deployment Process..."
echo "=========================================="

# Exit on any error
set -e

echo "📦 Step 1: Installing dependencies..."
npm install

echo "🔧 Step 2: Generating Prisma client..."
npx prisma generate

echo "🗄️ Step 3: Setting up database..."
npx prisma db push

echo "🌱 Step 4: Seeding database..."
npx ts-node prisma/seed.ts

echo "⚡ Step 5: Building TypeScript..."
npx tsc

echo "🔍 Step 6: Verifying build..."
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful - dist/index.js exists"
else
    echo "❌ Build failed - dist/index.js not found!"
    exit 1
fi

echo "=========================================="
echo "🎉 Deployment completed successfully!"
echo "✅ Database is set up and seeded"
echo "✅ Application is built and ready"
echo "=========================================="