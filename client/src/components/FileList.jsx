// client/src/components/FileList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function FileList({ projectId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharingFileId, setSharingFileId] = useState(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/upload/files/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/upload/download/${fileId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Open the presigned download URL in a new tab
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleShareLink = async (fileId, fileName) => {
    try {
      setSharingFileId(fileId);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/upload/download/${fileId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { downloadUrl } = response.data;
      await navigator.clipboard.writeText(downloadUrl);
      alert(`✅ Temporary download link for "${fileName}" copied to clipboard!\n\nLink expires in 5 minutes.`);
    } catch (error) {
      console.error('Copy link error:', error);
      alert('Failed to generate shareable link');
    } finally {
      setSharingFileId(null);
    }
  };

  const handleDelete = async (fileId, fileName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/upload/files/${fileId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('File deleted successfully');
      loadFiles(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500 text-center">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-lg mb-4">
        📁 Uploaded Files ({files.length})
      </h3>

      {files.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No files uploaded yet. Upload your first file above!
        </p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file._id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{file.fileName}</p>
                    {file.isArchive && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        ZIP Archive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                    <span>📊 {formatFileSize(file.fileSize)}</span>
                    <span>📅 {formatDate(file.createdAt || file.uploadedAt)}</span>
                    {file.folderPath && (
                      <span>📂 {file.folderPath}</span>
                    )}
                    {file.originalFolderName && file.isArchive && (
                      <span>🗂️ Source: {file.originalFolderName}</span>
                    )}
                    {file.uploadedBy && (
                      <span>👤 {file.uploadedBy.name}</span>
                    )}
                    {typeof file.downloadCount === 'number' && (
                      <span>⬇️ Downloads: {file.downloadCount}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleShareLink(file._id, file.fileName)}
                    className="text-amber-600 hover:text-amber-800 text-sm px-3 py-1 rounded hover:bg-amber-50 disabled:opacity-50"
                    title="Copy temporary download link"
                    disabled={sharingFileId === file._id}
                  >
                    {sharingFileId === file._id ? '…' : '🔗'}
                  </button>
                  <button
                    onClick={() => handleDownload(file._id, file.fileName)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50"
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleDelete(file._id, file.fileName)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
