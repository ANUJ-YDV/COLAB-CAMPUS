# AWS S3 Integration - Complete Setup Guide

## ✅ Implementation Complete

Successfully integrated AWS S3 for file uploads with your COLAB CAMPUS application.

---

## 📦 Packages Installed

```bash
@aws-sdk/client-s3@latest
@aws-sdk/s3-request-presigner@latest
```

**Location:** `server/package.json`

---

## 🔐 AWS Configuration

### Environment Variables Added

**File:** `server/.env`

```env
# AWS S3 Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_BUCKET_NAME=collabcampus-storage
```

### Region Details
- **Region Code:** `ap-south-1`
- **Region Name:** Asia Pacific (Mumbai)
- **Bucket Name:** `collabcampus-storage`

---

## 📁 Files Created

### 1. `server/utils/s3.js`

**Purpose:** S3 Client configuration and utilities

**Key Features:**
- ✅ S3Client initialization with credentials
- ✅ `testS3()` function to verify connection
- ✅ Bucket listing functionality
- ✅ Comprehensive error handling
- ✅ Helpful debug messages

**Exports:**
```javascript
export default s3;           // S3Client instance
export async function testS3(); // Connection test
```

### 2. `server/server.js` (Modified)

**Changes:**
- ✅ Added `import { testS3 } from "./utils/s3.js";`
- ✅ Added AWS environment variable checks
- ✅ Calls `testS3()` on server startup

**Console Output on Start:**
```
Environment variables loaded:
MONGO_URI: ✓ Loaded
PORT: 5000
JWT_SECRET: ✓ Loaded
AWS_REGION: ✓ Loaded
AWS_BUCKET_NAME: ✓ Loaded

🔍 Testing S3 Connection...
Region: ap-south-1
Bucket: collabcampus-storage
✅ S3 Connected Successfully!
📦 Available Buckets:
   ✓ collabcampus-storage (TARGET)
✅ Target bucket found and accessible!
```

### 3. `server/routes/conversationRoutes.js` (Fixed)

**Bug Fix:**
- Changed `import { authenticate }` to `import { protect }`
- Matches the actual export from `authmiddleware.js`

---

## 🧪 Testing

### Connection Test

**Command:**
```bash
cd server
npm start
```

**Expected Output:**
```
✅ S3 Connected Successfully!
✅ Target bucket found and accessible!
```

### Verify S3 Client

The `testS3()` function runs automatically on server startup and:
1. Lists all available S3 buckets
2. Verifies your target bucket exists
3. Confirms credentials are valid
4. Shows region and bucket configuration

---

## 🚨 IMPORTANT SECURITY NOTES

### 1. Credentials Exposure

⚠️ **YOUR AWS CREDENTIALS ARE NOW IN THIS CHAT!**

**Immediate Actions Required:**

1. **Rotate Credentials:**
   - Go to AWS IAM Console
   - Users → Your User → Security Credentials
   - Delete current Access Key
   - Create new Access Key
   - Update `.env` file with new credentials

2. **Enable MFA:**
   - Add Multi-Factor Authentication to AWS account
   - Prevents unauthorized access

3. **Restrict Permissions:**
   - Ensure IAM user only has S3 permissions
   - Principle of least privilege

### 2. .env File Security

**Verify `.gitignore`:**

```bash
# Check if .env is in .gitignore
cat .gitignore | grep .env
```

**Add if missing:**
```bash
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

**Never commit:**
- `.env` files
- AWS credentials
- API keys
- Secrets

### 3. Production Best Practices

For production deployment:

1. **Use AWS IAM Roles** (for EC2/ECS)
2. **Use AWS Secrets Manager**
3. **Use Environment Variables** (not .env files)
4. **Enable CloudTrail** for audit logs
5. **Set up CloudWatch** for monitoring

---

## 🔧 S3 Client Usage

### Basic Usage

```javascript
import s3 from "./utils/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Upload a file
const uploadFile = async (fileBuffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: 'image/jpeg' // or appropriate type
  };

  const command = new PutObjectCommand(params);
  const result = await s3.send(command);
  return result;
};
```

### Generate Pre-signed URL

```javascript
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const getFileUrl = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName
  });

  // URL expires in 1 hour
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
};
```

---

## 📝 Next Steps

### 1. Remove Test Code (Optional)

Once verified, you can remove the test from `server.js`:

```javascript
// Remove or comment out this line after testing
// testS3();
```

### 2. Implement File Upload

Create upload endpoint:

**File:** `server/routes/uploadRoutes.js`

```javascript
import express from 'express';
import multer from 'multer';
import { uploadToS3 } from '../controllers/uploadController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', protect, upload.single('file'), uploadToS3);

export default router;
```

**File:** `server/controllers/uploadController.js`

```javascript
import s3 from '../utils/s3.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export const uploadToS3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${uuidv4()}-${req.file.originalname}`;
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    res.json({
      message: 'File uploaded successfully',
      fileName,
      fileUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};
```

### 3. Configure Bucket Permissions

Ensure your S3 bucket has proper CORS configuration:

**AWS Console → S3 → collabcampus-storage → Permissions → CORS**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 4. Set Bucket Policy (if needed)

For public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::collabcampus-storage/*"
    }
  ]
}
```

⚠️ **Warning:** Only use public access if files should be publicly accessible!

---

## 🐛 Troubleshooting

### Issue: "Access Denied"

**Cause:** IAM user lacks S3 permissions

**Fix:**
1. AWS Console → IAM → Users → Your User
2. Add policy: `AmazonS3FullAccess` (or custom restrictive policy)

### Issue: "Bucket not found"

**Cause:** Bucket name mismatch or doesn't exist

**Fix:**
```bash
# List buckets
aws s3 ls

# Create bucket if needed
aws s3 mb s3://collabcampus-storage --region ap-south-1
```

### Issue: "Invalid Access Key"

**Cause:** Credentials expired or incorrect

**Fix:**
1. Generate new Access Key in AWS IAM Console
2. Update `.env` file
3. Restart server

### Issue: "CORS Error" (from browser)

**Cause:** Bucket CORS not configured

**Fix:**
1. AWS Console → S3 → Bucket → Permissions → CORS
2. Add CORS configuration (see above)

---

## 📊 Testing Checklist

- [x] AWS SDK installed
- [x] Credentials added to .env
- [x] S3 client configured
- [x] Connection test passes
- [x] Bucket verified
- [x] Server starts without errors
- [ ] Upload endpoint created (next step)
- [ ] File upload tested (next step)
- [ ] CORS configured (if needed)
- [ ] Credentials rotated (security)

---

## 🎯 Summary

**What's Working:**
✅ S3 Client initialized  
✅ Credentials configured  
✅ Connection verified  
✅ Bucket accessible  
✅ Error handling in place  
✅ Debug logging enabled  

**What's Next:**
1. Rotate AWS credentials (security)
2. Implement file upload endpoint
3. Configure bucket CORS
4. Test file uploads from client
5. Add file type validation
6. Implement file size limits

---

**Setup Date:** October 30, 2025  
**Status:** ✅ Complete and tested  
**Bucket:** collabcampus-storage  
**Region:** ap-south-1 (Mumbai)
