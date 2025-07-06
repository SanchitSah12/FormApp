#!/bin/bash

echo "🚀 Setting up Advanced Form Application System..."

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
    --name form-app-mongo \
    -p 27017:27017 \
    -v form-app-data:/data/db \
    mongo:latest

if [ $? -eq 0 ]; then
    print_status "MongoDB started successfully"
else
    print_warning "MongoDB container might already exist, attempting to start existing container..."
    docker start form-app-mongo
fi

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Create backend .env file
echo "📝 Creating backend environment file..."
cat > apps/backend/.env << EOL
# Database
PORT=5001
MONGODB_URI=mongodb://localhost:27017/form-application
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Payment Configuration (Optional - Configure for payment features)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (Optional - Configure for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourapp.com

# Optional: Analytics and Monitoring
ANALYTICS_ENABLED=true
LOG_LEVEL=info
EOL

print_status "Backend .env file created"

# Create frontend .env.local file
echo "📝 Creating frontend environment file..."
cat > apps/frontend/.env.local << EOL
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_COLLABORATION=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_I18N=true

# Stripe Configuration (Optional - For payment features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# PayPal Configuration (Optional)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Google Maps API (Optional - For location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
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

# Create additional configuration
echo "⚙️  Setting up additional configuration..."

# Create uploads directory
mkdir -p apps/backend/uploads
print_status "Created uploads directory"

# Create public locales directory for i18n
mkdir -p apps/frontend/public/locales/{en,es,fr,de,it,pt,ru,zh,ja,ko,ar,he,hi,th,vi}
print_status "Created localization directories"

# Create sample locale files
cat > apps/frontend/public/locales/en/common.json << EOF
{
  "welcome": "Welcome to Advanced Form Application",
  "loading": "Loading...",
  "save": "Save",
  "cancel": "Cancel",
  "submit": "Submit",
  "edit": "Edit",
  "delete": "Delete"
}
EOF

cat > apps/frontend/public/locales/es/common.json << EOF
{
  "welcome": "Bienvenido a la Aplicación de Formularios Avanzada",
  "loading": "Cargando...",
  "save": "Guardar",
  "cancel": "Cancelar",
  "submit": "Enviar",
  "edit": "Editar",
  "delete": "Eliminar"
}
EOF

print_status "Created sample locale files"

# Seed the database
echo "🌱 Seeding database with initial data..."
cd apps/backend && npm run seed && cd ../..

if [ $? -eq 0 ]; then
    print_status "Database seeded successfully"
else
    print_warning "Database seeding failed. You can run 'npm run seed' manually from the apps/backend directory later."
fi

# Create first super admin user
echo "👨‍💼 Creating super admin user..."
cd apps/backend
node -e "
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/form-application')
  .then(async () => {
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        email: 'superadmin@example.com',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        isActive: true
      });
      await superAdmin.save();
      console.log('✅ Super admin user created');
    } else {
      console.log('ℹ️  Super admin user already exists');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to create super admin:', err);
    process.exit(1);
  });
" 2>/dev/null
cd ../..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "� IMPORTANT CONFIGURATION NOTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📧 EMAIL CONFIGURATION:"
echo "   Edit apps/backend/.env and configure SMTP settings for email features"
echo ""
echo "💳 PAYMENT CONFIGURATION:"
echo "   1. Sign up for Stripe: https://stripe.com"
echo "   2. Get your API keys from Stripe Dashboard"
echo "   3. Update STRIPE_SECRET_KEY in apps/backend/.env"
echo "   4. Update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in apps/frontend/.env.local"
echo ""
echo "🗺️  MAPS CONFIGURATION (Optional):"
echo "   1. Get Google Maps API key: https://developers.google.com/maps"
echo "   2. Update NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in apps/frontend/.env.local"
echo ""
echo "🚀 TO START THE APPLICATION:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Development Mode (Both services):"
echo "   npm run dev"
echo ""
echo "🔄 Or start services separately:"
echo "   Backend:  cd apps/backend && npm run dev"
echo "   Frontend: cd apps/frontend && npm run dev"
echo ""
echo "🌐 APPLICATION ACCESS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   🖥️  Frontend: http://localhost:3000"
echo "   🔌 Backend API: http://localhost:5001"
echo "   📊 Health Check: http://localhost:5001/api/health"
echo ""
echo "👨‍� SUPER ADMIN LOGIN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   📧 Email: superadmin@example.com"
echo "   🔑 Password: SuperAdmin123!"
echo ""
echo "🔑 DEFAULT LOGIN CREDENTIALS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   👨‍💼 Admin: admin@example.com / password123"
echo "   👤 User: user@example.com / password123"
echo ""
echo "🎯 FEATURES AVAILABLE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ✅ Real-time Collaboration (Socket.IO)"
echo "   ✅ Offline Mode (IndexedDB)"
echo "   ✅ Payment Processing (Stripe/PayPal)"
echo "   ✅ Advanced Analytics & Reporting"
echo "   ✅ Multi-language Support (i18n)"
echo "   ✅ E-Signature Capture"
echo "   ✅ GPS Location Tagging"
echo "   ✅ Media Capture (Photo/Audio/Video)"
echo "   ✅ QR Code Scanning"
echo "   ✅ Super Admin Management"
echo "   ✅ Approval Workflows"
echo ""
echo "�️  MONGODB MANAGEMENT:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   🛑 Stop MongoDB: docker stop form-app-mongo"
echo "   🔄 Restart MongoDB: docker start form-app-mongo"
echo "   🗑️  Remove MongoDB: docker rm form-app-mongo"
echo ""
echo "📚 For detailed feature documentation, see FEATURES_IMPLEMENTATION.md"
echo ""
echo "🎉 Happy coding! 🚀" 