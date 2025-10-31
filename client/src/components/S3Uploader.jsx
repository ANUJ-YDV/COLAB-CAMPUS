import { useMemo, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/upload';
const MAX_FILE_SIZE_MB = parseInt(process.env.REACT_APP_MAX_FILE_SIZE_MB || '50', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const normalizeFolderPath = (path = '') => path.trim().replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');

export default function S3Uploader({ initialProjectId = '' }) {
  const [projectId, setProjectId] = useState(initialProjectId);
  const [folderPath, setFolderPath] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const lacksProject = useMemo(() => !projectId.trim(), [projectId]);

  const ensureAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    return token;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose a file first!');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File exceeds the ${MAX_FILE_SIZE_MB} MB limit.`);
      return;
    }

    if (lacksProject) {
      setError('Project ID is required to upload files.');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const token = ensureAuthenticated();
      const safeFolderPath = normalizeFolderPath(folderPath);
      const fileType = file.type || 'application/octet-stream';

      // Step 1: Request presigned URL from backend
      setProgress(25);
      console.log('🔄 Requesting presigned URL...');

      const params = new URLSearchParams({
        projectId: projectId.trim(),
        fileName: file.name,
        fileType,
        fileSize: String(file.size),
      });

      if (safeFolderPath) {
        params.append('folderPath', safeFolderPath);
      }

      const res = await fetch(`${API_BASE_URL}/presign?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to get presigned URL');
      }

      const { uploadUrl, key } = await res.json();
      console.log('✅ Presigned URL received');

      // Step 2: Upload file directly to S3
      setProgress(50);
      console.log('🔄 Uploading to S3...');

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      // Step 3: Extract public URL (remove query parameters)
      const fileUrl = uploadUrl.split('?')[0];
      setUrl(fileUrl);
      setProgress(75);

      // Step 4: Save metadata so the file appears for the project
      console.log('📦 Saving file metadata...');
      const metadataResponse = await fetch(`${API_BASE_URL}/save-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: projectId.trim(),
          fileName: file.name,
          fileType,
          fileSize: file.size,
          s3Key: key,
          folderPath: safeFolderPath,
          isArchive: false,
          archiveType: null,
          originalFolderName: '',
        }),
      });

      if (!metadataResponse.ok) {
        const errJson = await metadataResponse.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save file metadata');
      }

  await metadataResponse.json();

  setFile(null);
      setProgress(100);
      console.log('✅ Upload complete!');
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setUrl('');
      setProgress(0);
    }
    e.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 bg-white rounded-xl w-full max-w-md shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 S3 File Uploader</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={uploading || Boolean(initialProjectId)}
          placeholder="Enter the project ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Optional Folder Path</label>
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          disabled={uploading}
          placeholder="e.g. designs/wireframes"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Choose File</label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />

        {file && (
          <div className="mt-2 text-sm text-gray-600">
            📄 {file.name} ({formatFileSize(file.size)})
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading || lacksProject}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
          !file || uploading || lacksProject
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Uploading... {progress}%
          </span>
        ) : (
          lacksProject ? 'Enter a project ID' : 'Upload to S3'
        )}
      </button>

      {/* Progress Bar */}
      {uploading && progress > 0 && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {url && !uploading && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">✅ File uploaded successfully!</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
          >
            {url}
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="mt-2 w-full py-2 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            📋 Copy URL
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>How it works:</strong>
          <br />
          1. Backend validates project membership and generates a secure presigned URL
          <br />
          2. File uploads directly to S3 (no server processing)
          <br />
          3. Upload metadata is stored so the project can access the file
        </p>
      </div>
    </div>
  );
}
