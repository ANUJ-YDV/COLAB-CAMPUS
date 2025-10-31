# 🚀 LOCAL LAUNCH GUIDE - COLAB CAMPUS

**Complete Step-by-Step Instructions to Launch & Use Locally**

---

## 📋 Prerequisites Check

Before starting, ensure you have:

- ✅ **Node.js** v16+ installed ([Download](https://nodejs.org/))
- ✅ **npm** v8+ (comes with Node.js)
- ✅ **MongoDB Atlas** account (cloud database) OR local MongoDB
- ✅ **AWS Account** (for S3 file uploads)
- ✅ **Git** installed (for version control)
- ✅ **Code Editor** (VS Code recommended)

**Verify Installation**:
```powershell
node --version    # Should show v16.x.x or higher
npm --version     # Should show 8.x.x or higher
```

---

## 🔧 STEP 1: Install Dependencies

### Backend Dependencies

```powershell
# Navigate to server folder
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"

# Install ALL required dependencies
npm install bcrypt@^5.1.1 cors@^2.8.5 jsonwebtoken@^9.0.2 socket.io@^4.8.1 @aws-sdk/client-s3@^3.920.0 @aws-sdk/s3-request-presigner@^3.920.0 axios@^1.13.1 winston@^3.18.3 quill@^2.0.3 react-quill@^2.0.0 nodemon@^3.0.3

# Verify installation
npm list --depth=0
```

**Expected Output**: Should show all packages installed without errors

### Frontend Dependencies

```powershell
# Navigate to client folder
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"

# Install missing dependencies
npm install socket.io-client@^4.8.1 react-quill@^2.0.0 axios@^1.13.1

# Verify installation
npm list --depth=0
```

**Time Required**: 2-3 minutes (depending on internet speed)

---

## 🔐 STEP 2: Configure Environment Variables

### Server Environment (.env)

**File Location**: `server/.env`

**Current Status**: ⚠️ Needs AWS credentials

**Action Required**:

1. **Open** `server/.env` in your editor

2. **Add AWS Credentials** (replace placeholders):

```env
# AWS S3 Configuration (REQUIRED)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE      # Replace with your key
AWS_SECRET_ACCESS_KEY=wJalrXUt...EXAMPLE     # Replace with your secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=collabcampus-storage
```

**How to Get AWS Credentials**:

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **IAM** > **Users** > Your User
3. Click **Security Credentials** tab
4. Click **Create Access Key**
5. Choose: **Application running outside AWS**
6. Copy **Access Key ID** and **Secret Access Key**
7. Paste into `.env` file

**Complete .env File Should Look Like**:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - MongoDB Atlas
MONGO_URI=mongodb+srv://admin_myproject:04%40Nu%2302@cluster0.vpgck88.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Authentication
JWT_SECRET=mySuperSecretKey123

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=collabcampus-storage

# GitHub Integration (Optional)
GITHUB_TOKEN=

# CORS & Frontend
FRONTEND_URL=http://localhost:3000
CLIENT_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### Client Environment (.env)

**File Location**: `client/.env`

**Current Status**: ✅ Already configured

**Verify it contains**:

```env
DISABLE_ESLINT_PLUGIN=true
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_ENABLE_GITHUB=true
REACT_APP_ENABLE_S3_UPLOAD=true
REACT_APP_ENV=development
```

---

## 🗄️ STEP 3: Verify MongoDB Connection

**Your MongoDB Atlas is already configured!** ✅

Let's verify the connection:

```powershell
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"

# Quick connection test
node -e "import('dotenv').then(d => { d.default.config(); import('mongoose').then(m => m.default.connect(process.env.MONGO_URI).then(() => { console.log('✅ MongoDB Connected Successfully!'); process.exit(0); }).catch(e => { console.error('❌ MongoDB Error:', e.message); process.exit(1); })); })"
```

**Expected Output**: `✅ MongoDB Connected Successfully!`

**If Connection Fails**:
1. Check internet connection
2. Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)
3. Check username/password in connection string

---

## 🚀 STEP 4: Launch the Application

### Terminal Setup

You'll need **TWO PowerShell terminals** running simultaneously.

### Terminal 1: Backend Server

```powershell
# Navigate to server folder
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"

# Start the backend server
npm start
```

**Expected Output**:
```
Environment variables loaded:
MONGO_URI: ✓ Loaded
PORT: 5000
JWT_SECRET: ✓ Loaded
AWS_REGION: ✓ Loaded
AWS_BUCKET_NAME: ✓ Loaded

🔍 Environment Variable Check
══════════════════════════════════════════════════
✅ All required environment variables are present

✅ MongoDB connected
🚀 Server and Socket.io running on port 5000
```

**If You See Errors**:
- ❌ `EADDRINUSE: address already in use :::5000`
  - **Fix**: Kill process using port 5000
  ```powershell
  # Find process
  netstat -ano | findstr :5000
  
  # Kill it (replace PID)
  taskkill /PID <PID> /F
  ```

- ❌ `AWS_ACCESS_KEY_ID is missing`
  - **Fix**: Add AWS credentials to `.env` file

- ❌ `MongoDB connection error`
  - **Fix**: Check internet connection and MongoDB Atlas settings

**Keep this terminal running!** ✋

---

### Terminal 2: Frontend React App

```powershell
# Open NEW PowerShell terminal
# Navigate to client folder
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"

# Start the React development server
npm start
```

**Expected Output**:
```
Compiled successfully!

You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

**Browser Opens Automatically** to `http://localhost:3000`

**If Browser Doesn't Open**:
- Manually open: http://localhost:3000

**If You See Errors**:
- ❌ Port 3000 already in use
  - **Fix**: Kill process or use different port
  ```powershell
  $env:PORT=3001; npm start
  ```

**Keep this terminal running too!** ✋

---

## 🧪 STEP 5: Test the Application

### 5.1 Test Backend API

**Open new PowerShell terminal** (Terminal 3):

```powershell
# Test health endpoint
curl http://localhost:5000/api/health

# Test root endpoint
curl http://localhost:5000/
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T...",
  "uptime": 5.234,
  "environment": "development"
}
```

### 5.2 Test Frontend

**Browser should show**: Login/Signup page at `http://localhost:3000`

**Test Registration**:
1. Click **Sign Up**
2. Enter:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Click **Register**

**Expected**: Success message, redirected to login

**Test Login**:
1. Enter email: `test@example.com`
2. Enter password: `password123`
3. Click **Login**

**Expected**: Redirected to dashboard/project list

### 5.3 Test Socket.io Connection

**Open Browser Console** (F12):

Look for:
```
Socket.io connected: true
Socket ID: abc123...
```

**If Socket.io Not Connected**:
- Check backend terminal for Socket.io startup message
- Verify `REACT_APP_SOCKET_URL` in client `.env`

---

## 🎨 STEP 6: Explore Features

### Feature 1: Create a Project

1. Click **New Project** or **Create Project**
2. Enter:
   - Project Name: `My First Project`
   - Description: `Testing the app`
3. Click **Create**

**Expected**: New project appears in project list

### Feature 2: Kanban Board (Task Management)

1. Click on your project
2. You should see 3 columns: **To Do**, **In Progress**, **Done**
3. Click **Add Task** in "To Do" column
4. Enter task details:
   - Title: `Test Task`
   - Description: `This is a test`
5. Click **Create**

**Test Drag & Drop**:
- Drag the task to "In Progress" column
- Should update in real-time

### Feature 3: Real-Time Presence (Who's Online)

**Open second browser window** (incognito/private mode):
1. Go to `http://localhost:3000`
2. Sign up with different email: `test2@example.com`
3. Login
4. Join the same project

**In Original Window**:
- You should see "Test2 User is online" notification
- Online users count should update

### Feature 4: File Upload (S3)

**⚠️ Requires AWS credentials configured**

1. In project view, find file upload section
2. Click **Upload File**
3. Select a file (image, PDF, etc.)
4. Click **Upload**

**Expected**: 
- File uploads to S3
- Download link appears
- File accessible via presigned URL

**If Upload Fails**:
- Check AWS credentials in `.env`
- Verify S3 bucket exists: `collabcampus-storage`
- Check S3 bucket permissions (public read)

### Feature 5: Collaborative Document Editing

1. Navigate to project
2. Click **Notes** or **Documents**
3. Start typing in the editor

**Open second browser window**:
1. Login with different user
2. Open same document
3. Start typing

**Expected**: Both users see each other's changes in real-time

### Feature 6: GitHub Repository Integration

**⚠️ Requires GITHUB_TOKEN in .env**

1. Add GitHub token to `server/.env`:
   ```env
   GITHUB_TOKEN=ghp_yourtokenhere
   ```
2. Restart backend server (Ctrl+C, then `npm start`)
3. In project settings, enter GitHub repo:
   - Repository: `owner/repo-name`
4. Click **Connect**

**Expected**: Recent commits appear in project timeline

---

## 🔍 STEP 7: Verify All Components

### Backend Health Check

**Terminal Command**:
```powershell
curl http://localhost:5000/api/health
```

**Should Return**:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123.45,
  "environment": "development"
}
```

### Frontend Build Verification

**Terminal Command**:
```powershell
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"
npm run build
```

**Expected**: Build completes successfully (already done, but verify)

### Database Verification

**Check MongoDB Atlas Dashboard**:
1. Go to https://cloud.mongodb.com
2. Click your cluster
3. Click **Browse Collections**
4. You should see:
   - `users` collection (with test users)
   - `projects` collection
   - `tasks` collection
   - etc.

---

## 🐛 Troubleshooting Guide

### Problem: Backend Won't Start

**Symptoms**: 
- Error: `Cannot find module 'bcrypt'`
- Error: `Cannot find module 'socket.io'`

**Solution**:
```powershell
cd server
rm -r node_modules
rm package-lock.json
npm install
```

### Problem: Frontend Shows Blank Page

**Symptoms**: White screen, no content

**Solution**:
1. Check browser console for errors (F12)
2. Verify backend is running (`curl http://localhost:5000`)
3. Check CORS settings in `server/server.js`

