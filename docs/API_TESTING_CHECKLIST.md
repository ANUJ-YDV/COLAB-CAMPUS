# API Testing Checklist - Step 2.2 Complete

## 🎯 Manual Testing Guide

### Prerequisites
✅ Server running on http://localhost:5000
✅ MongoDB connected
✅ Test user exists: test@collabcampus.com

---

## Test 1: Login & Get Token ✅

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@collabcampus.com",
  "password": "hashedPlaceholder"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6900ebd4a6305efc84cffeba",
    "name": "Test User",
    "email": "test@collabcampus.com"
  }
}
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Token is present
- [ ] User object is returned
- [ ] **Save this token for next tests!**

---

## Test 2: Create Project (POST /api/projects) ✅

**Request:**
```http
POST http://localhost:5000/api/projects
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "name": "AI Research Project",
  "description": "ML based project for testing"
}
```

**Expected Response:**
```json
{
  "_id": "690xxxxx",
  "name": "AI Research Project",
  "description": "ML based project for testing",
  "owner": "6900ebd4a6305efc84cffeba",
  "members": ["6900ebd4a6305efc84cffeba"],
  "tasks": [],
  "createdAt": "2025-10-29T...",
  "updatedAt": "2025-10-29T..."
}
```

**✅ Checklist:**
- [ ] Returns 201 Created
- [ ] Project has correct name and description
- [ ] Owner is the authenticated user
- [ ] User is automatically added to members array
- [ ] **Save project ID for next tests!**
- [ ] **Check MongoDB Atlas** - project should appear

---

## Test 3: Get All Projects (GET /api/projects) ✅

**Request:**
```http
GET http://localhost:5000/api/projects
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
[
  {
    "_id": "6900ebd4a6305efc84cffebc",
    "name": "Demo Project",
    "owner": { "name": "Test User", "email": "test@collabcampus.com" },
    "members": [...]
  },
  {
    "_id": "690xxxxx",
    "name": "AI Research Project",
    ...
  }
]
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Array of projects returned
- [ ] Only shows projects where user is a member
- [ ] Owner and members are populated

---

## Test 4: Get Single Project (GET /api/projects/:id) ✅

**Request:**
```http
GET http://localhost:5000/api/projects/6900ebd4a6305efc84cffebc
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "_id": "6900ebd4a6305efc84cffebc",
  "name": "Demo Project",
  "description": "Seeded project",
  "owner": { "name": "Test User", "email": "test@collabcampus.com" },
  "members": [...],
  "tasks": [...]
}
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Project details with populated members
- [ ] Tasks array is populated
- [ ] Membership is verified (403 if not a member)

---

## Test 5: Update Project (PUT /api/projects/:id) ✅

**Request:**
```http
PUT http://localhost:5000/api/projects/YOUR_PROJECT_ID
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "name": "Updated AI Research Project",
  "description": "Updated ML based project"
}
```

**Expected Response:**
```json
{
  "_id": "690xxxxx",
  "name": "Updated AI Research Project",
  "description": "Updated ML based project",
  "updatedAt": "2025-10-29T... (NEW TIMESTAMP)"
}
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Name and description are updated
- [ ] `updatedAt` timestamp has changed
- [ ] Only owner can update (403 for non-owners)
- [ ] **Check MongoDB Atlas** - should see updated data

---

## Test 6: Test Unauthorized Access ✅

**Request:**
```http
GET http://localhost:5000/api/projects
(NO Authorization header)
```

**Expected Response:**
```json
{
  "message": "Not authorized, no token"
}
```

**✅ Checklist:**
- [ ] Returns 401 Unauthorized
- [ ] Error message indicates missing token

---

## Test 7: Test Non-Owner Update (403) ✅

**Request:**
```http
PUT http://localhost:5000/api/projects/SOMEONE_ELSES_PROJECT_ID
Authorization: Bearer YOUR_TOKEN_HERE

