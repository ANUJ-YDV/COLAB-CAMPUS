// server/seeds/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, "../.env") });

import User from "../models/user.js";
import Project from "../models/project.js";
import Task from "../models/task.js";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("🌱 Starting seed...");

  // Clear existing data (optional - remove if you want to keep existing data)
  await User.deleteMany({ email: "test@collabcampus.com" });
  await Project.deleteMany({ name: "Demo Project" });

  // create user
  const user = await User.create({ 
    name: "Test User", 
    email: "test@collabcampus.com", 
    password: "hashedPlaceholder" 
  });
  console.log("✅ Created user:", user.name);

  // create project
  const project = await Project.create({ 
    name: "Demo Project", 
    description: "Seeded project", 
    owner: user._id, 
    members: [user._id] 
  });
  console.log("✅ Created project:", project.name);

  // create tasks
  const t1 = await Task.create({ 
    title: "Design README", 
    project: project._id, 
    status: "todo", 
    assignedTo: user._id,
    priority: "high"
  });
  console.log("✅ Created task 1:", t1.title);

  const t2 = await Task.create({ 
    title: "Create Kanban UI", 
    project: project._id, 
    status: "in-progress",
    priority: "medium"
  });
  console.log("✅ Created task 2:", t2.title);

  // Add tasks to project
  await Project.findByIdAndUpdate(project._id, { 
    $push: { tasks: { $each: [t1._id, t2._id] } } 
  });
  console.log("✅ Added tasks to project");

  // Add project to user
  await User.findByIdAndUpdate(user._id, {
    $push: { projects: project._id }
  });
  console.log("✅ Added project to user");

  console.log("\n🎉 Seed completed successfully!");
  console.log("User ID:", user._id.toString());
  console.log("Project ID:", project._id.toString());
  console.log("Task 1 ID:", t1._id.toString());
  console.log("Task 2 ID:", t2._id.toString());

  mongoose.disconnect();
}

seed().catch(err => { 
  console.error("❌ Seed error:", err); 
  mongoose.disconnect(); 
});
