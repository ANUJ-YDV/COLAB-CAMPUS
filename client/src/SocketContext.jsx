// Socket Context Provider for managing socket connection across the app
import { createContext, useContext, useEffect, useState } from 'react';
import { createSocket } from './socket';

const SocketContext = createContext(null);

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
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Only connect if we have a token and it's not a mock token
    if (token && token !== 'mock-token') {
      console.log('🔌 Initializing socket connection...');
      const newSocket = createSocket(token);
      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log('🔌 Closing socket connection...');
        newSocket.disconnect();
      };
    } else {
      console.log('⚠️ No valid token found, skipping socket connection');
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
