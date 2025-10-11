#!/bin/bash

# Authentication System Startup & Test Script
# This script sets up the environment and runs comprehensive tests

set -e  # Exit on any error

echo "🚀 Restaurant Hiring App - Authentication System Startup"
echo "======================================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within timeout"
    return 1
}

# Check dependencies
echo "🔧 Checking dependencies..."

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed"
    exit 1
fi

if ! command_exists docker; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ All dependencies found"
echo ""

# Start database
echo "🗄️  Starting PostgreSQL database..."
cd /mnt/c/Users/qosai/repos/Restaurant-Hiring-App

if ! docker-compose up -d db; then
    echo "❌ Failed to start database"
    exit 1
fi

# Wait for database to be ready
wait_for_service "PostgreSQL" "docker-compose exec -T db pg_isready -h localhost -p 5432"

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd web

if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install
else
    echo "   Dependencies already installed"
fi

# Set up environment variables
echo "🌍 Setting up environment..."

if [ ! -f ".env" ]; then
    echo "   Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update JWT secrets in .env for production use"
fi

# Generate Prisma client and push schema
echo "🏗️  Setting up database schema..."

echo "   Generating Prisma client..."
npx prisma generate

echo "   Pushing schema to database..."
npx prisma db push

echo ""

# Run authentication tests
echo "🧪 Running authentication system tests..."

echo "   Testing database connectivity..."
node test-auth.js

echo ""

# Build the application
echo "🔨 Building application..."
npm run build

echo ""

# Start development server
echo "🌐 Starting development server..."
echo "   The application will be available at http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start in background for testing
npm run dev &
DEV_SERVER_PID=$!

# Wait for dev server to start
wait_for_service "Next.js Dev Server" "curl -f http://localhost:3000/api/health"

echo ""
echo "🎉 Authentication system is ready for testing!"
echo ""
echo "📋 Available endpoints:"
echo "   POST /api/auth/signup      - User registration"
echo "   POST /api/auth/signin      - User login"
echo "   POST /api/auth/logout      - User logout"
echo "   POST /api/auth/refresh     - Token refresh"
echo "   POST /api/auth/verify-email - Email verification"
echo "   POST /api/auth/forgot-password - Password reset request"
echo "   POST /api/auth/reset-password  - Password reset"
echo ""
echo "🧪 Test the system with:"
echo "   curl -X POST http://localhost:3000/api/auth/signup \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\",\"role\":\"WORKER\"}'"
echo ""
echo "💡 View authentication documentation: /docs/AUTH_SYSTEM_V2.md"
echo "📊 View validation report: /AUTHENTICATION_VALIDATION_REPORT.md"
echo ""

# Keep server running until user stops
wait $DEV_SERVER_PID