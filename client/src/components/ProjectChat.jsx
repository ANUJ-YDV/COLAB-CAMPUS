// client/src/components/ProjectChat.jsx
import { useEffect, useState, useRef } from 'react';
import TypingIndicator from './TypingIndicator';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

export default function ProjectChat({ socket, projectId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef();
  const handleTyping = useTypingIndicator(projectId);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_project', { projectId });

    socket.on('chat_history', (msgs) => {
      console.log(`📜 Received ${msgs.length} chat history messages`);
      setMessages(msgs);
    });

    socket.on('receive_message', (msg) => {
      console.log('💬 New message received:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, [socket, projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      socket.emit('send_message', { projectId, content: text });
      setText('');
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold text-lg mb-3">Project Chat</h3>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m._id} className="p-2 rounded bg-gray-100">
              <strong className="text-blue-600">{m.sender?.name || 'User'}:</strong>{' '}
              <span className="text-gray-800">{m.content}</span>
            </div>
          ))
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Typing Indicator */}
      <TypingIndicator roomId={projectId} />

      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
