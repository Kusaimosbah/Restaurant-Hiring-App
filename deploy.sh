#!/bin/bash

# Restaurant Hiring Platform - Production Deployment Script
# This script sets up and deploys the application in production

set -e

echo "🚀 Starting Restaurant Hiring Platform Production Deployment"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    
    print_success "System requirements satisfied"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env.production ]; then
        if [ -f .env.production.template ]; then
            cp .env.production.template .env.production
            print_warning "Created .env.production from template. Please update with your actual values."
            print_warning "Edit .env.production file before continuing deployment."
            exit 1
        else
            print_error ".env.production.template not found. Please create environment configuration."
            exit 1
        fi
    fi
    
    print_success "Environment configuration ready"
}

# Build and start services
deploy_services() {
    print_status "Building and deploying services..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Build the application
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services deployed successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run Prisma migrations
    docker-compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
    
    print_success "Database migrations completed"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check if web service is healthy
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Web service is healthy"
    else
        print_error "Web service health check failed"
        docker-compose -f docker-compose.prod.yml logs web
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Display deployment information
show_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Information:"
    echo "  • Application URL: http://localhost:3000"
    echo "  • Database: PostgreSQL (localhost:5432)"
    echo "  • Redis: localhost:6379"
    echo ""
    echo "🔧 Useful Commands:"
    echo "  • View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  • Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  • Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "  • Database shell: docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres restaurant_hiring"
    echo ""
    echo "🔍 Service Status:"
    docker-compose -f docker-compose.prod.yml ps
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Cleaning up..."
        docker-compose -f docker-compose.prod.yml down
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment flow
main() {
    echo "============================================="
    echo "  Restaurant Hiring Platform Deployment"
    echo "============================================="
    echo ""
    
    check_requirements
    setup_environment
    deploy_services
    run_migrations
    health_check
    show_deployment_info
}

# Run main function
main "$@"