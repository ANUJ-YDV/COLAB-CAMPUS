# 🚀 Backend Deployment Configuration - Complete

## ✅ What Was Configured

### 1. **Start Scripts** (Already Correct)
Your `server/package.json` already has the correct scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "cross-env NODE_ENV=test jest --runInBand",
    "prestart": "npm run check-env"
  }
}
```

✅ **Perfect for deployment!**

### 2. **CORS Configuration** ✅ UPDATED

**Location**: `server/server.js` (lines 40-47)

```javascript
// Configure CORS with environment variable
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

**Benefits**:
- ✅ Reads from `FRONTEND_URL` environment variable
- ✅ Falls back to `CLIENT_ORIGIN` for backward compatibility
- ✅ Defaults to `localhost:3000` for development
- ✅ Supports credentials (cookies, auth headers)
- ✅ Explicitly allows all necessary HTTP methods

### 3. **Static File Serving** ✅ ADDED

**Location**: `server/server.js` (lines 82-92)

```javascript
// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}
```

**Benefits**:
- ✅ Only activates in production (`NODE_ENV=production`)
- ✅ Serves React build from `client/build/`
- ✅ Handles React Router client-side routing
- ✅ All unknown routes return `index.html` (SPA behavior)

### 4. **Health Check Endpoint** ✅ ADDED

**Location**: `server/server.js` (line 68)

```javascript
// Health check endpoint for deployment platforms
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});
```

**Usage**:
- Render, Railway, Heroku use this to check if your app is running
- Useful for monitoring and debugging

**Test it**:
```bash
curl http://localhost:5000/api/health
```

### 5. **ES Module __dirname** ✅ FIXED

**Location**: `server/server.js` (lines 26-28)

```javascript
// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

**Why needed**:
- ES Modules (`"type": "module"`) don't have `__dirname`
- Required for serving static files with absolute paths

---

## 📦 Package.json Configuration

### Server (`server/package.json`)

✅ **Already Optimized**:

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",              // ✅ ES Modules enabled
  "main": "server.js",           // ✅ Correct entry point
  "scripts": {
    "start": "node server.js",   // ✅ Production start
    "dev": "nodemon server.js"   // ✅ Development hot-reload
  }
}
```

### Client (`client/package.json`)

✅ **Already Correct**:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",  // ✅ Creates production build
    "test": "react-scripts test"
  }
}
```

---

## 🧪 Testing Deployment Configuration Locally

### Test 1: Backend Only (API Mode)

```powershell
# Terminal 1: Start backend
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm start

# Terminal 2: Test API
curl http://localhost:5000/api/health
curl http://localhost:5000/api/test
```

**Expected Output**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T...",
  "uptime": 5.234,
  "environment": "development"
}
```

### Test 2: Frontend Build (Development Mode)

```powershell
# Terminal 1: Backend running
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm start

# Terminal 2: Serve frontend build
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"
npx serve -s build -p 3000
```

**Open Browser**: http://localhost:3000
- ✅ Frontend loads
- ✅ Can login/register
- ✅ Kanban board works
- ✅ Socket.io connects

### Test 3: Full Production Simulation

```powershell
# Set production environment
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
$env:NODE_ENV="production"
$env:FRONTEND_URL="http://localhost:3000"
npm start
```

**What happens**:
- Backend serves API on `http://localhost:5000/api/*`
- Backend serves React build on `http://localhost:5000/*`
- All frontend routes handled by React Router

**Test**:
```powershell
# Test API
curl http://localhost:5000/api/health

# Test frontend serving
curl http://localhost:5000
# Should return React HTML
```

---

## 🌐 Environment Variables for Production

### Backend `.env` (Production)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/colab-campus-prod

# Authentication
JWT_SECRET=<64-character-secure-random-string>

# AWS S3
AWS_ACCESS_KEY_ID=<your_key>
AWS_SECRET_ACCESS_KEY=<your_secret>
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=collabcampus-storage

# CORS & Frontend
FRONTEND_URL=https://your-app.vercel.app
CLIENT_ORIGIN=https://your-app.vercel.app
SOCKET_CORS_ORIGIN=https://your-app.vercel.app

# GitHub (optional)
GITHUB_TOKEN=<your_token>
```

### Frontend `.env.production`

```env
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
REACT_APP_ENV=production
REACT_APP_ENABLE_GITHUB=true
REACT_APP_ENABLE_S3_UPLOAD=true
```

---

## 📊 Deployment Platform Configuration

### Render.com (Backend)

**Step 1**: Create Web Service
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

**Step 2**: Environment Variables (Dashboard)
```
PORT=5000
NODE_ENV=production
MONGO_URI=<mongodb-atlas-url>
JWT_SECRET=<your-secret>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=collabcampus-storage
FRONTEND_URL=<your-vercel-url>
CLIENT_ORIGIN=<your-vercel-url>
SOCKET_CORS_ORIGIN=<your-vercel-url>
```

**Step 3**: Health Check
- Path: `/api/health`
- Interval: 30 seconds

### Vercel (Frontend)

**Step 1**: Import GitHub Repository
- Framework: Create React App
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `build`

**Step 2**: Environment Variables
```
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
REACT_APP_ENV=production
REACT_APP_ENABLE_GITHUB=true
REACT_APP_ENABLE_S3_UPLOAD=true
```

**Step 3**: Deploy
- Push to GitHub → Auto-deploys
- Get URL: `https://your-app.vercel.app`

---

## 🔄 Deployment Workflow

