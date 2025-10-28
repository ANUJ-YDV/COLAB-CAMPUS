// client/src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { useSocket } from "../SocketContext";
import axios from "axios";

export default function Chat({ projectId }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId"); // Assuming userId is stored

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat history when component mounts (now handled by socket event)
  useEffect(() => {
    // No longer need to fetch via REST API
    // Chat history will be received via socket event
    setIsLoading(false);
  }, [projectId]);

  // Listen for chat history and new messages from Socket.io
  useEffect(() => {
    if (!socket) return;

    // Receive chat history when joining project
    const handleChatHistory = (messages) => {
      console.log(`📜 Received ${messages.length} chat history messages`);
      setMessages(messages);
      setIsLoading(false);
    };

    // Receive new messages in real-time
    const handleReceiveMessage = (message) => {
      console.log("💬 New message received:", message);
      setMessages((prev) => [...prev, message]);
    };

    socket.on("chat_history", handleChatHistory);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("chat_history", handleChatHistory);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket]);

  // Send a message
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket) return;

    // Emit message to server
    socket.emit("send_message", {
      projectId,
      content: newMessage.trim()
    });

    // Clear input
    setNewMessage("");
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Project Chat</h3>
        <p className="text-sm text-gray-500">{messages.length} messages</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender._id === currentUserId;
            
            return (
              <div
                key={msg._id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwnMessage
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1">
                      {msg.sender.name}
                    </p>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={2000}
            disabled={!socket}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !socket}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        {!socket && (
          <p className="text-xs text-red-500 mt-2">
            Not connected to chat server
          </p>
        )}
      </form>
    </div>
  );
}