### Problem: Socket.io Not Connecting

**Symptoms**: Real-time features don't work

**Solution**:
1. Check backend logs for Socket.io startup
2. Verify `REACT_APP_SOCKET_URL=http://localhost:5000` in `client/.env`
3. Check browser console for connection errors

### Problem: File Upload Fails

**Symptoms**: Upload button doesn't work or errors

**Solution**:
1. Add AWS credentials to `server/.env`
2. Verify S3 bucket exists
3. Check S3 bucket CORS configuration
4. Restart backend server

### Problem: MongoDB Connection Error

**Symptoms**: `MongooseServerSelectionError`

**Solutions**:
1. Check internet connection
2. Verify MongoDB Atlas IP whitelist:
   - Go to Atlas Dashboard
   - Network Access
   - Add IP: `0.0.0.0/0` (for testing)
3. Check connection string format
4. Verify username/password don't contain special characters (if they do, URL encode them)

---

## 📊 Development Workflow

### Daily Development

```powershell
# Start backend (Terminal 1)
cd server
npm run dev    # Uses nodemon for auto-restart

# Start frontend (Terminal 2)
cd client
npm start
```

### Making Changes

**Backend Changes**:
- Edit files in `server/`
- Server auto-restarts (if using `npm run dev`)
- Check terminal for errors

