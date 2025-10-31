/**
 * SimpleCollaborativeEditor Component
 * Basic real-time collaborative document editing
 * Matches the reference implementation pattern
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function SimpleCollaborativeEditor({ projectId, projectName }) {
  const [socket, setSocket] = useState(null);
  const [value, setValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const isRemoteChange = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');

    const s = io('http://localhost:5000', {
      auth: { token },
    });

    s.on('connect', () => {
      console.log('🟢 Socket connected:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
    });

    setSocket(s);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      s.disconnect();
    };
  }, []);

  // Join document room and listen for updates
  useEffect(() => {
    if (!socket || !projectId) return;

    console.log('📄 Joining document:', projectId);
    socket.emit('join-document', projectId);

    // Load initial document content
    socket.on('load-document', (data) => {
      console.log('📄 Document loaded:', data);
      isRemoteChange.current = true;
      setValue(data.content || '');
    });

    // Receive changes from other users
    socket.on('receive-changes', ({ delta, userName }) => {
      console.log('📝 Received changes from:', userName);
      isRemoteChange.current = true;
      setValue(delta);
    });

    // Document saved confirmation
    socket.on('document-saved', ({ success, version }) => {
      if (success) {
        console.log('💾 Document saved (v' + version + ')');
        setLastSaved(new Date());
      }
    });

    // Cleanup listeners
    return () => {
      console.log('📄 Leaving document');
      socket.emit('leave-document', projectId);
      socket.off('load-document');
      socket.off('receive-changes');
      socket.off('document-saved');
    };
  }, [socket, projectId]);

  // Handle editor changes
  const handleChange = useCallback(
    (content, delta, source, editor) => {
      // Ignore remote changes to prevent loops
      if (isRemoteChange.current) {
        isRemoteChange.current = false;
        return;
      }

      setValue(content);

      // Broadcast changes to other users
      if (socket && source === 'user') {
        socket.emit('send-changes', {
          projectId,
          delta: content,
        });
      }
    },
    [socket, projectId]
  );

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!socket || !projectId || !value) return;

    const interval = setInterval(() => {
      console.log('💾 Auto-saving document...');
      socket.emit('save-document', {
        projectId,
        content: value,
        title: projectName || 'Untitled Document',
      });
    }, 5000); // Save every 5 seconds

    return () => clearInterval(interval);
  }, [socket, value, projectId, projectName]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {projectName || 'Collaborative Notes'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Project ID: {projectId}</p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {lastSaved && (
              <div className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <ReactQuill
              value={value}
              onChange={handleChange}
              theme="snow"
              placeholder="Start typing... Changes will sync in real-time!"
              className="h-full"
              style={{ height: 'calc(100% - 42px)' }}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, 4, 5, 6, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  ['link', 'image'],
                  [{ color: [] }, { background: [] }],
                  ['clean'],
                ],
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-2 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>💾 Auto-saves every 5 seconds</span>
            <span className="text-gray-400">|</span>
            <span>✨ Real-time sync enabled</span>
          </div>
          <div className="text-gray-500">
            Open in multiple browsers to see real-time collaboration
          </div>
        </div>
      </div>
    </div>
  );
}
