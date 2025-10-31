// Socket Context Provider for managing socket connection across the app
import { createContext, useContext, useEffect, useState } from 'react';
import { createSocket } from './socket';

const SocketContext = createContext(null);

// Export SocketContext for testing purposes
export { SocketContext };

/**
 * Custom hook to access socket instance
 * @returns {Socket|null} - Socket.io client instance or null
 */
export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Socket Provider component to wrap the app
 * Automatically connects when token is available in localStorage
 * Manages online users and typing indicators
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Only connect if we have a token and it's not a mock token
    if (token && token !== 'mock-token') {
      console.log('🔌 Initializing socket connection...');
      const newSocket = createSocket(token);

      // --- PRESENCE: Listen for online users updates ---
      newSocket.on('online-users', (users) => {
        console.log(`🟢 Online users updated: ${users.length} users`);
        setOnlineUsers(users);
      });

      // --- TYPING INDICATORS: Listen for typing events ---
      newSocket.on('user-typing', ({ userId, userName, roomId }) => {
        console.log(`⌨️  ${userName} is typing in ${roomId}`);
        setTypingUsers((prev) => ({
          ...prev,
          [roomId]: [
            ...(prev[roomId] || []).filter((u) => u.id !== userId),
            { id: userId, name: userName },
          ],
        }));
      });

      newSocket.on('user-stop-typing', ({ userId, roomId }) => {
        console.log(`⏸️  User ${userId} stopped typing in ${roomId}`);
        setTypingUsers((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || []).filter((u) => u.id !== userId),
        }));
      });

      // Listen for welcome message
      newSocket.on('welcome', (data) => {
        console.log('✅ Socket connected:', data.message);
      });

      // Listen for errors
      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log('🔌 Closing socket connection...');
        newSocket.off('online-users');
        newSocket.off('user-typing');
        newSocket.off('user-stop-typing');
        newSocket.off('welcome');
        newSocket.off('connect_error');
        newSocket.disconnect();
      };
    } else {
      console.log('⚠️ No valid token found, skipping socket connection');
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
