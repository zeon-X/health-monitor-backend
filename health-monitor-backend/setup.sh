#!/bin/bash

# Health Monitor Backend - Setup Script

echo "🏥 Health Monitoring System - Setup"
echo "===================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check MongoDB
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB not found in PATH"
    echo "   Make sure MongoDB is running (brew services start mongodb-community)"
    echo "   Or use: mongod --dbpath /usr/local/var/mongodb"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
    echo "✅ Creating .env from .env.example"
    cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the server:"
echo "   npm run dev    (development with auto-reload)"
echo "   npm start      (production mode)"
echo ""
echo "🧪 To run tests:"
echo "   npm test"
echo ""
