// Quick script to verify MongoDB data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function verifyData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // Get collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📦 Collections found:', collections.map((c) => c.name).join(', '));
  console.log();

  // Query users
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find().lean();
  console.log(`👥 Users (${users.length}):`);
  users.forEach((u) => {
    console.log(`  - ${u.name} (${u.email})`);
    console.log(`    ID: ${u._id}`);
    console.log(`    Projects: ${u.projects?.length || 0}`);
  });
  console.log();

  // Query projects
  const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
  const projects = await Project.find().lean();
  console.log(`📁 Projects (${projects.length}):`);
  projects.forEach((p) => {
    console.log(`  - ${p.name}`);
    console.log(`    ID: ${p._id}`);
    console.log(`    Owner: ${p.owner}`);
    console.log(`    Members: ${p.members?.length || 0}`);
    console.log(`    Tasks: ${p.tasks?.length || 0}`);
  });
  console.log();

  // Query tasks
  const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }));
  const tasks = await Task.find().lean();
  console.log(`✅ Tasks (${tasks.length}):`);
  tasks.forEach((t) => {
    console.log(`  - ${t.title}`);
    console.log(`    ID: ${t._id}`);
    console.log(`    Status: ${t.status}`);
    console.log(`    Priority: ${t.priority}`);
    console.log(`    Assigned to: ${t.assignedTo || 'Unassigned'}`);
    console.log(`    Project: ${t.project}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Verification complete!');
}

verifyData().catch((err) => {
  console.error('❌ Error:', err);
  mongoose.disconnect();
});
