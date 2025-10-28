// Socket.io client connection utility
import { io } from "socket.io-client";

const SERVER = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

/**
 * Creates and configures a Socket.io connection to the server
 * @param {string} token - JWT authentication token
 * @param {Object} options - Optional configuration
 * @param {Function} options.onTokenExpired - Callback when token is expired/invalid
 * @returns {Socket} - Socket.io client instance
 */
export function createSocket(token, options = {}) {
  const socket = io(SERVER, {
    auth: { token }, // Token sent on handshake via ws authentication payload
    transports: ["websocket", "polling"], // Prefer websocket, fallback to polling
    reconnection: true,                   // Enable auto-reconnection
    reconnectionDelay: 1000,              // Wait 1s before reconnecting
    reconnectionAttempts: 5,              // Try 5 times max
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
    
    // Handle token expiration/unauthorized
    if (err.message === "Unauthorized") {
      console.log("🔒 Token is invalid or expired");
      
      // Call custom handler if provided
      if (options.onTokenExpired) {
        options.onTokenExpired();
      } else {
        // Default behavior: logout
        console.log("💡 Consider implementing token refresh or re-login");
        // Uncomment for automatic logout:
        // localStorage.clear();
        // window.location.href = '/login';
      }
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
    
    if (reason === "io server disconnect") {
      // Server disconnected us, maybe due to token expiration
      console.log("⚠️ Server disconnected the socket");
    }
  });

  socket.on("welcome", (data) => {
    console.log("📩 Server message:", data.message);
  });

  return socket;
}

/**
 * Get the server URL for API requests
 * @returns {string} - Server base URL
 */
export function getServerUrl() {
  return SERVER;
}
