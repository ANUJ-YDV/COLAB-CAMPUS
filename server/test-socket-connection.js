// Test Socket.io connection with JWT authentication
// Run: node server/test-socket-connection.js

import { io } from 'socket.io-client';

console.log('\n🧪 Testing Socket.io Connection with JWT Auth\n');

// ⚠️ REPLACE THIS with a real JWT token from your login endpoint
// You can get a token by:
// 1. POST to http://localhost:5000/api/auth/login
// 2. Copy the token from the response
const VALID_TOKEN = 'PASTE_YOUR_JWT_TOKEN_HERE';

// Test 1: Connection with valid token
console.log('📡 Test 1: Connecting with valid token...');
const socketWithToken = io('http://localhost:5000', {
  auth: { token: VALID_TOKEN },
});

socketWithToken.on('connect', () => {
  console.log('✅ Test 1 PASSED: Connected with socket ID:', socketWithToken.id);
});

socketWithToken.on('welcome', (data) => {
  console.log('📩 Welcome message received:', data.message);

  // Disconnect after receiving welcome
  setTimeout(() => {
    console.log('🔌 Disconnecting from server...\n');
    socketWithToken.disconnect();

    // Run test 2 after disconnect
    setTimeout(runTest2, 1000);
  }, 1000);
});

socketWithToken.on('connect_error', (err) => {
  console.log('❌ Test 1 FAILED:', err.message);
  console.log('💡 Hint: Make sure you replaced VALID_TOKEN with a real JWT\n');
  process.exit(1);
});

socketWithToken.on('disconnect', (reason) => {
  console.log('✅ Test 1: Disconnected successfully. Reason:', reason);
});

// Test 2: Connection without token (should fail)
function runTest2() {
  console.log('\n📡 Test 2: Connecting WITHOUT token (should fail)...');
  const socketNoToken = io('http://localhost:5000', {
    auth: {}, // No token provided
  });

  socketNoToken.on('connect', () => {
    console.log('❌ Test 2 FAILED: Should not connect without token!');
    socketNoToken.disconnect();
    process.exit(1);
  });

  socketNoToken.on('connect_error', (err) => {
    console.log('✅ Test 2 PASSED: Connection rejected as expected');
    console.log('   Error message:', err.message);

    // Run test 3
    setTimeout(runTest3, 1000);
  });
}

// Test 3: Connection with invalid token (should fail)
function runTest3() {
  console.log('\n📡 Test 3: Connecting with INVALID token (should fail)...');
  const socketBadToken = io('http://localhost:5000', {
    auth: { token: 'invalid.jwt.token' },
  });

  socketBadToken.on('connect', () => {
    console.log('❌ Test 3 FAILED: Should not connect with invalid token!');
    socketBadToken.disconnect();
    process.exit(1);
  });

  socketBadToken.on('connect_error', (err) => {
    console.log('✅ Test 3 PASSED: Invalid token rejected as expected');
    console.log('   Error message:', err.message);

    console.log('\n🎉 All tests passed! Socket.io auth is working correctly.\n');
    process.exit(0);
  });
}

// Cleanup on process exit
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  socketWithToken.disconnect();
  process.exit(0);
});
