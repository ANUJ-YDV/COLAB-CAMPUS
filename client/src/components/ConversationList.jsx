// client/src/components/ConversationList.jsx
// Component to display list of conversations (global + DMs)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConversationList = ({ onSelectConversation, currentUserId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'global') {
      return conversation.name || 'Global Chat';
    } else {
      // For DM, show other participant's name
      const otherParticipant = conversation.participants.find((p) => p._id !== currentUserId);
      return otherParticipant ? otherParticipant.username : 'Unknown User';
    }
  };

  if (loading) return <div className="p-4">Loading conversations...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>

      <div className="overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv._id}
            onClick={() => onSelectConversation(conv)}
            className="p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {conv.type === 'global' ? (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  🌍
                </div>
              ) : (
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                  💬
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold">{getConversationName(conv)}</div>
                <div className="text-sm text-gray-500">
                  {conv.type === 'global' ? 'Global Chat' : 'Direct Message'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {conversations.length === 0 && (
        <div className="p-4 text-center text-gray-500">No conversations yet</div>
      )}
    </div>
  );
};

export default ConversationList;
