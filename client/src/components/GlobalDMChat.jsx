// client/src/components/GlobalDMChat.jsx
// Unified component for Global Chat and Direct Messages

import { useEffect, useState } from 'react';

export default function GlobalDMChat({ socket, convoType, targetUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [convoId, setConvoId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    setIsLoading(true);
    setMessages([]);

    // Join the appropriate room
    if (convoType === 'global') {
      socket.emit('join_global');
    } else if (convoType === 'dm' && targetUserId) {
      socket.emit('join_dm', { userId: targetUserId });
    }

    // Listen for chat history
    const handleChatHistory = (msgs) => {
      if (msgs.length > 0) {
        // Extract conversation ID from first message
        setConvoId(msgs[0].conversation || msgs[0]._id);
      }
      setMessages(msgs);
      setIsLoading(false);
    };

    // Listen for new messages
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Listen for errors
    const handleError = ({ message }) => {
      console.error('Chat error:', message);
      setIsLoading(false);
    };

    socket.on('chat_history', handleChatHistory);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('error_message', handleError);

    // Cleanup
    return () => {
      socket.off('chat_history', handleChatHistory);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('error_message', handleError);
    };
  }, [socket, convoType, targetUserId]);

  const handleSend = () => {
    if (text.trim() && convoId) {
      socket.emit('send_message', { convoId, content: text });
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl shadow p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-gray-50 rounded-xl shadow p-4">
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">
          {convoType === 'global' ? '🌍 Global Chat' : '💬 Direct Message'}
        </h3>
        <p className="text-sm text-gray-500">
          {convoType === 'global' ? 'Everyone can see these messages' : 'Private conversation'}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const isMe = m.sender?._id === currentUser._id;

            return (
              <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {!isMe && (
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        isMe ? 'text-blue-100' : 'text-blue-600'
                      }`}
                    >
                      {m.sender?.name || m.sender?.username || 'Unknown'}
                    </div>
                  )}
                  <div className="break-words">{m.content}</div>
                  <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type message..."
          disabled={!convoId}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !convoId}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Send
        </button>
      </div>

      {/* Character counter */}
      <div className="text-xs text-gray-400 mt-2 text-right">
        {text.length}/2000 characters
        {convoType === 'global' && <span className="ml-2">• Everyone can see this</span>}
      </div>
    </div>
  );
}
