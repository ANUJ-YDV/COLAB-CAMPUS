# COLAB CAMPUS - Full Stack MERN Application

A collaborative campus project management application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## ✅ Issues Fixed

1. **Import Casing Issues**: Fixed `User.js` vs `user.js` import mismatch in `authRoutes.js`
2. **Missing Dependencies**: Added `bcrypt`, `cors`, `jsonwebtoken`, and `mongoose` to server dependencies
3. **Invalid React Version**: Downgraded from React 19 to React 18 for compatibility
4. **react-scripts Issue**: Fixed `react-scripts` version from `^0.0.0` to `5.0.1`
5. **TailwindCSS Compatibility**: Downgraded from v4 to v3.4.1 for PostCSS compatibility
6. **Auth UI Logic**: Implemented full authentication flow in Login and Signup pages
7. **API Proxy**: Added proxy configuration to client for backend API calls
8. **Environment Variables**: Cleaned up duplicate `JWT_SECRET` in `.env`

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm
- MongoDB Atlas account (or local MongoDB instance)

### Installation

#### Option 1: Install All at Once
```powershell
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS"
npm run install-all
```

#### Option 2: Manual Installation
```powershell
# Install root dependencies
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS"
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Setup

The server uses environment variables defined in `server/.env`:
- `MONGO_URI`: MongoDB connection string (currently configured for MongoDB Atlas)
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 5000)

**Note**: The `.env` file already exists with MongoDB Atlas credentials. If you need to modify them, edit `server/.env`.

### Running the Application

#### Option 1: Run Both Servers Concurrently (Recommended)
```powershell
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS"
npm run dev
```

#### Option 2: Run Servers Separately

**Terminal 1 - Backend Server:**
```powershell
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm start
```

**Terminal 2 - Frontend Client:**
```powershell
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"
npx react-scripts start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Folder Structure

```
COLAB CAMPUS/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Login page with auth
│   │   │   ├── Signup.jsx     # Signup page with auth
│   │   │   └── Dashboard.jsx  # Protected dashboard
│   │   ├── App.jsx         # Main app component with routing
│   │   └── index.js        # React entry point
│   └── package.json
│
├── server/                 # Express backend
│   ├── models/
│   │   └── user.js         # User model
│   ├── routes/
│   │   └── authRoutes.js   # Authentication routes
│   ├── server.js           # Express server
│   ├── .env                # Environment variables
│   └── package.json
│
└── package.json            # Root package.json with scripts
```

## 🔧 Available Scripts

### Root Directory
- `npm run server` - Start backend server
- `npm run client` - Start frontend client
- `npm run dev` - Run both servers concurrently
- `npm run install-all` - Install all dependencies

### Server Directory
- `npm start` - Start server with Node
- `npm run dev` - Start server with nodemon (auto-reload)

### Client Directory
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔑 Features

- **User Authentication**: Signup and login with JWT tokens
- **Protected Routes**: Dashboard accessible only after login
- **MongoDB Integration**: User data stored in MongoDB Atlas
- **Responsive UI**: TailwindCSS for styling
- **Form Validation**: Client-side validation with error messages
- **Token Management**: JWT tokens stored in localStorage

## 🛠️ Tech Stack

**Frontend:**
- React 18
- React Router DOM v6
- TailwindCSS v3
- Fetch API for HTTP requests

**Backend:**
- Node.js
- Express.js v4
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

## 📝 API Endpoints

### Authentication Routes
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user and get JWT token

### Test Routes
- `GET /` - API status check
- `GET /api/test` - Test endpoint

## ⚠️ Known Warnings

The client may show these warnings (non-critical):
- Unicode BOM warnings in page files (doesn't affect functionality)
- Webpack middleware deprecation warnings (related to react-scripts v5)

## 🔐 Security Notes

- The `.env` file is gitignored to prevent exposing credentials
- JWT secret should be changed in production
- Use HTTPS in production environments
- Implement rate limiting for authentication endpoints in production

## 📄 License

ISC
