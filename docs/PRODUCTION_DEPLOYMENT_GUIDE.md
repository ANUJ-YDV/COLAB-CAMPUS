# 🚀 Production Deployment Guide - COLAB CAMPUS

## ✅ Environment Setup Complete

### What Was Done

1. ✅ **Environment Variable Templates Created**
   - `server/.env.example` - Development configuration
   - `server/.env.production` - Production template
   - `client/.env.example` - Development configuration  
   - `client/.env.production` - Production template

2. ✅ **Production Build Created**
   - React app compiled successfully
   - Optimized bundle created in `client/build/`
   - File size: 173.85 kB (gzipped)

3. ✅ **GitIgnore Updated**
   - All `.env` files excluded from Git
   - `.env.local`, `.env.development`, `.env.production` protected

---

## 📋 Pre-Deployment Checklist

### Backend (Server) Setup

#### 1. **Generate Secure JWT Secret**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output to your production `JWT_SECRET`

#### 2. **MongoDB Atlas Setup**
1. Go to https://cloud.mongodb.com
2. Create a new cluster (free tier available)
3. Add database user (Database Access → Add New User)
4. Whitelist your server IP (Network Access → Add IP Address)
5. Get connection string: Clusters → Connect → Connect your application
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/colab-campus-prod?retryWrites=true&w=majority
   ```

#### 3. **AWS S3 Configuration**
- ✅ Access Key ID: Already configured
- ✅ Secret Access Key: Already configured
- ✅ Bucket: `collabcampus-storage`
- ✅ Region: `ap-south-1`
- ⚠️ **IMPORTANT**: Rotate AWS credentials before production

#### 4. **Server Environment Variables**
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/colab-campus-prod
JWT_SECRET=<your_64_character_random_secret>
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=collabcampus-storage
FRONTEND_URL=https://your-frontend-domain.vercel.app
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
SOCKET_CORS_ORIGIN=https://your-frontend-domain.vercel.app
GITHUB_TOKEN=<your_github_token>
```

### Frontend (Client) Setup

#### 1. **Client Environment Variables**
```env
REACT_APP_API_URL=https://your-backend-service.onrender.com
REACT_APP_SOCKET_URL=https://your-backend-service.onrender.com
REACT_APP_ENABLE_GITHUB=true
REACT_APP_ENABLE_S3_UPLOAD=true
REACT_APP_ENV=production
```

---

## 🌐 Deployment Options

### Backend Deployment

#### Option 1: Render.com (Recommended - Free Tier)

1. **Create Account**: https://render.com
2. **New Web Service**:
   - Connect GitHub repository
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   
3. **Environment Variables** (Dashboard → Environment):
   ```
   PORT=5000
   NODE_ENV=production
   MONGO_URI=<your_atlas_connection_string>
   JWT_SECRET=<your_secure_secret>
   AWS_ACCESS_KEY_ID=<key>
   AWS_SECRET_ACCESS_KEY=<secret>
   AWS_REGION=ap-south-1
   AWS_BUCKET_NAME=collabcampus-storage
   FRONTEND_URL=<your_vercel_url>
   CLIENT_ORIGIN=<your_vercel_url>
   SOCKET_CORS_ORIGIN=<your_vercel_url>
   ```

4. **Advanced Settings**:
   - Health check path: `/api/health` (create this endpoint)
   - Auto-deploy: Yes

5. **Copy your Render URL**: `https://your-app.onrender.com`

#### Option 2: Railway.app

1. **Create Account**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Settings → Variables**: Add all environment variables
4. **Settings → Domains**: Get your Railway domain

#### Option 3: Heroku

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli
2. **Commands**:
   ```bash
   cd server
   heroku login
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set MONGO_URI=<your_mongo_uri>
   heroku config:set JWT_SECRET=<your_secret>
   # Add all other environment variables
   git push heroku master
   ```

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from Client Directory**:
   ```bash
   cd client
   vercel
   ```

3. **Set Environment Variables** (Dashboard):
   - Project → Settings → Environment Variables
   - Add all `REACT_APP_*` variables
   - Use your Render backend URL for `REACT_APP_API_URL`

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

#### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   cd client
   netlify deploy --prod
   ```

3. **Environment Variables**:
   - Site settings → Build & deploy → Environment
   - Add all `REACT_APP_*` variables

#### Option 3: GitHub Pages

1. **Update `package.json`**:
   ```json
   {
     "homepage": "https://your-username.github.io/COLAB-CAMPUS"
   }
   ```

2. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add Scripts**:
   ```json
   {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

---

## 🔧 Post-Deployment Configuration

### 1. **Update CORS on Backend**

Ensure your backend allows requests from your frontend domain:

```javascript
// server/server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
```

### 2. **Socket.io Configuration**

Update Socket.io CORS:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});
```

### 3. **MongoDB Atlas IP Whitelist**

1. Go to MongoDB Atlas → Network Access
2. Add your hosting platform's IP ranges:
   - **Render.com**: Add `0.0.0.0/0` (or specific IPs)
   - **Railway**: Check their documentation for IP ranges
   - **Heroku**: Add `0.0.0.0/0` for dynamic IPs

### 4. **Health Check Endpoint** (Optional but Recommended)

Add to `server/server.js`:

```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

---

## 🧪 Testing Your Deployment

### 1. **Test Backend**
```bash
curl https://your-backend.onrender.com/api/health
```

### 2. **Test Frontend**
- Open `https://your-app.vercel.app`
- Check browser console for errors
- Test login functionality
- Test Socket.io connection

