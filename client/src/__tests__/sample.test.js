// src/__tests__/sample.test.js
// Sample tests to verify Jest setup

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

describe('Utility Functions', () => {
  test('should format dates correctly', () => {
    const date = new Date('2025-01-01');
    expect(date.getFullYear()).toBe(2025);
  });

  test('should validate email format', () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });
});
