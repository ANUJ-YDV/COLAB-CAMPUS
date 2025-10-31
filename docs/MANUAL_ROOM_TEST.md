# Manual Room Functionality Test

Since the automated test requires the server to be running in a separate terminal, here's a manual testing guide you can follow:

## Setup

### Terminal 1: Start the Server
```powershell
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
npm start
```

Keep this terminal open and running!

### Terminal 2: Run the Tests
In a **NEW** PowerShell window:
```powershell
cd "c:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS\server"
node test-room-functionality.js
```

## What to Expect

### Test 1: Join Valid Project ✅
- **Should PASS**: User successfully joins the Demo Project
- **Server log**: `✅ anuj@example.com joined project: Demo Project`
- **Test receives**: `joined_project` event with project details

### Test 2: Join Invalid Project ❌
- **Should PASS**: Server rejects non-existent project
- **Server log**: `❌ Project not found`
- **Test receives**: `error_message` event

### Test 3: Join Without ProjectId ❌
- **Should PASS**: Server validates required parameters
- **Test receives**: `error_message` event about missing projectId

### Test 4: Leave Project 🚪
- **Should PASS**: User successfully leaves project room
- **Server log**: `🚪 anuj@example.com left project room`

### Test 5: Multi-User Presence 👥
- **Should PASS**: Two users see each other join/leave
- **User 1 receives**: `user_joined` when User 2 joins
- **User 1 receives**: `user_left` when User 2 leaves
- **Server logs**: Both users joining and leaving

## Alternative: Browser Testing

If the automated tests don't work, you can test using the browser DevTools Console:

### 1. Start the Server
```powershell
cd server
npm start
```

### 2. Open Browser
Open http://localhost:3000 (if React app is running)

Or create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Socket.io Room Test</title>
    <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
</head>
<body>
    <h1>Socket.io Room Test</h1>
    <div id="status"></div>
    <div id="messages"></div>

    <script>
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZjZTc4ZTA0YTYwOTRlZWIzYWE4ZWEiLCJpYXQiOjE3NjE2ODYzODAsImV4cCI6MTc2MTc3Mjc4MH0.7NqTO0oQObnJuZrlxTxXeZ-NylLTyEkm8EBeo7NM8kk";
        const projectId = "6900ebd4a6305efc84cffebc";

        const socket = io("http://localhost:5000", {
            auth: { token }
        });

        function log(message) {
            document.getElementById("messages").innerHTML += `<p>${message}</p>`;
            console.log(message);
        }

        socket.on("connect", () => {
            log(`✅ Connected: ${socket.id}`);
            document.getElementById("status").innerHTML = "Status: Connected";
            
            // Join project after connect
            setTimeout(() => {
                log(`📤 Joining project: ${projectId}`);
                socket.emit("join_project", { projectId });
            }, 500);
        });

        socket.on("welcome", (data) => {
            log(`👋 ${data.message}`);
        });

        socket.on("joined_project", (data) => {
            log(`✅ Joined project: ${data.projectName || data.projectId}`);
        });

        socket.on("user_joined", (data) => {
            log(`👤 User joined: ${data.user} (${data.email})`);
        });

        socket.on("user_left", (data) => {
            log(`🚪 User left: ${data.user}`);
        });

        socket.on("error_message", (data) => {
            log(`❌ Error: ${data.message}`);
        });

        socket.on("connect_error", (err) => {
            log(`❌ Connection error: ${err.message}`);
            document.getElementById("status").innerHTML = "Status: Connection Failed";
        });

        socket.on("disconnect", (reason) => {
            log(`🔌 Disconnected: ${reason}`);
            document.getElementById("status").innerHTML = "Status: Disconnected";
        });

        // Make socket global for manual testing
        window.socket = socket;
        window.projectId = projectId;
    </script>
</body>
</html>
```

Save as `socket-test.html` and open in browser.

### 3. Test in DevTools Console

```javascript
// Test join_project
socket.emit("join_project", { projectId: "6900ebd4a6305efc84cffebc" });

// Test leave_project
socket.emit("leave_project", { projectId: "6900ebd4a6305efc84cffebc" });

// Test invalid project
socket.emit("join_project", { projectId: "000000000000000000000000" });

// Check connection status
socket.connected // should be true
```

## Quick Server Log Check

When tests run successfully, you should see in the server terminal:

```
✅ anuj@example.com joined project: Demo Project
👤 Broadcasting user_joined to project room
🚪 anuj@example.com left project room: 6900ebd4a6305efc84cffebc
❌ Project not found: 000000000000000000000000
```

## Troubleshooting

### "xhr poll error"
- **Cause**: Server not running or not accessible
- **Fix**: Make sure server is running in a separate terminal

### "Connection error: Authentication error"
- **Cause**: JWT token expired or invalid
- **Fix**: Run `node server/get-room-test-data.js` to get new tokens

### "Project not found" for valid project
- **Cause**: User not a member
- **Fix**: Run `node server/add-users-to-project.js`

### No events received
- **Cause**: Event listeners not set up before emitting
- **Fix**: Wait for `connect` event before emitting

## Success Criteria

✅ User can join a valid project they're a member of  
✅ Server rejects invalid/non-existent projects  
✅ Server validates required parameters  
✅ User can leave a project room  
✅ Other users in the room receive user_joined broadcasts  
✅ Other users receive user_left when someone leaves  

---

**Note**: The tokens in test-room-functionality.js are valid for 24 hours. If tests fail with auth errors, regenerate tokens using:
```powershell
node server/get-room-test-data.js
```
