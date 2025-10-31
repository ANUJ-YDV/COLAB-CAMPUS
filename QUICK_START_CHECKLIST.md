# ✅ QUICK START CHECKLIST - COLAB CAMPUS

**Use this checklist to launch the app in under 5 minutes!**

---

## 🔍 Pre-Flight Check

Run these commands first:

```powershell
# Check Node.js and npm versions
node --version    # Should be v16+
npm --version     # Should be v8+
```

✅ **Dependencies Status**: All installed automatically!
- ✅ Backend: bcrypt, cors, jwt, socket.io, AWS SDK, winston, nodemon
- ✅ Frontend: socket.io-client, react-quill

---

## ⚠️ ONE CRITICAL STEP BEFORE LAUNCH

### Add AWS Credentials to server/.env

**File**: `server/.env`

**Find these lines**:
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
```

**Replace with your actual AWS credentials**:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Don't have AWS credentials?**
- **Option 1**: Get from [AWS Console](https://console.aws.amazon.com/) > IAM > Users > Security Credentials
- **Option 2**: Skip file uploads for now (app will work without it)

---

## 🚀 LAUNCH SEQUENCE

### Step 1: Open TWO PowerShell Terminals

### Step 2: Terminal 1 - Start Backend

```powershell
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm start
```

**Wait for**:
```
✅ MongoDB connected
🚀 Server and Socket.io running on port 5000
```

✋ **Keep this terminal open!**

### Step 3: Terminal 2 - Start Frontend

```powershell
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"
npm start
```

**Wait for**:
```
Compiled successfully!
Local: http://localhost:3000
```

🎉 **Browser opens automatically to http://localhost:3000**

---

## 🧪 QUICK FEATURE TEST (2 minutes)

### Test 1: Registration & Login (30 seconds)
1. Click **Sign Up**
2. Enter: Name: `Test User`, Email: `test@test.com`, Password: `test123`
3. Click **Register**
4. Login with same credentials

✅ **Success**: You see the dashboard/projects page

### Test 2: Create Project (30 seconds)
1. Click **New Project** or **Create Project**
2. Enter: Name: `My Test Project`, Description: `Testing`
3. Click **Create**

✅ **Success**: Project appears in list

### Test 3: Kanban Board (30 seconds)
1. Click on your project
2. Click **Add Task** in "To Do" column
3. Enter: Title: `Test Task`, Description: `My first task`
4. Drag task to "In Progress"

✅ **Success**: Task moves smoothly, updates persist

### Test 4: Real-Time (30 seconds)
1. Open **Incognito/Private window**
2. Go to http://localhost:3000
3. Sign up as different user: `test2@test.com`
4. Join same project
5. In original window, create a task
6. Check incognito window - task appears automatically

✅ **Success**: Changes appear in both windows instantly

---

## 🎯 ALL FEATURES AVAILABLE

Once launched, you can use:

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Ready | Register, Login, JWT tokens |
| Project Management | ✅ Ready | Create, edit, delete projects |
| Kanban Board | ✅ Ready | Drag & drop tasks |
| Real-Time Updates | ✅ Ready | Socket.io powered |
| Online Users | ✅ Ready | See who's online |
| Typing Indicators | ✅ Ready | See who's typing |
| Collaborative Editing | ✅ Ready | Real-time document editing |
| File Upload (S3) | ⚠️ Needs AWS | Add credentials to .env |
| GitHub Integration | ⚠️ Optional | Add GITHUB_TOKEN to .env |
| Chat/Conversations | ✅ Ready | Real-time messaging |
| Task Assignment | ✅ Ready | Assign tasks to users |

---

## ⚡ QUICK COMMANDS

### Start Development (Daily Use)

```powershell
# Terminal 1: Backend with auto-restart
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm start
```

### Stop Servers
Press `Ctrl + C` in each terminal

### Restart After Changes
- Backend: Auto-restarts with `npm run dev`
- Frontend: Auto-refreshes browser

### Check Server Status
```powershell
curl http://localhost:5000/api/health
```

### View Logs
- Backend: Check Terminal 1
- Frontend: Check Terminal 2
- Browser: Press F12 > Console

---

## 🐛 INSTANT FIXES

### Backend Won't Start
```powershell
cd server
npm start
```
**Look for error message**, common fixes:
- Port 5000 busy? Kill process: `taskkill /F /IM node.exe`
- Missing .env? Check `server/.env` exists

### Frontend Won't Start
```powershell
cd client
npm start
```
**Common fix**: 
```powershell
rm -r node_modules
npm install --legacy-peer-deps
npm start
```

### MongoDB Connection Error
- Check internet connection
- Verify MongoDB Atlas IP whitelist: https://cloud.mongodb.com

### AWS/S3 Upload Error
- Add credentials to `server/.env`
- Verify bucket exists: `collabcampus-storage`
- Can skip for testing - app works without it

---

## 📊 LAUNCH STATUS CHECKLIST

Use this to verify everything is working:

- [ ] Node.js and npm installed (v16+, v8+)
- [ ] All dependencies installed (✅ done automatically)
- [ ] MongoDB connection string in `server/.env` (✅ already there)
- [ ] AWS credentials added to `server/.env` (⚠️ **action required**)
- [ ] Backend terminal running without errors
- [ ] Frontend terminal running without errors
- [ ] Browser opens to http://localhost:3000
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Can create a project
- [ ] Can add tasks to Kanban board
- [ ] Real-time updates work (test with two browsers)

---

## 📚 DOCUMENTATION

**Need more details?**
- 📘 **LOCAL_LAUNCH_GUIDE.md** - Complete step-by-step guide
- 📗 **PROJECT_DIAGNOSTIC_REPORT.md** - Issues found and fixed
- 📕 **BACKEND_DEPLOYMENT_CONFIG.md** - Deployment configuration
- 📙 **PRODUCTION_DEPLOYMENT_GUIDE.md** - Production deployment

---

## 🎉 YOU'RE READY!

**Launch Command**:
```powershell
# Terminal 1
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm start

# Terminal 2 (new window)
cd "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\client"
npm start
```

**Open Browser**: http://localhost:3000

**Happy Coding!** 🚀

---

**Time to Launch**: < 5 minutes  
**Time to Test**: 2 minutes  
**Total Time**: ~7 minutes from start to fully working app

---

**Last Updated**: October 30, 2025  
**Dependencies**: ✅ All installed  
**Configuration**: ✅ Ready (add AWS credentials for file uploads)  
**Status**: 🟢 Ready to Launch
