#!/bin/bash

# Azure Deployment Script for Restaurant Hiring Platform
# Usage: ./deploy-azure.sh [environment] [resource-group] [app-name]

set -e

# Default values
ENVIRONMENT=${1:-production}
RESOURCE_GROUP=${2:-restaurant-hiring-rg}
APP_NAME=${3:-restaurant-hiring-app}
LOCATION="East US"
SKU="B1"
RUNTIME="NODE|18-lts"

echo "🚀 Starting Azure deployment for Restaurant Hiring Platform"
echo "Environment: $ENVIRONMENT"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

# Login to Azure (if not already logged in)
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure:"
    az login
fi

# Create resource group if it doesn't exist
echo "📦 Creating/checking resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output none

# Create App Service Plan
echo "⚡ Creating App Service Plan..."
az appservice plan create \
    --name "${APP_NAME}-plan" \
    --resource-group $RESOURCE_GROUP \
    --sku $SKU \
    --is-linux \
    --output none

# Create Web App
echo "🌐 Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan "${APP_NAME}-plan" \
    --name $APP_NAME \
    --runtime "$RUNTIME" \
    --output none

# Configure Web App settings
echo "⚙️ Configuring Web App settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        NODE_ENV=production \
        WEBSITE_NODE_DEFAULT_VERSION="18-lts" \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        ENABLE_ORYX_BUILD=true \
    --output none

# Create PostgreSQL server
echo "🗄️ Creating PostgreSQL server..."
POSTGRES_SERVER="${APP_NAME}-db"
POSTGRES_ADMIN="dbadmin"
POSTGRES_PASSWORD=$(openssl rand -base64 32)

az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --location "$LOCATION" \
    --admin-user $POSTGRES_ADMIN \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --version 14 \
    --storage-size 32 \
    --output none

# Create database
echo "📊 Creating database..."
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER \
    --database-name restaurant_hiring \
    --output none

# Configure firewall to allow Azure services
echo "🔥 Configuring database firewall..."
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

# Set database connection string
DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/restaurant_hiring"

# Set environment variables
echo "🔧 Setting environment variables..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        DATABASE_URL="$DATABASE_URL" \
        NEXTAUTH_URL="https://${APP_NAME}.azurewebsites.net" \
        NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
        JWT_SECRET="$(openssl rand -base64 32)" \
        JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
    --output none

# Deploy the application
echo "🚀 Deploying application..."
cd web
zip -r ../restaurant-hiring-app.zip . -x "node_modules/*" ".next/*" "*.log"
cd ..

az webapp deploy \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src-path restaurant-hiring-app.zip \
    --type zip \
    --output none

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application is available at: https://${APP_NAME}.azurewebsites.net"
echo "🗄️ Database Server: ${POSTGRES_SERVER}.postgres.database.azure.com"
echo "🔐 Database Password: $POSTGRES_PASSWORD"
echo ""
echo "⚠️  IMPORTANT: Save the database password in a secure location!"
echo "📝 Next steps:"
echo "   1. Configure your domain and SSL certificate"
echo "   2. Set up monitoring and alerts"
echo "   3. Configure backup policies"
echo "   4. Update DNS records if using custom domain"

# Cleanup
rm -f restaurant-hiring-app.zip