{
  "name": "Trying to update"
}
```

**Expected Response:**
```json
{
  "message": "Only owner can edit project"
}
```

**✅ Checklist:**
- [ ] Returns 403 Forbidden
- [ ] Non-owners cannot update projects

---

## Test 8: Add Member to Project ✅

**Request:**
```http
POST http://localhost:5000/api/projects/YOUR_PROJECT_ID/members
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "userId": "68fce78e04a6094eeb3aa8ea"
}
```

**Expected Response:**
```json
{
  "message": "Member added successfully",
  "project": {
    "members": [..., "68fce78e04a6094eeb3aa8ea"]
  }
}
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Member is added to project.members array
- [ ] Project is added to user's projects array
- [ ] Only owner can add members (403 for non-owners)
- [ ] **Check MongoDB Atlas** - both collections updated

---

## Test 9: Remove Member from Project ✅

**Request:**
```http
DELETE http://localhost:5000/api/projects/YOUR_PROJECT_ID/members/USER_ID_TO_REMOVE
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "message": "Member removed successfully",
  "project": {
    "members": [... (user removed)]
  }
}
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Member is removed from project
- [ ] Project is removed from user's projects array
- [ ] Cannot remove owner
- [ ] **Check MongoDB Atlas** - both collections updated

---

## Test 10: Delete Project (DELETE /api/projects/:id) ✅

**Request:**
```http
DELETE http://localhost:5000/api/projects/YOUR_PROJECT_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "message": "Project deleted successfully"
}
```

**✅ Checklist:**
- [ ] Returns 200 OK
- [ ] Project is deleted from database
- [ ] All associated tasks are deleted (cascade)
- [ ] Project is removed from all members' projects arrays
- [ ] Only owner can delete (403 for non-owners)
- [ ] **Check MongoDB Atlas** - project and tasks removed

---

## 📊 Final Verification Checklist

### Server
- [ ] Server starts without errors
- [ ] MongoDB connection established
- [ ] All routes registered correctly

### Authentication
- [ ] Login returns JWT token
- [ ] Protected routes require Bearer token
- [ ] Invalid/missing token returns 401
- [ ] Token expiration handled (after 1 hour)

### Authorization
- [ ] Users can only see their projects (membership)
- [ ] Non-members get 403 when accessing projects
- [ ] Only owners can update projects
- [ ] Only owners can delete projects
- [ ] Only owners can add/remove members

### Data Integrity
- [ ] Created project appears in MongoDB Atlas
- [ ] Updated project shows changed data in MongoDB
- [ ] Deleted project removes from MongoDB
- [ ] Member addition syncs both User and Project
- [ ] Member removal syncs both collections
- [ ] Task cascade delete works
- [ ] `updatedAt` timestamp changes on modifications

### API Responses
- [ ] Proper HTTP status codes (200, 201, 401, 403, 404, 500)
- [ ] Consistent error messages
- [ ] Populated fields (owner, members) in responses
- [ ] All CRUD operations work

---

## 🎉 Success Criteria

✅ All 10 tests pass
✅ MongoDB Atlas shows correct data
✅ Unauthorized access is blocked
✅ Authorization works (owner vs member)
✅ Data synchronization works (User ↔ Project)
✅ Cascade delete works properly

---

## 📝 Testing Tools

### Option 1: Postman
1. Import collection from `test-api.http`
2. Set up environment variable for token
3. Run tests sequentially

### Option 2: VS Code REST Client
1. Install "REST Client" extension
2. Open `server/test-api.http`
3. Click "Send Request" for each endpoint

### Option 3: cURL (Command Line)
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@collabcampus.com","password":"hashedPlaceholder"}'

# Create Project
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Description"}'
```

---

## ✅ STEP 2.2 COMPLETE!

Once all tests pass, you have:
- ✅ Working CRUD API for projects
- ✅ JWT-protected routes
- ✅ Proper ownership validation
- ✅ Verified API calls
- ✅ RESTful design
- ✅ Production-ready authentication
