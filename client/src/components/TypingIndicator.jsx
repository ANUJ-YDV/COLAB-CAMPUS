import { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';

export default function TypingIndicator({ roomId }) {
  const { typingUsers } = useSocket();
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const usersTypingInRoom = typingUsers[roomId] || [];

    if (usersTypingInRoom.length === 0) {
      setDisplayText('');
    } else if (usersTypingInRoom.length === 1) {
      setDisplayText(`${usersTypingInRoom[0].name} is typing...`);
    } else if (usersTypingInRoom.length === 2) {
      setDisplayText(`${usersTypingInRoom[0].name} and ${usersTypingInRoom[1].name} are typing...`);
    } else {
      setDisplayText(
        `${usersTypingInRoom[0].name} and ${usersTypingInRoom.length - 1} others are typing...`
      );
    }
  }, [typingUsers, roomId]);

  if (!displayText) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
      {/* Animated dots */}
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        ></span>
        <span
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></span>
        <span
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></span>
      </div>
      <span className="italic">{displayText}</span>
    </div>
  );
}
