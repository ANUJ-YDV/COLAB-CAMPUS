// Quick script to get a JWT token for testing
// Run: node server/get-test-token.js

const BASE_URL = "http://localhost:5000";

// Test user credentials - you can modify these
const testUser = {
  email: "test@example.com",
  password: "password123"
};

console.log("\n🔑 Getting JWT Token for Socket.io Testing\n");
console.log("Attempting to login with:", testUser.email);

// Try to login
fetch(`${BASE_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testUser)
})
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      console.log("\n✅ Login successful!");
      console.log("\n📋 Copy this token for testing:\n");
      console.log(data.token);
      console.log("\n💡 Paste this into test-socket-connection.js as VALID_TOKEN");
      console.log("   Then run: node server/test-socket-connection.js\n");
    } else {
      console.log("\n❌ Login failed. Response:");
      console.log(data);
      console.log("\n💡 Try one of these options:");
      console.log("   1. Update the testUser credentials in this file");
      console.log("   2. Register a new user via /api/auth/register");
      console.log("   3. Use an existing user's credentials\n");
    }
  })
  .catch(err => {
    console.log("\n❌ Error connecting to server:", err.message);
    console.log("💡 Make sure the server is running on port 5000\n");
  });
