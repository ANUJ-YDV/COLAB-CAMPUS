import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../SocketContext';

/**
 * Custom hook for handling typing indicators
 * Automatically emits typing and stop-typing events
 *
 * @param {string} roomId - The room/conversation ID
 * @returns {function} handleTyping - Function to call when user types
 *
 * @example
 * const handleTyping = useTypingIndicator(projectId);
 *
 * <input onChange={(e) => {
 *   setMessage(e.target.value);
 *   handleTyping();
 * }} />
 */
export function useTypingIndicator(roomId) {
  const { socket } = useSocket();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Cleanup on unmount or roomId change
  useEffect(() => {
    return () => {
      if (isTypingRef.current && socket && roomId) {
        socket.emit('stop-typing', { roomId });
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, roomId]);

  const handleTyping = useCallback(() => {
    if (!socket || !roomId) return;

    // If not already typing, emit typing event
    if (!isTypingRef.current) {
      socket.emit('typing', { roomId });
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit('stop-typing', { roomId });
        isTypingRef.current = false;
      }
    }, 2000);
  }, [socket, roomId]);

  return handleTyping;
}
