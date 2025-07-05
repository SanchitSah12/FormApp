# Construction Payroll Onboarding System

A comprehensive monorepo application for streamlining construction payroll and time tracking customer onboarding with dynamic forms, conditional logic, and robust data management.

## 🏗️ Architecture

This is a monorepo containing:

- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: Next.js with TypeScript and Shadcn UI
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Local file system with multer

## 🚀 Features

### Core Features
- **Dynamic Form Templates**: Create and manage form templates without redeployment
- **Conditional Logic**: Show/hide fields based on previous selections
- **File Upload Support**: Handle documents, images, and help files
- **Progress Tracking**: Real-time completion percentage tracking
- **Multi-section Forms**: Organized form sections with navigation
- **Data Export**: CSV and Excel export capabilities
- **Help System**: Contextual help text and downloadable resources

### User Roles
- **Admin**: Create templates, manage users, view all responses
- **User**: Fill out forms, save progress, submit responses

### Technical Features
- **Template-driven**: JSON-based form structure stored in MongoDB
- **Flexible Data Storage**: Dynamic response storage without schema changes
- **Authentication**: JWT-based authentication with role management
- **File Management**: Secure file upload and storage
- **API Documentation**: RESTful API with comprehensive endpoints

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 4.4+
- Git

## 🛠️ Quick Setup

### Automated Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd construction-payroll-onboarding
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

   This script will:
   - Start MongoDB using Docker
   - Install all dependencies
   - Create environment files
   - Seed the database with sample data

3. **Start the development servers**
   ```bash
   npm run dev
   ```

### Manual Setup

If you prefer manual setup or the script doesn't work:

1. **Install dependencies**
   ```bash
   npm install
   npm run install:all
   ```

2. **Start MongoDB**
   ```bash
   # Using Docker (recommended)
   docker run -d -p 27017:27017 --name construction-payroll-mongo mongo:latest
   
   # Or using local MongoDB service
   sudo systemctl start mongod
   ```

3. **Create environment files**
   
   Backend (`apps/backend/.env`):
   ```bash
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/construction-payroll-onboarding
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   ```

   Frontend (`apps/frontend/.env.local`):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

4. **Seed the database**
   ```bash
   cd apps/backend && npm run seed
   ```

5. **Start the applications**
   ```bash
   npm run dev
   ```

## 🏃‍♂️ Usage

### Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Default Admin Setup

Create an admin user by making a POST request to `/api/auth/register`:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Sample Template

The system includes a comprehensive construction payroll onboarding template with the following sections:

1. **Company Information**: Basic company details and contact information
2. **Payroll Setup**: Payroll frequency, overtime rules, union/prevailing wage settings
3. **Time Tracking Setup**: Time tracking methods, job costing, location tracking
4. **ERP Integration**: Integration with existing ERP systems
5. **Compliance & Reporting**: State requirements, workers' comp, certified payroll
6. **Additional Information**: Special requirements, training needs, go-live date

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| GET | `/api/auth/users` | Get all users (admin) |
| PUT | `/api/auth/users/:id/status` | Update user status (admin) |

### Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | Get all templates |
| GET | `/api/templates/:id` | Get template by ID |
| POST | `/api/templates` | Create template (admin) |
| PUT | `/api/templates/:id` | Update template (admin) |
| DELETE | `/api/templates/:id` | Delete template (admin) |
| PATCH | `/api/templates/:id/toggle-active` | Toggle template status (admin) |
| POST | `/api/templates/:id/clone` | Clone template (admin) |

### Response Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/responses/my-responses` | Get user's responses |
| GET | `/api/responses/:id` | Get specific response |
| POST | `/api/responses` | Save/update response |
| POST | `/api/responses/:id/submit` | Submit response |
| GET | `/api/responses` | Get all responses (admin) |
| PATCH | `/api/responses/:id/status` | Update response status (admin) |
| DELETE | `/api/responses/:id` | Delete response (admin) |

### Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exports/csv` | Export responses as CSV |
| GET | `/api/exports/excel` | Export responses as Excel |
| GET | `/api/exports/template/:id/json` | Export template as JSON |
| GET | `/api/exports/stats` | Export statistics |

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/single` | Upload single file |
| POST | `/api/uploads/multiple` | Upload multiple files |
| POST | `/api/uploads/help` | Upload help files |
| DELETE | `/api/uploads/:filename` | Delete file |
| GET | `/api/uploads/info/:filename` | Get file info |

## 🎨 Frontend Structure

The frontend is built with Next.js 14 using the App Router and includes:

- **Shadcn UI**: Modern, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe development
- **React Hook Form**: Form handling with validation
- **Axios**: HTTP client for API communication

### Key Components

- **Dynamic Form Renderer**: Renders forms based on template structure
- **Conditional Logic Engine**: Shows/hides fields based on conditions
- **File Upload Components**: Drag-and-drop file upload with progress
- **Progress Tracking**: Visual progress indicators
- **Export Functions**: CSV/Excel export with download

## 🗃️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  companyName: String,
  role: String, // 'admin' | 'user'
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Templates Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String, // 'construction' | 'payroll' | 'general'
  sections: [
    {
      id: String,
      title: String,
      description: String,
      fields: [
        {
          id: String,
          type: String,
          label: String,
          required: Boolean,
          options: [{ value: String, label: String }],
          conditionalLogic: {
            dependsOn: String,
            condition: String,
            value: Mixed
          }
        }
      ]
    }
  ],
  isActive: Boolean,
  version: Number,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Responses Collection
```javascript
{
  _id: ObjectId,
  templateId: ObjectId,
  userId: ObjectId,
  responses: Object, // Dynamic JSON structure
  status: String, // 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected'
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId,
  reviewNotes: String,
  completionPercentage: Number,
  currentSection: String,
  uploadedFiles: [
    {
      fieldId: String,
      originalName: String,
      filename: String,
      path: String,
      size: Number,
      mimetype: String,
      uploadedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- File upload validation
- CORS configuration
- Input validation with Joi
- Helmet.js security headers

## 📊 Data Export

The system supports multiple export formats:

- **CSV Export**: Flattened data structure for easy analysis
- **Excel Export**: Formatted spreadsheets with auto-sizing
- **JSON Export**: Template structures for backup/migration
- **Statistics Export**: Summary data and analytics

## 🚀 Deployment

### Backend Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Start the production server: `npm start`

### Frontend Deployment

1. Build the Next.js application: `npm run build`
2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

### Database

- Use MongoDB Atlas for production
- Set up proper indexing for performance
- Configure backup and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions
   - Ensure supported file types

3. **Authentication Problems**
   - Verify JWT secret configuration
   - Check token expiration
   - Validate user roles

### Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the API endpoints

## 🔄 Future Enhancements

- Email notifications for form submissions
- Advanced analytics and reporting
- Multi-language support
- Mobile app for form completion
- Integration with popular construction software
- Advanced workflow automation
- Real-time collaboration features 