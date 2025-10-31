/**
 * Socket.io Testing Page
 * Quick test page to verify Socket.io integration
 * Visit: http://localhost:3000/socket-test
 */
import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import TypingIndicator from '../components/TypingIndicator';
import OnlineUsers from '../components/OnlineUsers';

export default function SocketTest() {
  const { socket, onlineUsers, typingUsers } = useSocket();
  const [testRoomId] = useState('test-room-123');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [logs, setLogs] = useState([]);

  const handleTyping = useTypingIndicator(testRoomId);

  // Add log entry
  const addLog = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { msg, type, timestamp }].slice(-20)); // Keep last 20 logs
  };

  // Join test room
  const joinRoom = () => {
    if (!socket) {
      addLog('❌ Socket not connected', 'error');
      return;
    }

    socket.emit('join_project', testRoomId);
    setIsJoined(true);
    addLog('✅ Joined test room: ' + testRoomId, 'success');
  };

  // Leave test room
  const leaveRoom = () => {
    if (!socket) return;

    socket.emit('leave_project', testRoomId);
    setIsJoined(false);
    addLog('👋 Left test room', 'info');
  };

  // Send test message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!socket || !message.trim() || !isJoined) return;

    socket.emit('send_message', {
      projectId: testRoomId,
      message: message.trim(),
    });

    addLog('📤 Sent: ' + message, 'success');
    setMessage('');
  };

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    const handleHistory = (msgs) => {
      setMessages(msgs);
      addLog(`📜 Received ${msgs.length} messages`, 'info');
    };

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      addLog(`💬 New message from ${msg.user?.userName}`, 'success');
    };

    socket.on('chat_history', handleHistory);
    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('chat_history', handleHistory);
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket]);

  // Log socket connection status
  useEffect(() => {
    if (socket) {
      addLog('🟢 Socket connected!', 'success');
    } else {
      addLog('🔴 Socket not connected', 'error');
    }
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🧪 Socket.io Testing Page</h1>
          <p className="text-gray-600">
            Test real-time features: online users, typing indicators, and messaging
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Controls & Chat */}
          <div className="col-span-2 space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Connection Status</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${socket ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span className="font-medium">
                    Socket: {socket ? '✅ Connected' : '❌ Disconnected'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${isJoined ? 'bg-green-500' : 'bg-gray-300'}`}
                  ></div>
                  <span className="font-medium">
                    Room: {isJoined ? '✅ Joined' : '⏸️ Not joined'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Online Users: {onlineUsers.length}</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={joinRoom}
                  disabled={isJoined || !socket}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Join Test Room
                </button>
                <button
                  onClick={leaveRoom}
                  disabled={!isJoined || !socket}
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Leave Room
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Test Chat</h2>

              {/* Messages */}
              <div className="h-64 overflow-y-auto bg-gray-50 rounded p-4 mb-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 mt-20">
                    No messages yet. Send one to test!
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-blue-600">
                          {msg.user?.userName || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Typing Indicator */}
              <TypingIndicator roomId={testRoomId} />

              {/* Message Input */}
              <form onSubmit={sendMessage} className="flex space-x-3 mt-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping(); // Trigger typing indicator
                  }}
                  placeholder={isJoined ? 'Type a message...' : 'Join room first'}
                  disabled={!isJoined || !socket}
                  className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || !isJoined || !socket}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Event Logs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Event Logs</h2>
              <div className="h-48 overflow-y-auto bg-gray-900 text-green-400 rounded p-4 font-mono text-sm space-y-1">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No events yet...</p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={`
                      ${log.type === 'error' ? 'text-red-400' : ''}
                      ${log.type === 'success' ? 'text-green-400' : ''}
                      ${log.type === 'info' ? 'text-blue-400' : ''}
                    `}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Online Users & Debug Info */}
          <div className="space-y-6">
            {/* Online Users */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <OnlineUsers />
            </div>

            {/* Debug Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Debug Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Room ID:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{testRoomId}</code>
                </div>
                <div>
                  <span className="font-medium">Socket ID:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                    {socket?.id || 'Not connected'}
                  </code>
                </div>
                <div>
                  <span className="font-medium">User ID:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                    {localStorage.getItem('userId') || 'Not logged in'}
                  </code>
                </div>
                <div>
                  <span className="font-medium">Token:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                    {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
                  </code>
                </div>
              </div>
            </div>

            {/* Typing Users Debug */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Typing Users (Debug)</h2>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                {JSON.stringify(typingUsers, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">📖 How to Test</h3>
          <ol className="list-decimal ml-5 space-y-2 text-blue-900">
            <li>
              Open this page in <strong>two different browsers</strong> (e.g., Chrome + Firefox)
            </li>
            <li>
              Login with <strong>different users</strong> in each browser
            </li>
            <li>
              Click <strong>"Join Test Room"</strong> in both browsers
            </li>
            <li>Start typing in one browser → see typing indicator in the other</li>
            <li>Send messages → they appear instantly in both browsers</li>
            <li>
              Watch the <strong>Online Users</strong> list update in real-time
            </li>
            <li>Close one browser → see the user disappear from Online Users</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