**Frontend Changes**:
- Edit files in `client/src/`
- Browser auto-refreshes (hot reload)
- Check browser console for errors

### Running Tests

```powershell
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

---

## 📝 Quick Reference

### Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | React app |
| Backend API | http://localhost:5000 | REST API |
| Health Check | http://localhost:5000/api/health | Server status |
| MongoDB Atlas | https://cloud.mongodb.com | Database management |
| AWS Console | https://console.aws.amazon.com | S3 bucket management |

### Important Commands

```powershell
# Backend
cd server
npm start          # Start production server
npm run dev        # Start with nodemon (auto-restart)
npm test           # Run tests

# Frontend
cd client
npm start          # Start development server
npm run build      # Create production build
npm test           # Run tests

# Stop Servers
Ctrl + C           # In terminal running the server
```

### Important Files

| File | Purpose |
|------|---------|
| `server/.env` | Backend environment variables |
| `client/.env` | Frontend environment variables |
| `server/server.js` | Main backend entry point |
| `client/src/App.jsx` | Main React component |
| `server/models/` | Database schemas |
| `client/src/components/` | React components |

---

## 🎯 What to Test

### Critical Features

- [ ] User registration and login
- [ ] Create a new project
- [ ] Add tasks to Kanban board
- [ ] Drag and drop tasks between columns
- [ ] Real-time updates (two browsers)
- [ ] Online user presence
- [ ] Typing indicators
- [ ] File upload to S3
- [ ] Download uploaded files
- [ ] Collaborative document editing
- [ ] GitHub repository integration (if token added)

### Real-Time Features

**Test with Two Browser Windows**:
1. Open Chrome normally
2. Open Chrome Incognito mode
3. Login with different users in each
4. Join same project
5. Make changes in one window
6. Verify changes appear in other window

---

## 🚦 Success Indicators

Your setup is successful when:

- ✅ Both terminals running without errors
- ✅ Backend shows "MongoDB connected" and "Server running on port 5000"
- ✅ Frontend opens at http://localhost:3000
- ✅ Can register and login users
- ✅ Can create projects and tasks
- ✅ Drag and drop works
- ✅ Socket.io shows "connected" in browser console
- ✅ File uploads work (if AWS configured)
- ✅ Real-time updates work across multiple browsers

---

## 📚 Additional Resources

### Documentation
- **Project Diagnostic Report**: `PROJECT_DIAGNOSTIC_REPORT.md`
- **Deployment Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Backend Config**: `BACKEND_DEPLOYMENT_CONFIG.md`

### External Documentation
- [Node.js Docs](https://nodejs.org/docs/)
- [React Docs](https://react.dev/)
- [Socket.io Docs](https://socket.io/docs/)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)

---

## 🎉 You're Ready!

**Your local development environment is set up!**

### Quick Start (After Initial Setup):

```powershell
# Terminal 1: Backend
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm run dev

# Terminal 2: Frontend
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"
npm start
```

**Open Browser**: http://localhost:3000

**Start Building!** 🚀

---

**Questions or Issues?**
- Check `PROJECT_DIAGNOSTIC_REPORT.md` for known issues
- Check troubleshooting section above
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
