# Restaurant Hiring Platform - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- SSL certificates (for production)
- Domain name configured (optional)

### 1. Environment Setup
```bash
# Copy environment template
cp .env.production.template .env.production

# Edit with your actual values
nano .env.production
```

### 2. Deploy
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🔧 Configuration

### Database Configuration
- **PostgreSQL 15**: Main application database
- **Redis**: Session storage and caching
- **Automatic migrations**: Prisma handles schema updates

### Security Features
- **Rate limiting**: API and auth endpoint protection
- **SSL/TLS**: HTTPS encryption with modern protocols
- **Security headers**: XSS, CSRF, and clickjacking protection
- **Input validation**: Comprehensive request validation

### Monitoring & Health Checks
- **Health endpoints**: `/api/health` for service monitoring
- **Container health checks**: Automatic service recovery
- **Logging**: Structured application and access logs

## 🏗️ Architecture

```
Internet → nginx (SSL/Rate Limiting) → Next.js App → PostgreSQL/Redis
```

### Services
1. **nginx**: Reverse proxy, SSL termination, rate limiting
2. **web**: Next.js application with layered architecture
3. **postgres**: Primary database with persistent storage
4. **redis**: Caching and session management

## 🎛️ Management Commands

### Service Management
```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Restart services
docker-compose -f docker-compose.prod.yml restart [service_name]

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Update and redeploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Management
```bash
# Database shell access
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres restaurant_hiring

# Run migrations
docker-compose -f docker-compose.prod.yml exec web npx prisma migrate deploy

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres restaurant_hiring > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres restaurant_hiring < backup.sql
```

### Application Management
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f web

# Execute commands in web container
docker-compose -f docker-compose.prod.yml exec web npm run [command]

# Access web container shell
docker-compose -f docker-compose.prod.yml exec web sh
```

## 🔐 SSL Setup

### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/

# Update nginx.conf with your domain
sed -i 's/your-domain.com/actual-domain.com/g' nginx.conf
```

### Auto-renewal
```bash
# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🌐 Cloud Deployment

### AWS ECS Deployment
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account].dkr.ecr.us-east-1.amazonaws.com
docker build -t restaurant-hiring .
docker tag restaurant-hiring:latest [account].dkr.ecr.us-east-1.amazonaws.com/restaurant-hiring:latest
docker push [account].dkr.ecr.us-east-1.amazonaws.com/restaurant-hiring:latest
```

### Azure Container Instances
```bash
# Login to Azure
az login

# Create resource group
az group create --name restaurant-hiring --location eastus

# Deploy container
az container create \
  --resource-group restaurant-hiring \
  --name restaurant-hiring-app \
  --image restaurant-hiring:latest \
  --dns-name-label restaurant-hiring \
  --ports 3000
```

## 📊 Performance Optimization

### Database Optimization
- Connection pooling enabled
- Query optimization with proper indexes
- Read replicas for scaling (configure separately)

### Application Optimization
- Next.js production build with optimization
- Static asset caching via nginx
- Redis caching for sessions and data

### Monitoring
- Container health checks
- Application health endpoints
- Log aggregation ready

## 🔍 Troubleshooting

### Common Issues
1. **Service won't start**: Check logs with `docker-compose logs [service]`
2. **Database connection failed**: Verify DATABASE_URL in .env.production
3. **SSL certificate issues**: Ensure certificates are in ./ssl/ directory
4. **Rate limiting**: Adjust nginx.conf limits if needed

### Performance Issues
1. **Slow responses**: Check database query performance
2. **High memory usage**: Monitor container resources
3. **Connection timeouts**: Adjust nginx proxy timeouts

### Recovery Procedures
```bash
# Complete system restart
docker-compose -f docker-compose.prod.yml down
docker system prune -f
./deploy.sh

# Database recovery
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres restaurant_hiring > emergency_backup.sql
```

## 📝 Maintenance

### Regular Tasks
- [ ] Update SSL certificates (quarterly)
- [ ] Database backups (daily)
- [ ] Security updates (monthly)
- [ ] Performance monitoring (weekly)
- [ ] Log rotation (weekly)

### Update Process
1. Backup database
2. Pull latest code
3. Run `./deploy.sh`
4. Verify health checks
5. Monitor for issues

## 🔗 Related Documentation
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Docker Compose Production Guide](https://docs.docker.com/compose/production/)
- [nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)