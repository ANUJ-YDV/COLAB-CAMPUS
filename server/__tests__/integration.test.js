// __tests__/integration.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/user.js';
import Project from '../models/project.js';
import Task from '../models/task.js';

const MONGO_URI_TEST =
  process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/colab-campus-test';

describe('Integration Tests - Full API Workflow', () => {
  let authToken;
  let userId;
  let projectId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI_TEST);
    }
  });

  afterAll(async () => {
    // Clean up all test data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
  });

  describe('Complete User Journey', () => {
    it('Step 1: User Registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');

      authToken = res.body.token;
      userId = res.body.user._id;
    });

    it('Step 2: User Login', async () => {
      // First register
      await request(app).post('/api/auth/register').send({
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123',
      });

      // Then login
      const res = await request(app).post('/api/auth/login').send({
        email: 'logintest@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');

      authToken = res.body.token;
      userId = res.body.user._id;
    });

    it('Step 3: Create a Project', async () => {
      // Register first
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Project Creator',
        email: 'creator@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;

      // Create project
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Project',
          description: 'This is a test project for integration testing',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('Integration Test Project');

      projectId = res.body._id;
    });

    it('Step 4: Get User Projects', async () => {
      // Register
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Project Owner',
        email: 'owner@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;

      // Create project
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project 1',
          description: 'First test project',
        });

      // Get user's projects
      const res = await request(app)
        .get('/api/projects/my-projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('Test Project 1');
    });

    it('Step 5: Create a Task in Project', async () => {
      // Register
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Task Creator',
        email: 'taskcreator@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;

      // Create project
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Task Test Project',
          description: 'Project for task testing',
        });

      projectId = projectRes.body._id;

      // Create task
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integration Test Task',
          description: 'This is a test task',
          status: 'todo',
          priority: 'high',
          project: projectId,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe('Integration Test Task');
      expect(res.body.status).toBe('todo');
    });

    it('Step 6: Update Task Status', async () => {
      // Register
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Task Updater',
        email: 'taskupdater@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;

      // Create project
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Test Project',
          description: 'Project for update testing',
        });

      projectId = projectRes.body._id;

      // Create task
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Update',
          description: 'This task will be updated',
          status: 'todo',
          project: projectId,
        });

      const taskId = taskRes.body._id;

      // Update task
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in-progress',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('Step 7: Get Project Tasks', async () => {
      // Register
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Task Getter',
        email: 'taskgetter@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;

      // Create project
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Tasks List Project',
          description: 'Project with multiple tasks',
        });

      projectId = projectRes.body._id;

      // Create multiple tasks
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${authToken}`).send({
        title: 'Task 1',
        project: projectId,
        status: 'todo',
      });

      await request(app).post('/api/tasks').set('Authorization', `Bearer ${authToken}`).send({
        title: 'Task 2',
        project: projectId,
        status: 'in-progress',
      });

      // Get project tasks
      const res = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('Step 8: Delete Task', async () => {
      // Register
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Task Deleter',
        email: 'taskdeleter@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;

      // Create project
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Delete Test Project',
          description: 'Project for delete testing',
        });

      projectId = projectRes.body._id;

      // Create task
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Delete',
          project: projectId,
        });

      const taskId = taskRes.body._id;

      // Delete task
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);

      // Verify task is deleted
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('Authorization Tests', () => {
    let user1Token, user2Token, user1ProjectId;

    beforeEach(async () => {
      // Create two users
      const user1Res = await request(app).post('/api/auth/register').send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
      });

      const user2Res = await request(app).post('/api/auth/register').send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
      });

      user1Token = user1Res.body.token;
      user2Token = user2Res.body.token;

      // User 1 creates a project
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'User 1 Project',
          description: 'Private project',
        });

      user1ProjectId = projectRes.body._id;
    });

    it('should not allow user to access another users project', async () => {
      // User 2 tries to get User 1's project
      const res = await request(app)
        .get(`/api/projects/${user1ProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      // Depending on your implementation, this might be 403 or 404
      expect([403, 404]).toContain(res.statusCode);
    });

    it('should not allow unauthenticated access to projects', async () => {
      const res = await request(app).get('/api/projects/my-projects');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Data Validation Tests', () => {
    let authToken;

    beforeEach(async () => {
      const authRes = await request(app).post('/api/auth/register').send({
        name: 'Validation Tester',
        email: 'validation@example.com',
        password: 'password123',
      });

      authToken = authRes.body.token;
    });

    it('should reject project with missing name', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Project without name',
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject task with invalid status', async () => {
      // Create project first
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Validation Project',
        });

      const projectId = projectRes.body._id;

      // Try to create task with invalid status
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Task',
          project: projectId,
          status: 'invalid-status',
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
