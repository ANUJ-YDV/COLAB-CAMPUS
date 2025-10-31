/**
 * RichCollaborativeEditor Component
 * Real-time collaborative rich text editing with Quill
 * Supports formatting, images, links, etc.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function RichCollaborativeEditor({ projectId, projectName }) {
  const { socket } = useSocket();
  const [document, setDocument] = useState({
    title: '',
    content: '',
    version: 0,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isRemoteChangeRef = useRef(false);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
    'color',
    'background',
    'align',
  ];

  // Load document on mount
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/documents/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const doc = response.data.document;
          setDocument({
            title: doc.title,
            content: doc.content,
            version: doc.version,
            lastUpdated: doc.lastUpdated,
          });
          setLastSaved(new Date(doc.lastUpdated));
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading document:', err);
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [projectId]);

  // Join document room via Socket.io
  useEffect(() => {
    if (!socket || !projectId) return;

    console.log('📄 Joining document room for project:', projectId);
    socket.emit('join-document', projectId);

    // Listen for document load
    socket.on('load-document', (data) => {
      console.log('📄 Document loaded from socket:', data);
      isRemoteChangeRef.current = true;
      setDocument({
        title: data.title,
        content: data.content,
        version: data.version,
        lastUpdated: data.lastUpdated,
      });
      setLastSaved(new Date(data.lastUpdated));
    });

    // Listen for changes from other users
    socket.on('receive-changes', ({ delta, userName }) => {
      console.log('📝 Received changes from:', userName);
      isRemoteChangeRef.current = true;
      setDocument((prev) => ({
        ...prev,
        content: delta,
      }));
    });

    // Listen for save confirmations
    socket.on('document-saved', ({ success, version, lastUpdated }) => {
      if (success) {
        console.log('💾 Document saved successfully (v' + version + ')');
        setIsSaving(false);
        setHasUnsavedChanges(false);
        setLastSaved(new Date(lastUpdated));
        setDocument((prev) => ({ ...prev, version }));
      }
    });

    // Listen for saves by other users
    socket.on('document-saved-by-other', ({ userName, version }) => {
      console.log(`💾 Document saved by ${userName} (v${version})`);
      setDocument((prev) => ({ ...prev, version }));
    });

    // Listen for users joining/leaving
    socket.on('user-joined-document', ({ userName, userId }) => {
      console.log(`👤 ${userName} joined the document`);
      setActiveUsers((prev) => {
        if (prev.some((u) => u.id === userId)) return prev;
        return [...prev, { id: userId, name: userName }];
      });
    });

    socket.on('user-left-document', ({ userName, userId }) => {
      console.log(`👤 ${userName} left the document`);
      setActiveUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    // Cleanup on unmount
    return () => {
      console.log('📄 Leaving document room');
      socket.emit('leave-document', projectId);
      socket.off('load-document');
      socket.off('receive-changes');
      socket.off('document-saved');
      socket.off('document-saved-by-other');
      socket.off('user-joined-document');
      socket.off('user-left-document');
    };
  }, [socket, projectId]);

  // Handle content change
  const handleContentChange = (content, delta, source, editor) => {
    // Ignore remote changes
    if (isRemoteChangeRef.current) {
      isRemoteChangeRef.current = false;
      return;
    }

    setDocument((prev) => ({ ...prev, content }));
    setHasUnsavedChanges(true);

    // Broadcast changes to other users in real-time
    if (socket && source === 'user') {
      socket.emit('send-changes', {
        projectId,
        delta: content,
      });
    }

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(content);
    }, 2000);
  };

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setDocument((prev) => ({ ...prev, title: newTitle }));
    setHasUnsavedChanges(true);
  };

  // Save document
  const handleSave = useCallback(
    async (contentToSave = document.content) => {
      if (!socket) return;

      setIsSaving(true);
      console.log('💾 Saving document...');

      socket.emit('save-document', {
        projectId,
        content: contentToSave,
        title: document.title,
      });
    },
    [socket, projectId, document.title, document.content]
  );

  // Manual save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return lastSaved.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex-1 mr-6">
              <input
                type="text"
                value={document.title}
                onChange={handleTitleChange}
                placeholder="Untitled Document"
                className="text-2xl font-bold text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
              <p className="text-sm text-gray-500 mt-1">{projectName}</p>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-4">
              {/* Active Users */}
              {activeUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {activeUsers.slice(0, 3).map((user) => (
                      <div
                        key={user.id}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                        title={user.name}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  {activeUsers.length > 3 && (
                    <span className="text-sm text-gray-600">+{activeUsers.length - 3} editing</span>
                  )}
                </div>
              )}

              {/* Save Status */}
              <div className="text-sm">
                {isSaving ? (
                  <span className="text-blue-600 flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : hasUnsavedChanges ? (
                  <span className="text-orange-600">● Unsaved</span>
                ) : (
                  <span className="text-green-600 flex items-center">
                    ✓ Saved {formatLastSaved()}
                  </span>
                )}
              </div>

              {/* Version */}
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                v{document.version}
              </div>

              {/* Manual Save Button */}
              <button
                onClick={() => handleSave()}
                disabled={isSaving || !hasUnsavedChanges}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rich Text Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={document.content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder="Start typing... Changes will sync in real-time! 🚀"
              className="h-full"
              style={{ height: 'calc(100% - 42px)' }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-2 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              💡 <strong>Tip:</strong> Press{' '}
              <kbd className="px-2 py-1 bg-gray-100 border rounded">Ctrl+S</kbd> to save
            </span>
            <span className="text-gray-400">|</span>
            <span>Auto-saves after 2s of inactivity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time sync enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
