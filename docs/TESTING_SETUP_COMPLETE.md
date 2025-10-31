# Testing Setup Complete ✅

## 📦 Installed Dependencies

### Backend (Server)
```json
{
  "jest": "^29.x",
  "supertest": "^7.x",
  "@babel/core": "^7.x",
  "@babel/preset-env": "^7.x",
  "babel-jest": "^29.x"
}
```

### Frontend (Client)
```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^13.5.0"
}
```
*(Already included with Create React App)*

---

## ⚙️ Configuration Files Created

### Server Configuration

#### 1. `jest.config.js`
- Test environment: Node
- Transform: babel-jest for ES modules
- Coverage configuration
- Test patterns configured

#### 2. `.babelrc`
- Preset: @babel/preset-env
- Target: current Node version
- Enables ES6+ features in tests

#### 3. `package.json` scripts:
```json
"test": "NODE_ENV=test jest --runInBand",
"test:watch": "NODE_ENV=test jest --watch",
"test:coverage": "NODE_ENV=test jest --coverage"
```

---

## 📁 Test Files Created

### Server Tests (`server/__tests__/`)
1. **`sample.test.js`** - Basic Jest functionality tests
2. **`api.test.js`** - API endpoint test templates with Supertest

### Client Tests (`client/src/__tests__/`)
1. **`sample.test.js`** - Basic Jest functionality tests
2. **`App.test.jsx`** - React component test example

---

## 🚀 Running Tests

### Backend (Server):
```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Frontend (Client):
```bash
cd client

# Run all tests
npm test

# Run tests in watch mode (already included in CRA)
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 📝 Test Examples

### Backend API Test (with Supertest):
```javascript
import request from 'supertest';
import app from '../server.js';

describe('POST /api/auth/register', () => {
  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Backend Model Test:
```javascript
import mongoose from 'mongoose';
import User from '../models/user.js';

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should validate required fields', async () => {
    const user = new User({});
    await expect(user.validate()).rejects.toThrow();
  });
});
```

### Frontend Component Test:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../pages/Login';

describe('LoginPage', () => {
  test('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert expected behavior
  });
});
```

---

## 🔧 Testing Best Practices

### 1. Test Structure (AAA Pattern):
```javascript
test('description', () => {
  // Arrange - Set up test data
  const input = 'test';
  
  // Act - Execute the code being tested
  const result = myFunction(input);
  
  // Assert - Verify the result
  expect(result).toBe('expected');
});
```

### 2. Test Database Setup:
Create a separate test database:
```javascript
// test/setup.js
const MONGO_URI_TEST = 'mongodb://localhost:27017/colab-campus-test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI_TEST);
});

afterEach(async () => {
  // Clean up after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
```

### 3. Mock External Dependencies:
```javascript
// Mock axios for API calls
jest.mock('axios');

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }));
});
```

### 4. Test Coverage Goals:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key user flows
- **E2E Tests**: Critical business paths

---

## 📊 Test Coverage Report

After running `npm run test:coverage`, view the report:
```bash
# Server
open server/coverage/lcov-report/index.html

# Client
open client/coverage/lcov-report/index.html
```

Coverage includes:
- **Statements**: % of code statements executed
- **Branches**: % of conditional branches tested
- **Functions**: % of functions called
- **Lines**: % of code lines covered

---

## 🎯 Next Steps

### 1. Create Test Database:
```bash
# Add to .env
MONGO_URI_TEST=mongodb://localhost:27017/colab-campus-test

# Or use MongoDB Atlas test cluster
MONGO_URI_TEST=mongodb+srv://...test
```

### 2. Write Real Tests:
- [ ] Auth routes (register, login, logout)
- [ ] Project CRUD operations
- [ ] Task CRUD operations
- [ ] Message sending
- [ ] User permissions
- [ ] Error handling

### 3. Add Test Helpers:
Create `server/__tests__/helpers/`:
- `testDb.js` - Database setup/teardown
- `authHelper.js` - Generate test tokens
- `fixtures.js` - Test data factories

### 4. CI/CD Integration:
Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```

---

## 🐛 Troubleshooting

### Issue: "Cannot use import statement outside a module"
**Solution**: Ensure `jest.config.js` has correct transform settings and `.babelrc` is configured.

### Issue: "MongoDB connection error in tests"
**Solution**: 
1. Use a separate test database
2. Mock mongoose in unit tests
3. Use `mongodb-memory-server` for isolated testing

### Issue: "Tests timeout"
**Solution**:
```javascript
// Increase timeout for async tests
test('description', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: "React hooks error in tests"
**Solution**: Wrap component in test providers:
```javascript
render(
  <BrowserRouter>
    <SocketProvider>
      <Component />
    </SocketProvider>
  </BrowserRouter>
);
```

---

## 📚 Resources

### Jest Documentation:
- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Supertest](https://github.com/visionmedia/supertest)

### Testing Patterns:
- [Testing Best Practices](https://testingjavascript.com/)
- [React Testing Library Examples](https://testing-library.com/docs/react-testing-library/example-intro)

---

## ✅ Testing Setup Checklist

- [x] Jest installed (server + client)
- [x] Supertest installed (server)
- [x] Babel configured for ES modules
- [x] Jest config files created
- [x] Sample tests created
- [x] Test scripts added to package.json
- [x] Test directories created
- [ ] Test database configured
- [ ] Real API tests written
- [ ] Component tests written
- [ ] Integration tests written
- [ ] CI/CD pipeline configured

---

**Status**: 🟢 **Testing Infrastructure Ready**

You can now write and run tests! Start with the placeholder tests and gradually add real test cases covering your application's functionality.

**Run tests now:**
```bash
# Server
cd server && npm test

# Client
cd client && npm test
```
