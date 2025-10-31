# Testing Quick Reference 🧪

## Run Tests

### Backend:
```bash
cd server
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Frontend:
```bash
cd client
npm test                    # Interactive watch mode
npm test -- --watchAll=false  # Single run
npm test -- --coverage      # With coverage report
```

## Test File Locations

- **Server**: `server/__tests__/*.test.js`
- **Client**: `client/src/__tests__/*.test.js(x)`

## Common Test Patterns

### Basic Test:
```javascript
test('description', () => {
  expect(2 + 2).toBe(4);
});
```

### API Test (Supertest):
```javascript
const response = await request(app)
  .post('/api/endpoint')
  .send({ data });
expect(response.status).toBe(200);
```

### React Component Test:
```javascript
render(<Component />);
expect(screen.getByText(/hello/i)).toBeInTheDocument();
```

## Current Status:
- ✅ Server: 15 tests passing
- ✅ Client: 8 tests passing
- ✅ Total: 23 tests passing

## Documentation:
See `TESTING_SETUP_COMPLETE.md` for detailed guide.
