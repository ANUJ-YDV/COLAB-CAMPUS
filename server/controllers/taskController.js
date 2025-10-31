// server/controllers/taskController.js
import Task from '../models/task.js';
import Project from '../models/project.js';

// Socket.io instance for real-time broadcasting
let io;
export const setIO = (ioInstance) => {
  io = ioInstance;
  console.log('✅ Socket.io instance attached to taskController');
};

/**
 * Create a new task
 * @param {Object} params - { title, description, projectId, assignedTo, dueDate, priority }
 * @returns {Promise<Task>} - The created task
 */
export async function createTask({
  title,
  description = '',
  projectId,
  assignedTo = null,
  dueDate = null,
  priority = 'medium',
  status = 'todo',
}) {
  // Create the task
  const task = new Task({
    title,
    description,
    project: projectId,
    assignedTo,
    dueDate,
    priority,
    status,
  });

  await task.save();

  // Add task to project's tasks array
  await Project.findByIdAndUpdate(projectId, { $push: { tasks: task._id } });

  return task;
}

/**
 * Update task status
 * @param {String} taskId - The task ID
 * @param {String} status - New status (todo, in-progress, done)
 * @param {String} projectId - Optional project ID for Socket.io broadcasting
 * @returns {Promise<Task>} - Updated task
 */
export async function updateTaskStatus(taskId, status, projectId = null) {
  const task = await Task.findByIdAndUpdate(taskId, { status }, { new: true }).populate(
    'assignedTo',
    'name email'
  );

  // --- Real-time broadcast to project room ---
  if (io && projectId) {
    console.log(`📡 Broadcasting task_moved to project ${projectId}`);
    io.to(projectId).emit('task_moved', {
      taskId: task._id.toString(),
      status: task.status,
      title: task.title,
      assignedTo: task.assignedTo,
    });
  }

  return task;
}

/**
 * Assign task to user
 * @param {String} taskId - The task ID
 * @param {String} userId - The user ID to assign
 * @returns {Promise<Task>} - Updated task
 */
export async function assignTask(taskId, userId) {
  const task = await Task.findByIdAndUpdate(taskId, { assignedTo: userId }, { new: true });

  return task;
}

/**
 * Add comment to task
 * @param {String} taskId - The task ID
 * @param {String} authorId - The author user ID
 * @param {String} message - Comment message
 * @returns {Promise<Task>} - Updated task
 */
export async function addCommentToTask(taskId, authorId, message) {
  const task = await Task.findByIdAndUpdate(
    taskId,
    {
      $push: {
        comments: {
          author: authorId,
          message,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate('comments.author', 'name email');

  return task;
}

/**
 * Delete a task
 * @param {String} taskId - The task ID to delete
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteTask(taskId) {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  // Remove task from project's tasks array
  await Project.findByIdAndUpdate(task.project, { $pull: { tasks: taskId } });

  // Delete the task
  await Task.findByIdAndDelete(taskId);

  return { message: 'Task deleted successfully' };
}

/**
 * Get all tasks for a project
 * @param {String} projectId - The project ID
 * @returns {Promise<Array>} - Array of tasks
 */
export async function getProjectTasks(projectId) {
  const tasks = await Task.find({ project: projectId })
    .populate('assignedTo', 'name email')
    .populate('comments.author', 'name email')
    .sort({ createdAt: -1 });

  return tasks;
}

/**
 * Get tasks assigned to a user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - Array of tasks
 */
export async function getUserTasks(userId) {
  const tasks = await Task.find({ assignedTo: userId })
    .populate('project', 'name')
    .sort({ dueDate: 1 });

  return tasks;
}
