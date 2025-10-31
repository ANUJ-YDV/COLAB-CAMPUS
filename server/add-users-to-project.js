// Add all users as members to the Demo Project
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';
import Project from './models/project.js';

dotenv.config();

async function addUsersToProject() {
  try {
    console.log('\n🔧 Adding users to Demo Project...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the Demo Project
    const project = await Project.findOne({ name: 'Demo Project' });
    if (!project) {
      console.log('❌ Demo Project not found');
      process.exit(1);
    }

    console.log(`📋 Found project: ${project.name}`);
    console.log(`   Current members: ${project.members.length}\n`);

    // Get all users
    const users = await User.find();
    console.log(`👥 Found ${users.length} users\n`);

    // Add all users to the project if not already members
    let added = 0;
    for (const user of users) {
      const isAlreadyMember = project.members.some(
        (memberId) => memberId.toString() === user._id.toString()
      );

      if (!isAlreadyMember) {
        project.members.push(user._id);
        console.log(`✅ Added ${user.email} to project`);
        added++;
      } else {
        console.log(`ℹ️  ${user.email} is already a member`);
      }

      // Also add project to user's projects array if not there
      if (!user.projects.includes(project._id)) {
        user.projects.push(project._id);
        await user.save();
      }
    }

    // Save the project
    await project.save();

    console.log(`\n✅ Added ${added} new member(s)`);
    console.log(`📋 Project now has ${project.members.length} total members\n`);
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

addUsersToProject();
