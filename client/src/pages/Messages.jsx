// client/src/pages/Messages.jsx
// Messages page with Global Chat and DM tabs

import { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import GlobalDMChat from '../components/GlobalDMChat';
import axios from 'axios';

export default function Messages() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'dm'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // You'll need to create this endpoint or use your existing users endpoint
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter out current user
      const otherUsers = response.data.filter((u) => u._id !== currentUser._id);
      setUsers(otherUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Chat with everyone or send direct messages</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'global'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🌍 Global Chat
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'dm'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Direct Messages
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Chat */}
          <div className="lg:col-span-2">
            {activeTab === 'global' ? (
              <GlobalDMChat socket={socket} convoType="global" />
            ) : selectedUser ? (
              <div>
                <div className="mb-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-blue-600 hover:text-blue-800 mb-2"
                  >
                    ← Back to users
                  </button>
                  <h3 className="text-xl font-bold">
                    Chat with {selectedUser.username || selectedUser.name}
                  </h3>
                </div>
                <GlobalDMChat socket={socket} convoType="dm" targetUserId={selectedUser._id} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a User</h3>
                <p className="text-gray-600">
                  Choose someone from the list to start a direct message
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - User List (only for DM tab) */}
          {activeTab === 'dm' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-bold mb-4">Available Users</h3>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No other users found</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedUser?._id === user._id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(user.username || user.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {user.username || user.name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Panel for Global Chat */}
          {activeTab === 'global' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-bold mb-4">ℹ️ About Global Chat</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>🌍 Public:</strong> Everyone can see and participate in global chat
                    messages.
                  </p>
                  <p>
                    <strong>💾 Persistent:</strong> All messages are saved and visible to new users
                    who join.
                  </p>
                  <p>
                    <strong>⚡ Real-time:</strong> Messages appear instantly for all connected
                    users.
                  </p>
                  <p>
                    <strong>📏 Limit:</strong> Maximum 2000 characters per message.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl shadow p-4 mt-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">💡 Tip</h4>
                <p className="text-sm text-blue-800">
                  Use Direct Messages for private conversations. Switch to the DM tab to chat
                  one-on-one with team members.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
