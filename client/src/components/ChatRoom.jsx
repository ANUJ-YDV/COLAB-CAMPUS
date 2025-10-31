/**
 * ChatRoom Component - Complete Example
 * Demonstrates Socket.io integration with:
 * - Online users list
 * - Typing indicators
 * - Real-time messaging
 * - Automatic typing detection
 */
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import TypingIndicator from './TypingIndicator';

export default function ChatRoom({ roomId, roomName = 'Chat Room' }) {
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);

  // Get typing handler from custom hook
  const handleTyping = useTypingIndicator(roomId);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join room when component mounts
  useEffect(() => {
    if (!socket || !roomId) return;

    console.log(`🚪 Joining room: ${roomId}`);
    socket.emit('join_project', roomId);
    setIsJoined(true);

    // Listen for chat history
    socket.on('chat_history', (history) => {
      console.log(`📜 Received ${history.length} messages`);
      setMessages(history);
    });

    // Listen for new messages
    socket.on('receive_message', (msg) => {
      console.log('💬 New message:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    // Cleanup: leave room on unmount
    return () => {
      console.log(`🚪 Leaving room: ${roomId}`);
      socket.emit('leave_project', roomId);
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, [socket, roomId]);

  // Send message handler
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!socket || !message.trim() || !isJoined) return;

    const messageData = {
      projectId: roomId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending message:', messageData);
    socket.emit('send_message', messageData);

    setMessage('');
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleTyping(); // Trigger typing indicator
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">{roomName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isJoined ? `Connected to ${roomId}` : 'Connecting...'}
          </p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const currentUserId = localStorage.getItem('userId');
              const isOwnMessage = msg.user?._id === currentUserId;

              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg shadow ${
                      isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1">
                        {msg.user?.userName || 'Unknown User'}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        <div className="px-6 pb-2">
          <TypingIndicator roomId={roomId} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder="Type a message…"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isJoined}
            />
            <button
              type="submit"
              disabled={!message.trim() || !isJoined}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Sidebar: Online Users */}
      <div className="w-80 bg-white border-l shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Online Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
          </p>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {onlineUsers.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">No users online</p>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow">
                    {user.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* User info */}
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">
                    {user.userName || 'Unknown User'}
                  </p>
                  <p className="text-xs text-green-600">● Online</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
