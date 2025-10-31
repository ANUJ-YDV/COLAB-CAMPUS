// __tests__/auth.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js'; // Your Express app
import User from '../models/user.js';

// Test database connection
const MONGO_URI_TEST =
  process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/colab-campus-test';

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI_TEST);
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'testuser@example.com');
      expect(res.body.user).not.toHaveProperty('password'); // Should not return password
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 409 if email already exists', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      // Attempt duplicate registration
      const res = await request(app).post('/api/auth/register').send({
        name: 'Another User',
        email: 'duplicate@example.com',
        password: 'password456',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid|incorrect/i);
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('JWT Token Validation', () => {
    let validToken;

    beforeEach(async () => {
      // Register and login to get a valid token
      const res = await request(app).post('/api/auth/register').send({
        name: 'Token Test User',
        email: 'token@example.com',
        password: 'password123',
      });
      validToken = res.body.token;
    });

    it('should access protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/projects/my-projects')
        .set('Authorization', `Bearer ${validToken}`);

      // Should not return 401 (may return 200 or other valid status)
      expect(res.statusCode).not.toBe(401);
    });

    it('should return 401 for protected route without token', async () => {
      const res = await request(app).get('/api/projects/my-projects');

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for protected route with invalid token', async () => {
      const res = await request(app)
        .get('/api/projects/my-projects')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(res.statusCode).toBe(401);
    });
  });
});
