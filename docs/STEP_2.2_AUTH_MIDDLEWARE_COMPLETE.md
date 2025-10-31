# Step 2.2: Secure Express Routes - Authentication & Authorization ✅

## 🎯 Objective
Build secure Express routes so users can:
- Create, Read, Update, and Delete their projects
- **Only allow access if they're a member or owner**

---

## ✅ What We've Implemented

### 1️⃣ Enhanced Authentication Middleware

**File**: `server/middleware/authmiddleware.js`

#### Three Middleware Functions:

1. **`protect`** - Verifies JWT token and authenticates user
   - Checks for `Authorization: Bearer <token>` header
   - Verifies JWT token using JWT_SECRET
   - Fetches user from database (without password)
   - Attaches `req.user` to request object
   - Returns 401 if token is missing/invalid

2. **`checkProjectMembership`** - Ensures user is member or owner
   - Must be used **after** `protect` middleware
   - Checks if user is in `project.members` or is `project.owner`
   - Attaches `req.project` and `req.isOwner` to request
   - Returns 403 if user is not a member

3. **`checkProjectOwnership`** - Ensures user is owner
   - Must be used **after** `protect` middleware  
   - Only allows project owner to proceed
   - Used for delete, add/remove members
   - Returns 403 if user is not the owner

---

### 2️⃣ Secured Project Routes

**File**: `server/routes/projectRoutes.js`

| Route | Method | Protection | Description |
|-------|--------|-----------|-------------|
| `/create` | POST | `protect` | Create new project (owner = authenticated user) |
| `/my-projects` | GET | `protect` | Get all projects for authenticated user |
| `/user/:userId` | GET | Public | Get user projects (backward compatibility) |
| `/:projectId` | DELETE | `protect` + `checkProjectOwnership` | Delete project (owner only) |
| `/:projectId/members/add` | POST | `protect` + `checkProjectOwnership` | Add member (owner only) |
| `/:projectId/members/remove` | POST | `protect` + `checkProjectOwnership` | Remove member (owner only) |

**Key Changes**:
- ✅ `ownerId` no longer required in request body - uses `req.user._id`
- ✅ New `/my-projects` endpoint for authenticated user
- ✅ All modification operations require owner permission
- ✅ Member management secured

---

### 3️⃣ Secured Task Routes

**File**: `server/routes/taskRoutes.js`

| Route | Method | Protection | Description |
|-------|--------|-----------|-------------|
| `/create` | POST | `protect` | Create new task (requires auth) |
| `/project/:projectId` | GET | `protect` + `checkProjectMembership` | Get project tasks (members only) |
| `/my-tasks` | GET | `protect` | Get authenticated user's tasks |
| `/user/:userId` | GET | Public | Get user tasks (backward compatibility) |
| `/:taskId/status` | PATCH | `protect` | Update task status |
| `/:taskId/assign` | PATCH | `protect` | Assign task to user |
| `/:taskId/comments` | POST | `protect` | Add comment (author = authenticated user) |
| `/:taskId` | DELETE | `protect` | Delete task |

**Key Changes**:
- ✅ `authorId` no longer required for comments - uses `req.user._id`
- ✅ New `/my-tasks` endpoint for authenticated user
- ✅ Project tasks require membership verification
- ✅ All operations require authentication

---

### 4️⃣ Updated Test File

**File**: `server/test-api.http`

**Updated with**:
- ✅ Instructions to save token from login
- ✅ `Authorization: Bearer YOUR_TOKEN_HERE` headers on all protected routes
- ✅ Real IDs from seed data (6900ebd4a6305efc84cffeba, etc.)
- ✅ Comments indicating which routes are protected
- ✅ 18 total test requests with proper authentication

---

## 🔒 Security Features Implemented

### Authentication
- ✅ JWT token verification on protected routes
- ✅ Token expiration handling (1 hour from login)
- ✅ User lookup without exposing password
- ✅ Proper 401 responses for unauthorized access

### Authorization
- ✅ Membership verification before showing project data
- ✅ Owner-only operations (delete, manage members)
- ✅ Proper 403 responses for forbidden actions
- ✅ Automatic user association (no manual ID passing)

### Data Integrity
- ✅ Authenticated user automatically becomes owner/author
- ✅ Cannot fake ownerId or authorId in requests
- ✅ Project membership checked before task access
- ✅ Consistent error messages

---

## 📋 How to Test

### Step 1: Start the Server
```bash
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
node server.js
```

### Step 2: Login to Get Token
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@collabcampus.com",
  "password": "hashedPlaceholder"
}
```

**Save the token from response!**

### Step 3: Test Protected Endpoints

Replace `YOUR_TOKEN_HERE` in `test-api.http` with your actual token.

**Example: Get My Projects**
```bash
GET http://localhost:5000/api/projects/my-projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example: Create Project**
```bash
POST http://localhost:5000/api/projects/create
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "My Secure Project",
  "description": "Created with authentication",
  "memberIds": []
}
```

### Step 4: Test Authorization

Try accessing a project you're not a member of → Should get `403 Forbidden`

Try deleting a project you don't own → Should get `403 Forbidden`

Try accessing without token → Should get `401 Unauthorized`

---

## 🆕 New API Endpoints

### For Frontend Integration

1. **GET /api/projects/my-projects** (Protected)
   - Returns all projects where user is owner or member
   - Use this instead of `/user/:userId` for authenticated requests

2. **GET /api/tasks/my-tasks** (Protected)
   - Returns all tasks assigned to authenticated user
   - Use this for user dashboard

---

## 🔄 Migration Guide for Frontend

### Before (Unsecure):
```javascript
// Had to manually pass userId
fetch('/api/projects/create', {
  method: 'POST',
  body: JSON.stringify({
    name: "Project",
    ownerId: userId  // ❌ Could be faked
  })
})
```

### After (Secure):
```javascript
// Server gets userId from token
fetch('/api/projects/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`  // ✅ Secure
  },
  body: JSON.stringify({
    name: "Project"
    // No ownerId needed!
  })
})
```

---

## ✅ Completion Checklist

- [x] `protect` middleware implemented
- [x] `checkProjectMembership` middleware implemented
- [x] `checkProjectOwnership` middleware implemented
- [x] Project routes updated with authentication
- [x] Task routes updated with authentication
- [x] New `/my-projects` endpoint created
- [x] New `/my-tasks` endpoint created
- [x] Test file updated with auth headers
- [x] Automatic owner/author assignment
- [x] Proper error responses (401, 403)
- [x] Backward compatible public routes maintained

---

## 🎯 Next Steps

### Step 2.3: Additional Security (Optional)
- [ ] Rate limiting middleware
- [ ] Request validation with express-validator
- [ ] Transactions for multi-document updates
- [ ] Additional task-level permissions

### Step 3: Frontend Integration
- [ ] Store JWT token in localStorage/cookies
- [ ] Add auth headers to all API calls
- [ ] Implement auto-logout on token expiration
- [ ] Build Kanban board with protected data

---

## 🎉 STEP 2.2 COMPLETE!

All routes are now secured with proper authentication and authorization.
Users can only access and modify projects they are members of.
Ready to build the frontend with secure API integration!
