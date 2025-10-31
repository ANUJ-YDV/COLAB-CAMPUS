// client/src/components/ConversationChat.jsx
// Component for displaying and sending messages in a conversation (global or DM)

import React, { useState, useEffect, useRef } from 'react';

const ConversationChat = ({ socket, conversation, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversation || !socket) return;

    // Join the conversation room
    socket.emit('join_conversation', { conversationId: conversation._id });

    // Listen for join confirmation
    const handleJoinedConversation = ({ conversationId }) => {
      if (conversationId === conversation._id) {
        setIsJoined(true);
        console.log('✅ Joined conversation:', conversationId);
      }
    };

    // Listen for conversation history
    const handleConversationHistory = (history) => {
      setMessages(history);
      scrollToBottom();
    };

    // Listen for new messages
    const handleReceiveMessage = (message) => {
      if (message.conversationId === conversation._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    // Listen for errors
    const handleError = ({ message }) => {
      console.error('❌ Conversation error:', message);
      alert(message);
    };

    socket.on('joined_conversation', handleJoinedConversation);
    socket.on('conversation_history', handleConversationHistory);
    socket.on('receive_conversation_message', handleReceiveMessage);
    socket.on('error_message', handleError);

    // Cleanup
    return () => {
      socket.off('joined_conversation', handleJoinedConversation);
      socket.off('conversation_history', handleConversationHistory);
      socket.off('receive_conversation_message', handleReceiveMessage);
      socket.off('error_message', handleError);

      socket.emit('leave_conversation', { conversationId: conversation._id });
      setIsJoined(false);
      setMessages([]);
    };
  }, [conversation, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!messageInput.trim() || !isJoined) return;

    socket.emit('send_conversation_message', {
      conversationId: conversation._id,
      content: messageInput,
    });

    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getConversationName = () => {
    if (conversation.type === 'global') {
      return conversation.name || 'Global Chat';
    } else {
      const otherParticipant = conversation.participants?.find((p) => p._id !== currentUser._id);
      return otherParticipant ? otherParticipant.username : 'Unknown User';
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <div className="text-lg">Select a conversation to start chatting</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {conversation.type === 'global' ? (
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
              🌍
            </div>
          ) : (
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl">
              💬
            </div>
          )}
          <div>
            <div className="font-bold text-lg">{getConversationName()}</div>
            <div className="text-sm text-gray-500">
              {conversation.type === 'global' ? 'Global Chat Room' : 'Direct Message'}
              {isJoined && <span className="ml-2 text-green-500">● Online</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No messages yet. Start the conversation! 👋
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.sender._id === currentUser._id;
            return (
              <div
                key={msg._id || index}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {!isCurrentUser && (
                    <div className="text-xs font-semibold mb-1">
                      {msg.sender.username || msg.sender.email}
                    </div>
                  )}
                  <div className="break-words">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isJoined ? 'Type a message...' : 'Joining conversation...'}
            disabled={!isJoined}
            maxLength={2000}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || !isJoined}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Press Enter to send • {messageInput.length}/2000 characters
        </div>
      </div>
    </div>
  );
};

export default ConversationChat;
