# 🧪 Testing & Coverage Guide

## Quick Start

### View All Coverage Reports
```powershell
# One command to generate and view both reports
.\view-coverage.ps1
```

### Individual Coverage Reports

**Backend Coverage**:
```powershell
cd server
npm test -- --coverage --watchAll=false
start coverage/lcov-report/index.html
```

**Frontend Coverage**:
```powershell
cd client
npm test -- --coverage --watchAll=false
start coverage/lcov-report/index.html
```

## Test Commands

### Backend (Server)
```powershell
cd server

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- __tests__/auth.test.js

# Watch mode
npm run test:watch

# Coverage with watch mode
npm test -- --coverage --watch
```

### Frontend (Client)
```powershell
cd client

# Run all tests
npm test

# Run tests once (no watch)
npm test -- --watchAll=false

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- src/__tests__/Login.test.jsx

# Update snapshots
npm test -- -u
```

## Test Suites

### Backend Tests

#### 1. Auth Tests (`auth.test.js`)
**14 test cases covering**:
- ✅ User registration with password hashing
- ✅ Login with JWT generation
- ✅ Token validation on protected routes
- ✅ Invalid credentials handling
- ✅ Email validation
- ✅ Password requirements
- ✅ Duplicate email detection

#### 2. S3 Tests (`s3.test.js`)
**11 test cases covering**:
- ✅ S3 client configuration
- ✅ Presigned URL generation
- ✅ File type validation
- ✅ AWS credentials validation
- ✅ Bucket and region validation
- ✅ Error handling

#### 3. Integration Tests (`integration.test.js`)
**12 scenarios covering**:
- ✅ Complete user journey (register → create project → manage tasks)
- ✅ Authorization enforcement
- ✅ Data validation
- ✅ End-to-end API workflows

#### 4. Sample Tests (`sample.test.js`)
**5 test cases** - Basic Jest functionality validation

#### 5. API Tests (`api.test.js`)
**10 placeholder tests** - API structure validation

### Frontend Tests

#### 1. Login Tests (`Login.test.jsx`)
**7 test cases covering**:
- ✅ Form rendering
- ✅ Input handling (email, password)
- ✅ Form submission
- ✅ LocalStorage token storage
- ✅ Navigation after login

#### 2. ProjectBoard Tests (`ProjectBoard.test.jsx`)
**11 test cases covering**:
- ✅ Kanban board rendering (To-Do, In Progress, Done)
- ✅ Task display
- ✅ Socket.io integration
- ✅ Real-time updates
- ✅ User presence tracking
- ✅ Drag-and-drop functionality

#### 3. App Tests (`App.test.jsx`)
**2 test cases** - Main app component validation

#### 4. Sample Tests (`sample.test.js`)
**6 test cases** - Basic React Testing Library validation

## CI/CD Pipeline

### GitHub Actions Workflow
**File**: `.github/workflows/ci-cd.yml`

**Triggers**:
- Push to: `main`, `master`, `develop`
- Pull requests to: `main`, `master`, `develop`

**Jobs**:
1. **backend-test**: Run server tests (Node 18.x, 20.x)
2. **frontend-test**: Run client tests (Node 18.x, 20.x)
3. **build**: Verify production build
4. **code-quality**: Run linters
5. **security**: npm audit scan
6. **status-check**: Overall pass/fail

### Enable CI/CD

```bash
# Push workflow to GitHub
git add .github/workflows/ci-cd.yml
git commit -m "Add CI/CD pipeline"
git push origin master

# View results
# Go to: https://github.com/your-username/your-repo/actions
```

### Branch Protection (Recommended)

1. Go to Repository → Settings → Branches
2. Add rule for `main`/`master`
3. Check: "Require status checks to pass before merging"
4. Select: `backend-test`, `frontend-test`, `build`

**Effect**: Pull requests must pass all tests before merging

## Coverage Reports

### What's Included
- **Line-by-line coverage** with color coding
- **Statement coverage** - Individual code statements
- **Branch coverage** - if/else, switch, ternary operators
- **Function coverage** - Function calls
- **Line coverage** - Physical lines executed

