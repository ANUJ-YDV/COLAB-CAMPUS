// __tests__/sample.test.js
// Sample test to verify Jest setup is working

describe('Sample Test Suite', () => {
  test('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  test('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle arrays', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
  });

  test('should handle objects', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('John');
  });
});

describe('Environment Variables', () => {
  test('should be in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