### Option 1: Separate Deployments (Recommended)

```
Frontend (Vercel) ← HTTP/WebSocket → Backend (Render)
     ↓                                        ↓
React Build                           Node.js + MongoDB
```

**Pros**:
- ✅ Independent scaling
- ✅ Vercel's CDN for frontend (faster)
- ✅ Easier debugging
- ✅ Free tiers available

**Steps**:
1. Deploy backend to Render → Get URL
2. Deploy frontend to Vercel with backend URL
3. Update backend `FRONTEND_URL` with Vercel URL
4. Redeploy backend

### Option 2: Single Deployment (Backend serves frontend)

```
Backend (Render/Railway)
    ↓
Serves both API and React build
```

**Pros**:
- ✅ Single deployment
- ✅ Simpler setup
- ✅ One URL to manage

**Cons**:
- ⚠️ Backend handles static files (slower)
- ⚠️ No CDN benefits

**Setup**:
1. Build React: `cd client && npm run build`
2. Commit `client/build/` to Git
3. Deploy to Render with:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-app.onrender.com
   ```
4. Backend serves React from `client/build/`

---

## ⚡ Performance Optimization

### Backend Optimizations

1. **Enable Compression**:
```bash
npm install compression
```

```javascript
// server/server.js
import compression from 'compression';
app.use(compression());
```

2. **Production Logging**:
```javascript
if (process.env.NODE_ENV === 'production') {
  console.log = () => {}; // Disable verbose logs
}
```

3. **Connection Pooling**:
```javascript
// Already configured in mongoose connection
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```

### Frontend Optimizations

Already done:
- ✅ Code splitting (Create React App)
- ✅ Tree shaking (production build)
- ✅ Minification (173.85 kB gzipped)
- ✅ Asset hashing (cache busting)

---

## 🔍 Troubleshooting

### Issue: Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID 27800 /F

# Or use different port
$env:PORT=5001; npm start
```

### Issue: CORS Errors in Production

**Problem**: Frontend can't reach backend API

**Check**:
1. ✅ `FRONTEND_URL` in backend `.env` matches Vercel URL
2. ✅ `REACT_APP_API_URL` in frontend `.env.production` matches Render URL
3. ✅ Both URLs use HTTPS (not HTTP)

**Fix**:
```javascript
// server/server.js - Allow multiple origins
const allowedOrigins = [
  'https://your-app.vercel.app',
  'https://your-app-preview.vercel.app', // Preview deployments
  'http://localhost:3000' // Development
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

### Issue: Static Files Not Serving

**Problem**: Backend serves API but not React app

**Check**:
1. ✅ `NODE_ENV=production` is set
2. ✅ `client/build/` directory exists
3. ✅ Static route is AFTER API routes

**Fix**: Route order matters!
```javascript
// ✅ CORRECT ORDER
app.use('/api/auth', authRoutes);    // API routes first
app.use('/api/projects', projectRoutes);
// ... all other API routes

app.use(express.static(...));        // Static files last
app.get('*', (req, res) => { ... }); // Catch-all last
```

### Issue: WebSocket Connection Failed

**Problem**: Socket.io can't connect in production

**Check**:
1. ✅ `REACT_APP_SOCKET_URL` matches backend URL
2. ✅ Render doesn't block WebSocket connections
3. ✅ CORS allows WebSocket origin

**Fix**:
```javascript
// server/server.js
const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'], // Allow fallback to polling
  pingTimeout: 60000,
  pingInterval: 25000
});
```

---

## ✅ Pre-Deployment Checklist

### Backend

- [x] `server/package.json` has correct start script
- [x] `server/server.js` uses environment-based CORS
- [x] Health check endpoint added
- [x] Static file serving configured (production)
- [x] ES Module `__dirname` fixed
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables set on hosting platform
- [ ] JWT secret generated (64+ characters)
- [ ] AWS credentials rotated (not from chat)

### Frontend

- [x] Production build created (`npm run build`)
- [x] `client/build/` folder contains optimized assets
- [ ] `.env.production` created with backend URLs
- [ ] Environment variables set on Vercel
- [ ] CORS tested between frontend and backend

### Security

- [ ] JWT secret is strong and unique
- [ ] AWS credentials rotated
- [ ] MongoDB Atlas IP whitelist configured
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Rate limiting enabled (optional)
- [ ] Helmet.js installed for security headers

---

## 🎯 Next Steps

1. **Test Locally** (Right Now):
   ```powershell
   # Terminal 1
   cd server
   npm start

   # Terminal 2
   cd client
   npx serve -s build -p 3000
   ```

2. **Setup MongoDB Atlas** (5 minutes):
   - Create cluster
   - Add database user
   - Get connection string

3. **Deploy Backend** (10 minutes):
   - Render.com
   - Add environment variables
   - Deploy

4. **Deploy Frontend** (5 minutes):
   - Vercel
   - Add backend URL
   - Deploy

5. **Test Production** (5 minutes):
   - Test login
   - Test Kanban board
   - Test Socket.io connection

---

## 📚 Related Documentation

- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `server/.env.example` - Environment variable template
- `server/.env.production` - Production environment template
- `.github/workflows/ci-cd.yml` - CI/CD pipeline

---

**Status**: ✅ Backend deployment configuration complete!
**Build**: ✅ Production build ready (173.85 kB)
**CORS**: ✅ Environment-based configuration
**Static Serving**: ✅ Production-ready
**Health Check**: ✅ Added for monitoring

🚀 **Ready to deploy!**
