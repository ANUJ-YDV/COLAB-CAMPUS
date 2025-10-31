# S3 CORS Configuration Guide

## 📋 What is CORS?
CORS (Cross-Origin Resource Security) allows your frontend (running on `http://localhost:3000`) to make requests to your S3 bucket.

Without CORS, browsers block frontend requests to S3 due to security policies.

---

## 🎯 Configuration File Created
**Location:** `server/utils/s3-cors-config.json`

This allows:
- ✅ Frontend at `http://localhost:3000` to upload/download files
- ✅ Backend at `http://localhost:5000` to generate presigned URLs
- ✅ Methods: GET, PUT, POST, DELETE, HEAD
- ✅ All headers allowed (for flexibility)

---

## 🔧 Method 1: Apply CORS via AWS Console (Easiest)

### Step 1: Open AWS Console
1. Go to: https://console.aws.amazon.com/s3/
2. Sign in with your credentials
3. Select region: **Asia Pacific (Mumbai) ap-south-1**

### Step 2: Navigate to Your Bucket
1. Click on bucket: **collabcampus-storage**

### Step 3: Apply CORS Configuration
1. Click **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Copy the contents of `server/utils/s3-cors-config.json`
5. Paste into the CORS configuration editor
6. Click **Save changes**

### Step 4: Verify
- You should see "Successfully edited CORS configuration"
- The CORS rules will appear in the Permissions tab

---

## 🔧 Method 2: Apply CORS via AWS CLI (Advanced)

If you have AWS CLI installed:

```powershell
# Navigate to server directory
cd server/utils

# Apply CORS configuration
aws s3api put-bucket-cors --bucket collabcampus-storage --cors-configuration file://s3-cors-config.json --region ap-south-1
```

---

## 🧪 Testing CORS

### From Frontend (React):
```javascript
// Try uploading a file directly from browser
const testCorsUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData
  });
  
  console.log('Upload successful:', await response.json());
};
```

### Expected Behavior:
- ✅ **With CORS**: Upload succeeds, no browser console errors
- ❌ **Without CORS**: Browser shows error:
  ```
  Access to fetch at 'https://collabcampus-storage.s3.ap-south-1.amazonaws.com/...' 
  from origin 'http://localhost:3000' has been blocked by CORS policy
  ```

---

## 🔒 Production Configuration

When deploying to production, update `AllowedOrigins`:

```json
"AllowedOrigins": [
  "https://your-production-domain.com",
  "http://localhost:3000"
]
```

**Important:** Replace `your-production-domain.com` with your actual domain.

---

## 📝 Common Issues

### Issue 1: "CORS configuration not applied"
**Solution:** Make sure you clicked **Save changes** in AWS Console

### Issue 2: Still getting CORS errors after applying
**Solution:** 
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)
- Wait 1-2 minutes for AWS to propagate changes

### Issue 3: "Access Denied" when applying CORS
**Solution:** Your IAM user needs `s3:PutBucketCORS` permission

---

## ✅ Verification Checklist
- [ ] CORS configuration file created (`s3-cors-config.json`)
- [ ] CORS applied via AWS Console or CLI
- [ ] "Successfully edited CORS configuration" message received
- [ ] CORS rules visible in bucket Permissions tab
- [ ] Frontend can upload files without CORS errors
- [ ] Browser console shows no cross-origin errors

---

## 🎯 Next Steps After CORS Setup
1. Implement file upload endpoint in `server/routes/projectRoutes.js`
2. Add file upload UI component in frontend
3. Test file uploads from React frontend
4. Implement file deletion functionality
5. Add file size/type validation

---

## 🆘 Need Help?
If CORS setup fails, check:
1. Bucket name is correct: `collabcampus-storage`
2. Region is correct: `ap-south-1`
3. Your AWS user has S3 permissions
4. CORS JSON is valid (no syntax errors)

**Reference:** AWS CORS Documentation
https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html