### 3. **Test Socket.io**
- Open browser DevTools → Network → WS
- Look for websocket connection
- Should see `Socket.io` connection established

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Rotate AWS credentials (they were exposed in chat)
- [ ] Enable AWS MFA
- [ ] Use strong JWT secret (64+ characters)
- [ ] MongoDB Atlas: Restrict IP access
- [ ] Enable MongoDB authentication
- [ ] Use environment variables (never hardcode secrets)
- [ ] Add rate limiting to API endpoints
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Review CORS settings
- [ ] Add input validation/sanitization
- [ ] Set secure HTTP headers (helmet.js)

### Security Implementation

1. **Install Security Packages**:
   ```bash
   cd server
   npm install helmet express-rate-limit express-mongo-sanitize
   ```

2. **Add to server.js**:
   ```javascript
   const helmet = require('helmet');
   const rateLimit = require('express-rate-limit');
   const mongoSanitize = require('express-mongo-sanitize');

   app.use(helmet());
   app.use(mongoSanitize());

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });

   app.use('/api/', limiter);
   ```

---

## 📊 Monitoring & Logs

### Backend Monitoring

1. **Render.com**:
   - Dashboard → Logs (real-time)
   - Dashboard → Metrics (CPU, Memory)

2. **Railway**:
   - Project → Observability → Logs

3. **Heroku**:
   ```bash
   heroku logs --tail
   ```

### Frontend Monitoring

1. **Vercel**:
   - Dashboard → Deployments → View Function Logs
   - Real-time analytics

2. **Sentry (Recommended for Error Tracking)**:
   ```bash
   npm install @sentry/react
   ```

---

## 🚀 Continuous Deployment (CI/CD)

Your GitHub Actions workflow (`.github/workflows/ci-cd.yml`) will:
- ✅ Run tests on every push
- ✅ Run linting checks
- ✅ Generate coverage reports
- ✅ Verify build succeeds

To enable auto-deployment:

1. **Vercel**: Connect GitHub repository (auto-deploys on push)
2. **Render**: Enable auto-deploy in dashboard
3. **Railway**: Automatic on push to main branch

---

## 📝 Environment Variable Reference

### Server (.env)

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `PORT` | `5000` | ✅ | Server port |
| `NODE_ENV` | `production` | ✅ | Environment |
| `MONGO_URI` | `mongodb+srv://...` | ✅ | Database connection |
| `JWT_SECRET` | `<64-char-secret>` | ✅ | Auth token secret |
| `AWS_ACCESS_KEY_ID` | `AKIAIOSFODNN7EXAMPLE` | ✅ | S3 access |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG/...` | ✅ | S3 secret |
| `AWS_REGION` | `ap-south-1` | ✅ | S3 region |
| `AWS_BUCKET_NAME` | `collabcampus-storage` | ✅ | S3 bucket |
| `FRONTEND_URL` | `https://app.vercel.app` | ✅ | CORS origin |
| `GITHUB_TOKEN` | `ghp_...` | ⚠️ | Optional feature |

### Client (.env)

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `REACT_APP_API_URL` | `https://api.onrender.com` | ✅ | Backend URL |
| `REACT_APP_SOCKET_URL` | `https://api.onrender.com` | ✅ | Socket.io URL |
| `REACT_APP_ENV` | `production` | ⚠️ | Environment flag |
| `REACT_APP_ENABLE_GITHUB` | `true` | ⚠️ | Feature flag |

---

## 🎯 Quick Deploy Commands

### Full Deployment

```bash
# 1. Build frontend
cd client
npm run build

# 2. Test backend locally
cd ../server
npm start

# 3. Deploy backend (Render)
# Push to GitHub, Render auto-deploys

# 4. Deploy frontend (Vercel)
cd ../client
vercel --prod

# 5. Update frontend env with backend URL
# Vercel Dashboard → Settings → Environment Variables
# Add: REACT_APP_API_URL=https://your-backend.onrender.com
# Redeploy

# 6. Test deployment
curl https://your-backend.onrender.com/api/health
```

---

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Backend health check returns 200
- ✅ Frontend loads without errors
- ✅ Users can register/login
- ✅ Socket.io connection established
- ✅ File uploads work (S3)
- ✅ GitHub integration works
- ✅ Real-time features work (presence, typing)
- ✅ No CORS errors in console
- ✅ MongoDB connection successful

---

## 🆘 Troubleshooting

### Issue: CORS Errors

**Solution**: Update `FRONTEND_URL` in backend env variables

### Issue: Socket.io Not Connecting

**Solution**: 
1. Check `REACT_APP_SOCKET_URL` matches backend URL
2. Verify `SOCKET_CORS_ORIGIN` on backend

### Issue: MongoDB Connection Failed

**Solution**:
1. Check MongoDB Atlas IP whitelist
2. Verify connection string format
3. Check user permissions

### Issue: 500 Server Error

**Solution**:
1. Check backend logs
2. Verify all environment variables are set
3. Check MongoDB connection

### Issue: Build Failed

**Solution**:
1. Run `npm install` in both client and server
2. Check Node.js version compatibility
3. Clear cache: `npm cache clean --force`

---

## 📚 Additional Resources

- [Render Deployment Docs](https://render.com/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Socket.io Deployment](https://socket.io/docs/v4/deployment)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🎉 Congratulations!

Your COLAB CAMPUS application is ready for production deployment with:
- ✅ Environment variables configured
- ✅ Production build created
- ✅ Security checklist provided
- ✅ Multiple deployment options documented
- ✅ Monitoring and logging setup
- ✅ CI/CD pipeline ready

**Next Steps**: Choose your hosting platforms and follow the deployment guides above!
