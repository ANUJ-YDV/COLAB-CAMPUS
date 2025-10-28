// Helper script to get JWT token and Project ID for room testing
// Run: node server/get-room-test-data.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Project from "./models/project.js";
import jwt from "jsonwebtoken";

dotenv.config();

async function getTestData() {
  try {
    console.log("\n🔍 Fetching test data for room functionality...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get a user
    const user = await User.findOne();
    if (!user) {
      console.log("❌ No users found in database");
      console.log("💡 Create a user first by signing up or running: npm run seed\n");
      process.exit(1);
    }

    console.log("👤 Found User:");
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user._id}\n`);

    // Generate JWT token for this user
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("🔑 Generated JWT Token:");
    console.log(`   ${token}\n`);

    // Get a project that this user is a member of
    const project = await Project.findOne({
      members: user._id
    });

    if (!project) {
      console.log("❌ No projects found where this user is a member");
      console.log("💡 Create a project first or run: npm run seed\n");
      
      // Try to get any project
      const anyProject = await Project.findOne();
      if (anyProject) {
        console.log("📋 Found a project (but user is NOT a member):");
        console.log(`   Name: ${anyProject.name}`);
        console.log(`   ID: ${anyProject._id}`);
        console.log(`   Members: ${anyProject.members.length}`);
        console.log("\n⚠️  If you use this project ID, the test will fail (which is expected)");
        console.log("   because the user is not a member.\n");
      }
      process.exit(1);
    }

    console.log("📋 Found Project:");
    console.log(`   Name: ${project.name}`);
    console.log(`   ID: ${project._id}`);
    console.log(`   Members: ${project.members.length}\n`);

    // Check if there's a second user for multi-user testing
    const users = await User.find().limit(2);
    let secondToken = null;

    if (users.length > 1) {
      const user2 = users[1];
      
      // Check if user2 is also a member of the same project
      const isUser2Member = project.members.some(
        memberId => memberId.toString() === user2._id.toString()
      );

      if (isUser2Member) {
        secondToken = jwt.sign(
          { userId: user2._id },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        console.log("👥 Found Second User (for multi-user test):");
        console.log(`   Email: ${user2.email}`);
        console.log(`   ID: ${user2._id}`);
        console.log(`   Token: ${secondToken}\n`);
      } else {
        console.log("ℹ️  Second user exists but is not a member of this project");
        console.log("   Multi-user test will be skipped\n");
      }
    } else {
      console.log("ℹ️  Only one user found - multi-user test will be skipped\n");
    }

    // Print configuration for test file
    console.log("═══════════════════════════════════════════════════════");
    console.log("📝 UPDATE test-room-functionality.js WITH THESE VALUES:");
    console.log("═══════════════════════════════════════════════════════\n");
    
    console.log(`const TOKEN_1 = "${token}";`);
    if (secondToken) {
      console.log(`const TOKEN_2 = "${secondToken}";`);
    } else {
      console.log(`const TOKEN_2 = "PASTE_USER_2_JWT_TOKEN_HERE"; // No second user available`);
    }
    console.log(`const PROJECT_ID = "${project._id}";\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("🧪 READY TO TEST!");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("1. Copy the values above into test-room-functionality.js");
    console.log("2. Make sure the server is running: npm start");
    console.log("3. Run: node server/test-room-functionality.js\n");

  } catch (error) {
    console.error("💥 Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB\n");
  }
}

getTestData();
