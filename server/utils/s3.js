// server/utils/s3.js
// AWS S3 Client Configuration and Utilities

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 Client with credentials from environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3;

/**
 * Test S3 connection by listing all buckets
 * This will verify that credentials are correct and S3 is accessible
 */
export async function testS3() {
  try {
    console.log('\n🔍 Testing S3 Connection...');
    console.log('Region:', process.env.AWS_REGION);
    console.log('Bucket:', process.env.AWS_BUCKET_NAME);

    const res = await s3.send(new ListBucketsCommand({}));

    console.log('✅ S3 Connected Successfully!');
    console.log('📦 Available Buckets:');
    res.Buckets.forEach((bucket) => {
      const isTarget = bucket.Name === process.env.AWS_BUCKET_NAME;
      console.log(`   ${isTarget ? '✓' : '•'} ${bucket.Name}${isTarget ? ' (TARGET)' : ''}`);
    });

    // Check if our target bucket exists
    const bucketExists = res.Buckets.some((b) => b.Name === process.env.AWS_BUCKET_NAME);
    if (bucketExists) {
      console.log('✅ Target bucket found and accessible!');
    } else {
      console.log('⚠️  Warning: Target bucket not found in list');
    }

    return true;
  } catch (err) {
    console.error('\n❌ S3 Connection Error:');
    console.error('Error Code:', err.Code || err.name);
    console.error('Error Message:', err.message);

    if (err.Code === 'InvalidAccessKeyId') {
      console.error('💡 Fix: Check your AWS_ACCESS_KEY_ID in .env file');
    } else if (err.Code === 'SignatureDoesNotMatch') {
      console.error('💡 Fix: Check your AWS_SECRET_ACCESS_KEY in .env file');
    } else if (err.message.includes('Could not load credentials')) {
      console.error('💡 Fix: Make sure AWS credentials are set in .env file');
    }

    return false;
  }
}
