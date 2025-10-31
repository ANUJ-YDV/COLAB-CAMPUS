// server/scripts/checkEnv.js
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Required environment variables
const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
];

// Optional but recommended
const recommended = ['PORT', 'NODE_ENV', 'CLIENT_ORIGIN', 'GITHUB_TOKEN'];

// Check required variables
const missing = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

// Display results
console.log('\n🔍 Environment Variable Check\n');
console.log('═'.repeat(50));

if (missing.length === 0) {
  console.log('✅ All required environment variables are present\n');

  // Display loaded variables (masked)
  console.log('Required Variables:');
  required.forEach((key) => {
    const value = process.env[key];
    const masked = value.length > 10 ? `${value.substring(0, 4)}...${value.slice(-4)}` : '***';
    console.log(`  ✓ ${key}: ${masked}`);
  });
} else {
  console.error('❌ Missing required environment variables:\n');
  missing.forEach((key) => {
    console.error(`  ✗ ${key}`);
  });
  console.error('\n💡 Copy .env.example to .env and fill in the values\n');
  process.exit(1);
}

// Check recommended variables
if (missingRecommended.length > 0) {
  console.log('\n⚠️  Missing recommended environment variables:');
  missingRecommended.forEach((key) => {
    console.log(`  ! ${key}`);
  });
}

// Validate specific variables
console.log('\n🔐 Validation Checks:');

// Check JWT_SECRET length
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('  ⚠️  JWT_SECRET is too short (recommended: 32+ characters)');
} else {
  console.log('  ✓ JWT_SECRET length is adequate');
}

// Check MongoDB URI format
if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
  console.error('  ✗ MONGO_URI does not appear to be a valid MongoDB connection string');
  process.exit(1);
} else {
  console.log('  ✓ MONGO_URI format looks valid');
}

// Check NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`  ℹ  NODE_ENV: ${nodeEnv}`);

if (nodeEnv === 'production') {
  console.log('\n🚀 Production mode - ensure all secrets are secure!');
} else {
  console.log('\n🛠️  Development mode');
}

console.log('\n' + '═'.repeat(50));
console.log('✅ Environment check passed!\n');
