#!/bin/bash

echo "🏗️  Setting up Construction Payroll Onboarding System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Start MongoDB with Docker
echo "🗄️  Starting MongoDB..."
docker run -d \
    --name construction-payroll-mongo \
    -p 27017:27017 \
    -v construction-payroll-data:/data/db \
    mongo:latest

if [ $? -eq 0 ]; then
    print_status "MongoDB started successfully"
else
    print_warning "MongoDB container might already exist, attempting to start existing container..."
    docker start construction-payroll-mongo
fi

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Create backend .env file
echo "📝 Creating backend environment file..."
cat > apps/backend/.env << EOL
PORT=5001
MONGODB_URI=mongodb://localhost:27017/construction-payroll-onboarding
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
EOL

print_status "Backend .env file created"

# Create frontend .env.local file
echo "📝 Creating frontend environment file..."
cat > apps/frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:5001/api
EOL

print_status "Frontend .env.local file created"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
    print_status "Root dependencies installed"
fi

if [ ! -d "apps/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd apps/backend && npm install && cd ../..
    print_status "Backend dependencies installed"
fi

if [ ! -d "apps/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd apps/frontend && npm install && cd ../..
    print_status "Frontend dependencies installed"
fi

# Seed the database
echo "🌱 Seeding database with initial data..."
cd apps/backend && npm run seed && cd ../..

if [ $? -eq 0 ]; then
    print_status "Database seeded successfully"
else
    print_warning "Database seeding failed. You can run 'npm run seed' manually from the apps/backend directory later."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the development servers:"
echo "   npm run dev"
echo ""
echo "2. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5001/api"
echo "   Health Check: http://localhost:5001/api/health"
echo ""
echo "🔑 Default login credentials:"
echo "   Admin: admin@example.com / password123"
echo "   User: user@example.com / password123"
echo ""
echo "🛑 To stop MongoDB:"
echo "   docker stop construction-payroll-mongo"
echo ""
echo "🔄 To restart MongoDB:"
echo "   docker start construction-payroll-mongo" 