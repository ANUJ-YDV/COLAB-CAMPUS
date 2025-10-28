// Test queries for validation - Step 7
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

import User from "./models/user.js";
import Project from "./models/project.js";
import Task from "./models/task.js";

async function testQueries() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  // Get IDs from seed data
  const project = await Project.findOne({ name: "Demo Project" });
  const user = await User.findOne({ email: "test@collabcampus.com" });

  if (!project || !user) {
    console.log("❌ Seed data not found. Run: node server/seeds/seed.js");
    await mongoose.disconnect();
    return;
  }

  const projectId = project._id;
  const userId = user._id;

  console.log("📋 Testing Queries with:");
  console.log(`   Project ID: ${projectId}`);
  console.log(`   User ID: ${userId}\n`);

  // Query 1: Get all tasks for a project (populate assigned user)
  console.log("1️⃣  Get all tasks for a project (with assigned user):");
  const projectTasks = await Task.find({ project: projectId })
    .populate("assignedTo", "name email")
    .exec();
  
  console.log(`   Found ${projectTasks.length} tasks:`);
  projectTasks.forEach(task => {
    console.log(`   - ${task.title} [${task.status}]`);
    console.log(`     Assigned to: ${task.assignedTo ? task.assignedTo.name + ' (' + task.assignedTo.email + ')' : 'Unassigned'}`);
    console.log(`     Priority: ${task.priority}`);
  });
  console.log();

  // Query 2: Get project with tasks populated (nested populate)
  console.log("2️⃣  Get project with tasks populated (nested populate):");
  const projectWithTasks = await Project.findById(projectId)
    .populate({
      path: "tasks",
      populate: {
        path: "assignedTo",
        select: "name email"
      }
    })
    .exec();
  
  console.log(`   Project: ${projectWithTasks.name}`);
  console.log(`   Description: ${projectWithTasks.description}`);
  console.log(`   Owner: ${projectWithTasks.owner}`);
  console.log(`   Members: ${projectWithTasks.members.length}`);
  console.log(`   Tasks (${projectWithTasks.tasks.length}):`);
  projectWithTasks.tasks.forEach(task => {
    console.log(`   - ${task.title} [${task.status}, ${task.priority}]`);
    console.log(`     Assigned: ${task.assignedTo ? task.assignedTo.name : 'Unassigned'}`);
  });
  console.log();

  // Query 3: Get all tasks assigned to a user across projects
  console.log("3️⃣  Get all tasks assigned to a user across projects:");
  const userTasks = await Task.find({ assignedTo: userId })
    .populate("project", "name")
    .exec();
  
  console.log(`   Found ${userTasks.length} tasks assigned to ${user.name}:`);
  userTasks.forEach(task => {
    console.log(`   - ${task.title} [${task.status}]`);
    console.log(`     Project: ${task.project.name}`);
    console.log(`     Priority: ${task.priority}`);
  });
  console.log();

  // Bonus Query: Get user with projects populated
  console.log("4️⃣  Bonus - Get user with projects populated:");
  const userWithProjects = await User.findById(userId)
    .populate("projects", "name description")
    .exec();
  
  console.log(`   User: ${userWithProjects.name} (${userWithProjects.email})`);
  console.log(`   Projects (${userWithProjects.projects.length}):`);
  userWithProjects.projects.forEach(proj => {
    console.log(`   - ${proj.name}: ${proj.description}`);
  });
  console.log();

  console.log("✅ All queries executed successfully!");
  console.log("\n📝 These queries will be used by:");
  console.log("   - Kanban UI (Query 1 & 2)");
  console.log("   - User Dashboard (Query 3 & 4)");
  console.log("   - Project Management APIs");

  await mongoose.disconnect();
}

testQueries().catch(err => {
  console.error("❌ Error:", err);
  mongoose.disconnect();
});
