#!/bin/bash

# Database Seeding Script
# This script provides an easy way to seed the database with sample data

set -e  # Exit on any error

echo "🌱 Performance360 - Database Seeding Script"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one based on env.example"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma client..."
    npm run db:generate
fi

echo "🗑️  Clearing existing data..."
echo "📊 Creating sample data..."

# Run the seeding script
if command -v ts-node &> /dev/null; then
    echo "�� Running TypeScript seeding script..."
    npm run db:seed:ts
else
    echo "�� Running JavaScript seeding script..."
    npm run db:seed
fi

echo ""
echo "✅ Database seeding completed successfully!"
echo ""
echo "🔑 Sample Login Credentials:"
echo "   Admin: admin@company.com / admin123"
echo "   Manager: john.manager@company.com / manager123"
echo "   Employee: mike.employee@company.com / employee123"
echo ""
echo "🌐 You can now start the application with: npm run dev" 