### Color Coding
- 🟢 **Green** (80-100%): Excellent coverage
- 🟡 **Yellow** (50-79%): Needs improvement
- 🔴 **Red** (0-49%): Insufficient coverage

### Current Coverage

**Backend**:
```
Utils:          62% 🟡 (logger, errorHandler)
Routes:         26% 🔴 (needs improvement)
Models:         17% 🔴 (needs improvement)
Controllers:     8% 🔴 (needs improvement)
Server:         14% 🔴 (needs improvement)
```

**Frontend**:
```
App.jsx:       100% 🟢 (excellent)
Login:         100% 🟢 (7 tests)
ProjectBoard:  100% 🟢 (11 tests)
Components:      0% 🔴 (not yet tested)
Other Pages:     4% 🔴 (needs improvement)
```

## Improving Coverage

### Add More Tests

**Example: Test a Model**
```javascript
// server/__tests__/models/project.test.js
import Project from '../models/project.js';

describe('Project Model', () => {
  it('should require name field', async () => {
    const project = new Project({});
    
    await expect(project.save()).rejects.toThrow();
  });
  
  it('should validate name length', async () => {
    const project = new Project({
      name: 'ab', // Too short (min 3)
      owner: 'user-id'
    });
    
    await expect(project.save()).rejects.toThrow(/shorter than/);
  });
});
```

**Example: Test a Component**
```javascript
// client/src/__tests__/components/TaskCard.test.jsx
import { render, screen } from '@testing-library/react';
import TaskCard from '../components/TaskCard';

describe('TaskCard', () => {
  it('should render task title', () => {
    render(<TaskCard task={{ title: 'Test Task', status: 'todo' }} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

## Codecov Integration (Optional)

### Setup
1. Go to https://codecov.io
2. Sign in with GitHub
3. Enable for your repository
4. Get token
5. Add to GitHub Secrets:
   - Repository → Settings → Secrets → New repository secret
   - Name: `CODECOV_TOKEN`
   - Value: Your token

### Features
- Coverage badge for README
- PR comments with coverage changes
- Trend analysis
- Coverage graphs

### Add Badge to README
```markdown
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

## Test Database Setup

### Option 1: Local MongoDB
```env
# Add to server/.env
MONGO_URI_TEST=mongodb://localhost:27017/colab-campus-test
```

### Option 2: MongoDB Memory Server (Recommended)
```bash
cd server
npm install --save-dev mongodb-memory-server
```

**Benefits**:
- No external DB needed
- Faster tests
- Clean state per run
- Works in CI/CD

## Troubleshooting

### Tests Timeout
**Solution**: Increase timeout in test file
```javascript
jest.setTimeout(15000); // 15 seconds
```

### Coverage Not Generated
**Solution**: Add `--coverage` flag
```bash
npm test -- --coverage
```

### Tests Fail in CI but Pass Locally
**Solution**: Check environment variables
- Ensure all required env vars are in GitHub Secrets
- Check Node version compatibility

### Frontend Tests Fail on Axios/Socket
**Solution**: Ensure mocks are defined
```javascript
jest.mock('axios');
jest.mock('socket.io-client');
```

## Documentation

- **TEST_COVERAGE_CI_CD_COMPLETE.md** - Complete summary
- **TEST_COVERAGE_CI_CD_REPORT.md** - Detailed report
- **COVERAGE_QUICK_GUIDE.md** - Quick reference
- **COMPREHENSIVE_TESTING_COMPLETE.md** - Implementation guide

## Statistics

- **Total Tests**: 78 test cases
- **Backend**: 52 tests
- **Frontend**: 26 tests
- **Passing**: 39 tests
- **Pending**: 39 tests (need DB)

## Next Steps

1. ✅ View coverage reports (run `.\view-coverage.ps1`)
2. ✅ Push CI/CD to GitHub
3. ⏳ Setup MongoDB test database
4. ⏳ Add more component tests
5. ⏳ Increase coverage to 80%+
6. ⏳ Setup Codecov for tracking

---

**Quick Command**: `.\view-coverage.ps1` to see all your coverage reports! 📊
