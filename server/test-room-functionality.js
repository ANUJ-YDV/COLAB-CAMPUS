// Test Socket.io Project Room Functionality
// Tests: join_project, leave_project, user presence broadcasting
// Run: node server/test-room-functionality.js

import { io } from 'socket.io-client';
// mongoose available for future database tests
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🧪 Testing Socket.io Project Room Functionality\n');
console.log('═══════════════════════════════════════════════════════\n');

// ⚠️ CONFIGURATION - Update these values
const SERVER_URL = 'http://localhost:5000';
const TOKEN_1 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZjZTc4ZTA0YTYwOTRlZWIzYWE4ZWEiLCJpYXQiOjE3NjE2ODYzODAsImV4cCI6MTc2MTc3Mjc4MH0.7NqTO0oQObnJuZrlxTxXeZ-NylLTyEkm8EBeo7NM8kk'; // anuj@example.com
const TOKEN_2 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZjZWUyZDY3MDIxMDRkZTljYzZkZjciLCJpYXQiOjE3NjE2ODYzODAsImV4cCI6MTc2MTc3Mjc4MH0.bK71LuIjTSS-n-YEemz0eXGm9IK_ugGRvJm9-rzSy6Q'; // test@example.com
const PROJECT_ID = '6900ebd4a6305efc84cffebc'; // Demo Project
const INVALID_PROJECT_ID = '000000000000000000000000'; // Non-existent project

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, message) {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASSED' : 'FAILED';
  console.log(`${icon} ${name}: ${status}`);
  if (message) console.log(`   ${message}`);

  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: Join a valid project
// ═══════════════════════════════════════════════════════════════
function test1_joinValidProject() {
  return new Promise((resolve) => {
    console.log('📡 Test 1: Join a valid project\n');

    const socket = io(SERVER_URL, {
      auth: { token: TOKEN_1 },
    });

    let joined = false;

    socket.on('connect', () => {
      console.log(`   🔌 Connected with socket ID: ${socket.id}`);

      // Emit join_project event
      console.log(`   📤 Emitting join_project with projectId: ${PROJECT_ID}`);
      socket.emit('join_project', { projectId: PROJECT_ID });
    });

    socket.on('joined_project', (data) => {
      joined = true;
      logTest('Test 1', true, `Joined project: ${data.projectName || data.projectId}`);
      console.log(`   📥 Server response:`, data);

      socket.disconnect();
      setTimeout(resolve, 500);
    });

    socket.on('error_message', (data) => {
      logTest('Test 1', false, `Error: ${data.message}`);
      socket.disconnect();
      setTimeout(resolve, 500);
    });

    socket.on('connect_error', (err) => {
      logTest('Test 1', false, `Connection error: ${err.message}`);
      logTest('', false, '💡 Hint: Make sure TOKEN_1 is a valid JWT');
      setTimeout(resolve, 500);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!joined) {
        logTest('Test 1', false, 'Timeout - no joined_project event received');
        logTest('', false, '💡 Hint: Make sure PROJECT_ID is valid and user is a member');
        socket.disconnect();
      }
      resolve();
    }, 5000);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: Join an invalid/non-existent project
// ═══════════════════════════════════════════════════════════════
function test2_joinInvalidProject() {
  return new Promise((resolve) => {
    console.log('\n📡 Test 2: Join a non-existent project (should fail)\n');

    const socket = io(SERVER_URL, {
      auth: { token: TOKEN_1 },
    });

    let errorReceived = false;

    socket.on('connect', () => {
      console.log(`   🔌 Connected with socket ID: ${socket.id}`);
      console.log(`   📤 Emitting join_project with invalid ID: ${INVALID_PROJECT_ID}`);
      socket.emit('join_project', { projectId: INVALID_PROJECT_ID });
    });

    socket.on('error_message', (data) => {
      errorReceived = true;
      logTest('Test 2', true, `Error correctly returned: ${data.message}`);
      socket.disconnect();
      setTimeout(resolve, 500);
    });

    socket.on('joined_project', (_data) => {
      logTest('Test 2', false, 'Should not join non-existent project');
      socket.disconnect();
      setTimeout(resolve, 500);
    });

    socket.on('connect_error', (err) => {
      logTest('Test 2', false, `Connection error: ${err.message}`);
      setTimeout(resolve, 500);
    });

    setTimeout(() => {
      if (!errorReceived) {
        logTest('Test 2', false, 'No error_message received for invalid project');
      }
      socket.disconnect();
      resolve();
    }, 5000);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: Join without projectId parameter
// ═══════════════════════════════════════════════════════════════
function test3_joinWithoutProjectId() {
  return new Promise((resolve) => {
    console.log('\n📡 Test 3: Join without projectId (should fail)\n');

    const socket = io(SERVER_URL, {
      auth: { token: TOKEN_1 },
    });

    let errorReceived = false;

    socket.on('connect', () => {
      console.log(`   🔌 Connected with socket ID: ${socket.id}`);
      console.log(`   📤 Emitting join_project without projectId`);
      socket.emit('join_project', {}); // No projectId
    });

    socket.on('error_message', (data) => {
      errorReceived = true;
      logTest('Test 3', true, `Validation error: ${data.message}`);
      socket.disconnect();
      setTimeout(resolve, 500);
    });

    socket.on('joined_project', () => {
      logTest('Test 3', false, 'Should not join without projectId');
      socket.disconnect();
      setTimeout(resolve, 500);
    });

    setTimeout(() => {
      if (!errorReceived) {
        logTest('Test 3', false, 'No validation error received');
      }
      socket.disconnect();
      resolve();
    }, 5000);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: Leave a project
// ═══════════════════════════════════════════════════════════════
function test4_leaveProject() {
  return new Promise((resolve) => {
    console.log('\n📡 Test 4: Leave a project\n');

    const socket = io(SERVER_URL, {
      auth: { token: TOKEN_1 },
    });

    let joined = false;

    socket.on('connect', () => {
      console.log(`   🔌 Connected with socket ID: ${socket.id}`);
      console.log(`   📤 Joining project first...`);
      socket.emit('join_project', { projectId: PROJECT_ID });
    });

    socket.on('joined_project', () => {
      joined = true;
      console.log(`   ✅ Joined successfully`);
      console.log(`   📤 Now leaving project...`);

      // Leave the project
      socket.emit('leave_project', { projectId: PROJECT_ID });

      // Wait a bit then disconnect
      setTimeout(() => {
        logTest('Test 4', true, 'Left project successfully (no error)');
        socket.disconnect();
        setTimeout(resolve, 500);
      }, 1000);
    });

    socket.on('error_message', (data) => {
      if (joined) {
        logTest('Test 4', false, `Error while leaving: ${data.message}`);
      } else {
        logTest('Test 4', false, `Error while joining: ${data.message}`);
      }
      socket.disconnect();
      setTimeout(resolve, 500);
    });

    setTimeout(() => {
      if (!joined) {
        logTest('Test 4', false, 'Could not join project to test leaving');
      }
      socket.disconnect();
      resolve();
    }, 5000);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 5: Multi-user test - User presence broadcasting
// ═══════════════════════════════════════════════════════════════
function test5_multiUserPresence() {
  return new Promise((resolve) => {
    console.log('\n📡 Test 5: Multi-user presence broadcasting\n');

    if (TOKEN_2 === 'PASTE_USER_2_JWT_TOKEN_HERE') {
      logTest('Test 5', false, 'SKIPPED - TOKEN_2 not configured');
      console.log('   💡 To run this test, provide TOKEN_2 for a second user\n');
      return resolve();
    }

    const socket1 = io(SERVER_URL, { auth: { token: TOKEN_1 } });
    const socket2 = io(SERVER_URL, { auth: { token: TOKEN_2 } });

    let socket1Joined = false;
    let socket2Joined = false;
    let userJoinedEventReceived = false;
    let userLeftEventReceived = false;

    // Socket 1 joins first
    socket1.on('connect', () => {
      console.log(`   🔌 User 1 connected: ${socket1.id}`);
      socket1.emit('join_project', { projectId: PROJECT_ID });
    });

    socket1.on('joined_project', () => {
      socket1Joined = true;
      console.log(`   ✅ User 1 joined project`);

      // Now connect socket 2
      setTimeout(() => {
        console.log(`   🔌 Connecting User 2...`);
      }, 500);
    });

    // Socket 1 should receive user_joined when socket 2 joins
    socket1.on('user_joined', (data) => {
      userJoinedEventReceived = true;
      console.log(`   📥 User 1 received user_joined event:`, data);
      logTest('Test 5a', true, `user_joined broadcast received by existing user`);

      // Now have socket 2 leave
      setTimeout(() => {
        console.log(`   🚪 User 2 leaving project...`);
        socket2.emit('leave_project', { projectId: PROJECT_ID });
      }, 1000);
    });

    // Socket 1 should receive user_left when socket 2 leaves
    socket1.on('user_left', (data) => {
      userLeftEventReceived = true;
      console.log(`   📥 User 1 received user_left event:`, data);
      logTest('Test 5b', true, `user_left broadcast received by remaining user`);

      // Cleanup
      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        setTimeout(resolve, 500);
      }, 500);
    });

    // Socket 2 joins after socket 1
    socket2.on('connect', () => {
      console.log(`   🔌 User 2 connected: ${socket2.id}`);
      socket2.emit('join_project', { projectId: PROJECT_ID });
    });

    socket2.on('joined_project', () => {
      socket2Joined = true;
      console.log(`   ✅ User 2 joined project`);
    });

    socket2.on('error_message', (data) => {
      logTest('Test 5', false, `User 2 error: ${data.message}`);
      socket1.disconnect();
      socket2.disconnect();
      setTimeout(resolve, 500);
    });

    // Timeout
    setTimeout(() => {
      if (!socket1Joined || !socket2Joined) {
        logTest('Test 5', false, 'One or both users failed to join');
      } else if (!userJoinedEventReceived) {
        logTest('Test 5a', false, 'user_joined event not received');
      } else if (!userLeftEventReceived) {
        logTest('Test 5b', false, 'user_left event not received');
      }
      socket1.disconnect();
      socket2.disconnect();
      resolve();
    }, 10000);
  });
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════
async function runAllTests() {
  // Check configuration
  if (TOKEN_1 === 'PASTE_USER_1_JWT_TOKEN_HERE') {
    console.log('❌ ERROR: Please configure TOKEN_1 first!\n');
    console.log('📝 To get a token:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Run: node server/get-test-token.js');
    console.log('   3. Copy the token and paste it in this file\n');
    process.exit(1);
  }

  if (PROJECT_ID === 'PASTE_VALID_PROJECT_ID_HERE') {
    console.log('❌ ERROR: Please configure PROJECT_ID first!\n');
    console.log('📝 To get a project ID:');
    console.log('   1. Connect to MongoDB');
    console.log('   2. Run: db.projects.findOne()');
    console.log('   3. Copy the _id value\n');
    console.log('Or run: node server/verify-data.js\n');
    process.exit(1);
  }

  console.log('🚀 Starting tests...\n');
  console.log('⚠️  Make sure the server is running on', SERVER_URL);
  console.log('═══════════════════════════════════════════════════════\n');

  await test1_joinValidProject();
  await test2_joinInvalidProject();
  await test3_joinWithoutProjectId();
  await test4_leaveProject();
  await test5_multiUserPresence();

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  results.tests.forEach((test) => {
    if (test.name) {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
    }
  });

  console.log('\n───────────────────────────────────────────────────────');
  console.log(`Total: ${results.passed + results.failed} tests`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Room functionality is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.\n');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Start tests
runAllTests().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
