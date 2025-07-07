# Docker Setup Guide

This guide explains how to run the Form App using Docker, which includes all Canvas dependencies and provides a consistent environment.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned

## Quick Start

### 1. Development Environment (with MongoDB)

```bash
# Start all services (backend, frontend, MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 2. Production Environment

```bash
# Create a .env file with your production variables
cp .env.example .env

# Edit .env with your actual values
nano .env

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

Create a `.env` file in the root directory with these variables:

```bash
# Production Environment Variables
NODE_ENV=production

# Database
MONGODB_URI=mongodb://your-mongo-connection-string

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# API URLs
CORS_ORIGIN=https://your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Email Configuration (Optional)
ENABLE_EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Form App
```

## Services

### Backend (Port 5000)
- **Canvas Support**: Includes all native dependencies for Canvas
- **Health Check**: Built-in health monitoring
- **File Uploads**: Persistent volume for uploads
- **API Endpoints**: Full REST API

### Frontend (Port 3000)
- **Next.js Application**: Optimized production build
- **Static Assets**: Served efficiently
- **API Integration**: Connected to backend

### MongoDB (Port 27017) - Development Only
- **Persistent Data**: Data survives container restarts
- **Admin Access**: Username: admin, Password: password

## Useful Commands

```bash
# Build only backend
docker-compose build backend

# Run backend only
docker-compose up backend

# Execute commands in running container
docker-compose exec backend npm run seed

# View container logs
docker-compose logs backend

# Clean up everything
docker-compose down -v --rmi all
```

## Render Deployment

For Render deployment, use the individual Dockerfiles:

1. **Backend Service**:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./apps/backend/Dockerfile`
   - **Docker Context**: `./apps/backend`

2. **Frontend Service**:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./apps/frontend/Dockerfile`
   - **Docker Context**: `./apps/frontend`

## Canvas Dependencies

The backend Dockerfile includes all necessary Canvas dependencies:
- `cairo-dev` - Cairo graphics library
- `pango-dev` - Text rendering
- `jpeg-dev` - JPEG support
- `giflib-dev` - GIF support
- `pixman-dev` - Pixel manipulation
- `freetype-dev` - Font rendering

## Troubleshooting

### Canvas Issues
If you encounter Canvas-related errors:
```bash
# Rebuild backend with no cache
docker-compose build --no-cache backend
```

### Permission Issues
```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER ./apps/backend/uploads
```

### Memory Issues
```bash
# Increase Docker memory limit in Docker Desktop
# Recommended: 4GB+ for Canvas compilation
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Make changes**: Edit code locally
3. **Rebuild if needed**: `docker-compose build backend`
4. **View logs**: `docker-compose logs -f backend`
5. **Test**: Access http://localhost:3000

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure proper MONGODB_URI
- [ ] Set correct CORS_ORIGIN
- [ ] Configure email settings
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (if needed)
- [ ] Set up monitoring
- [ ] Configure backups 