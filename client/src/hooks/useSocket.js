/**
 * Simple useSocket hook for accessing socket context
 * This is a lightweight alternative to importing useSocket from SocketContext
 *
 * Usage:
 * const { socket, onlineUsers, typingUsers } = useSocket();
 */
import { useContext } from 'react';
import { SocketContext } from '../SocketContext';

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
}

export default useSocket;
