# Lease Management System

A comprehensive lease management system built with React and Node.js/Express.

## Features

- **Project Management**: Create and manage property projects
- **Unit Management**: Track individual units within projects
- **Lease Management**: Manage lease agreements with tenants
- **Tenant Management**: Maintain tenant records and information
- **Owner Management**: Track property owners and their units
- **Dashboard**: Real-time statistics and analytics
- **Activity Logs**: Track all system activities

## Tech Stack

### Frontend
- React 19
- React Router
- Axios for API calls

### Backend
- Node.js
- Express.js
- MySQL (mysql2)
- JWT for authentication
- Multer for file uploads
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Database Setup

1. Create a MySQL database:
```sql
mysql -u root -p
```

2. Import the database schema:
```bash
mysql -u root -p < lease_management_system.sql
```

Or run the SQL file in your MySQL client.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lease_management_system
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

4. Start the backend server:
```bash
node server.js
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=https://lms-iac2-git-master-sanketg367-gmailcoms-projects.vercel.app/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Units
- `GET /api/units` - Get all units
- `GET /api/units/:id` - Get unit by ID
- `POST /api/units` - Create new unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Leases
- `GET /api/leases` - Get all leases
- `GET /api/leases/:id` - Get lease by ID
- `POST /api/leases` - Create new lease
- `PUT /api/leases/:id` - Update lease
- `DELETE /api/leases/:id` - Delete lease

### Tenants
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Owners
- `GET /api/owners` - Get all owners
- `GET /api/owners/:id` - Get owner by ID
- `POST /api/owners` - Create new owner
- `PUT /api/owners/:id` - Update owner
- `DELETE /api/owners/:id` - Delete owner

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Activity Logs
- `GET /api/activity-logs` - Get activity logs

## Default Admin Account

After importing the database, you can use:
- Email: `admin@example.com`
- Password: `admin123`

**Note**: Make sure to change the default password after first login!

## Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Install dependencies: `npm install`
3. Start the server: `node server.js` or use PM2: `pm2 start server.js`

### Frontend Deployment

1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting platform
3. Set `REACT_APP_API_URL` to your backend API URL

## Project Structure

```
lms/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── unitController.js
│   │   ├── leaseController.js
│   │   ├── tenantController.js
│   │   ├── ownerController.js
│   │   ├── dashboardController.js
│   │   └── activityLogController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── unitRoutes.js
│   │   ├── leaseRoutes.js
│   │   ├── tenantRoutes.js
│   │   ├── ownerRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── activityLogRoutes.js
│   ├── middleware/
│   ├── uploads/
│   └── server.js
├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── Login/
│   │   └── ...
│   ├── services/
│   │   └── api.js
│   └── App.js
├── lease_management_system.sql
└── package.json
```

## License

This project is proprietary software.

## Support

For issues or questions, please contact the development team.
