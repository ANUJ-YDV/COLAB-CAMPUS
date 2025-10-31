// Quick test for authentication flow
// Uses native fetch (Node.js 18+)

const BASE_URL = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣  Logging in as test user...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@collabcampus.com',
        password: 'hashedPlaceholder',
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log(`   User: ${loginData.user.name}`);
    console.log(`   Token: ${loginData.token.substring(0, 20)}...`);

    const token = loginData.token;
    // userId available for future tests

    // Step 2: Get my projects (protected route)
    console.log('\n2️⃣  Fetching my projects (protected route)...');
    const projectsResponse = await fetch(`${BASE_URL}/projects/my-projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const projectsData = await projectsResponse.json();

    if (!projectsResponse.ok) {
      console.log('❌ Failed:', projectsData.message);
    } else {
      console.log(`✅ Found ${projectsData.projects.length} project(s)`);
      projectsData.projects.forEach((p) => {
        console.log(`   - ${p.name}: ${p.description}`);
      });
    }

    // Step 3: Get my tasks (protected route)
    console.log('\n3️⃣  Fetching my tasks (protected route)...');
    const tasksResponse = await fetch(`${BASE_URL}/tasks/my-tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const tasksData = await tasksResponse.json();

    if (!tasksResponse.ok) {
      console.log('❌ Failed:', tasksData.message);
    } else {
      console.log(`✅ Found ${tasksData.tasks.length} task(s) assigned to me`);
      tasksData.tasks.forEach((t) => {
        console.log(`   - ${t.title} [${t.status}] - Priority: ${t.priority}`);
      });
    }

    // Step 4: Test without token (should fail)
    console.log('\n4️⃣  Testing protected route without token...');
    const noTokenResponse = await fetch(`${BASE_URL}/projects/my-projects`);
    const noTokenData = await noTokenResponse.json();

    if (noTokenResponse.status === 401) {
      console.log('✅ Correctly rejected: ' + noTokenData.message);
    } else {
      console.log("❌ Should have been rejected but wasn't!");
    }

    // Step 5: Create a new project (protected)
    console.log('\n5️⃣  Creating a new project (protected route)...');
    const createResponse = await fetch(`${BASE_URL}/projects/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Auth Project',
        description: 'Created via authenticated request',
        memberIds: [],
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.log('❌ Failed:', createData.message);
    } else {
      console.log(`✅ Project created: ${createData.project.name}`);
      console.log(`   ID: ${createData.project._id}`);
      console.log(`   Owner: ${createData.project.owner}`);
    }

    console.log('\n🎉 Authentication flow test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuthFlow();
