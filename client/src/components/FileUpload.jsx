// client/src/components/FileUpload.jsx
import { useMemo, useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';

const API_BASE_URL = 'http://localhost:5000/api/upload';
const MAX_FILE_SIZE_MB = parseInt(process.env.REACT_APP_MAX_FILE_SIZE_MB || '50', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const sanitizeName = (name = '') => name.replace(/[^a-zA-Z0-9._-]/g, '_');
const normalizeFolderPath = (path = '') => path.replace(/^\/+|\/+$|\\+/g, '').replace(/\\/g, '/');

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function FileUpload({ projectId, onUploadComplete }) {
  const [singleFile, setSingleFile] = useState(null);
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleProgress, setSingleProgress] = useState(0);

  const [zipFiles, setZipFiles] = useState([]);
  const [zipFolderName, setZipFolderName] = useState('');
  const [zipUploading, setZipUploading] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatus, setZipStatus] = useState('');

  const [folderFiles, setFolderFiles] = useState([]);
  const [folderRootName, setFolderRootName] = useState('');
  const [folderUploading, setFolderUploading] = useState(false);
  const [folderProgress, setFolderProgress] = useState(0);
  const [folderStatus, setFolderStatus] = useState('');

  const zipTotalSize = useMemo(
    () => zipFiles.reduce((acc, file) => acc + file.size, 0),
    [zipFiles]
  );

  const folderTotalSize = useMemo(
    () => folderFiles.reduce((acc, file) => acc + file.size, 0),
    [folderFiles]
  );

  const ensureAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    return token;
  };

  const uploadFileToS3 = async (file, options = {}) => {
    const {
      folderPath = '',
      isArchive = false,
      archiveType = null,
      originalFolderName = '',
      progressCallback,
    } = options;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`
      );
    }

    const token = ensureAuthenticated();
    const normalizedFolderPath = normalizeFolderPath(folderPath);
    const fileType = file.type || 'application/octet-stream';

    const presignResponse = await axios.get(`${API_BASE_URL}/presign`, {
      params: {
        projectId,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        folderPath: normalizedFolderPath,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const { uploadUrl, key } = presignResponse.data;

    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': fileType },
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          progressCallback?.(percent);
        }
      },
    });

    await axios.post(
      `${API_BASE_URL}/save-metadata`,
      {
        projectId,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        s3Key: key,
        folderPath: normalizedFolderPath,
        isArchive,
        archiveType,
        originalFolderName,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  const handleSingleSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please choose a smaller file.`);
      event.target.value = '';
      return;
    }

    setSingleFile(file);
    setSingleProgress(0);
    event.target.value = '';
  };

  const handleSingleUpload = async () => {
    if (!singleFile) {
      alert('Please select a file to upload.');
      return;
    }

    setSingleUploading(true);
    setSingleProgress(0);

    try {
      await uploadFileToS3(singleFile, {
        progressCallback: setSingleProgress,
      });
      setSingleProgress(100);
      alert(`✅ File "${singleFile.name}" uploaded successfully!`);
      setSingleFile(null);
      onUploadComplete?.();
    } catch (error) {
      console.error('Single file upload error:', error);
      alert(error.message || '❌ Upload failed. Please try again.');
    } finally {
      setSingleUploading(false);
    }
  };

  const handleZipFolderSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const root = files[0]?.webkitRelativePath?.split('/')?.[0] || files[0]?.name || 'folder';
    setZipFiles(files);
    setZipFolderName(root);
    setZipProgress(0);
    setZipStatus('');
    event.target.value = '';
  };

  const handleZipUpload = async () => {
    if (!zipFiles.length) {
      alert('Please select a folder to compress and upload.');
      return;
    }

    setZipUploading(true);
    setZipProgress(0);
    setZipStatus('Compressing folder...');

    try {
      const zip = new JSZip();
      const rootName = zipFolderName || 'folder';

      zipFiles.forEach((file) => {
        const relativePath = file.webkitRelativePath || file.name;
        const entryPath = relativePath || file.name;
        zip.file(entryPath, file);
      });

      const blob = await zip.generateAsync(
        { type: 'blob' },
        (metadata) => setZipProgress(Math.min(50, Math.round(metadata.percent / 2)))
      );

      if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `Compressed archive exceeds the ${MAX_FILE_SIZE_MB} MB limit. Remove large files and try again.`
        );
      }

      const safeFolder = sanitizeName(rootName);
      const zipFileName = `${safeFolder || 'folder'}-${Date.now()}.zip`;
      const archiveFile = new File([blob], zipFileName, { type: 'application/zip' });

      setZipStatus('Uploading archive...');

      await uploadFileToS3(archiveFile, {
        folderPath: `archives/${safeFolder}`,
        isArchive: true,
        archiveType: 'zip',
        originalFolderName: rootName,
        progressCallback: (progress) => {
          setZipProgress(50 + Math.round(progress / 2));
        },
      });

      setZipProgress(100);
      setZipStatus('');
      alert(`✅ Folder "${rootName}" compressed and uploaded successfully!`);
      setZipFiles([]);
      setZipFolderName('');
      onUploadComplete?.();
    } catch (error) {
      console.error('Zip upload error:', error);
      alert(error.message || '❌ Folder upload failed. Please try again.');
    } finally {
      setZipUploading(false);
      setZipStatus('');
    }
  };

  const handleFolderSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const root = files[0]?.webkitRelativePath?.split('/')?.[0] || files[0]?.name || 'folder';
    setFolderFiles(files);
    setFolderRootName(root);
    setFolderProgress(0);
    setFolderStatus('');
    event.target.value = '';
  };

  const handleFolderUpload = async () => {
    if (!folderFiles.length) {
      alert('Please select a folder to upload.');
      return;
    }

    const files = Array.from(folderFiles);

    // Validate sizes before upload
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      alert(
        `File "${oversized.webkitRelativePath || oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit. Remove it and try again.`
      );
      return;
    }

    setFolderUploading(true);
    setFolderProgress(0);
    setFolderStatus('Preparing uploads...');

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const relativePath = file.webkitRelativePath || file.name;
        const pathSegments = relativePath.split('/');
        pathSegments.shift(); // remove root folder
        const folderPath = pathSegments.slice(0, -1).join('/');

        setFolderStatus(
          `Uploading ${index + 1}/${files.length}: ${relativePath}`
        );

        await uploadFileToS3(file, {
          folderPath,
          progressCallback: (progress) => {
            const overall = Math.min(
              100,
              Math.round(((index + progress / 100) / files.length) * 100)
            );
            setFolderProgress(overall);
          },
        });
      }

      setFolderProgress(100);
      setFolderStatus('Upload complete!');
      alert(`✅ Folder "${folderRootName || 'selected'}" uploaded successfully!`);
      setFolderFiles([]);
      setFolderRootName('');
      onUploadComplete?.();
    } catch (error) {
      console.error('Folder upload error:', error);
      alert(error.message || '❌ Folder upload failed. Please try again.');
    } finally {
      setFolderUploading(false);
      setFolderStatus('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 border border-blue-100">
        <h3 className="font-semibold text-lg mb-2">📤 Upload Single File</h3>
        <p className="text-sm text-gray-500 mb-4">
          Maximum file size: {MAX_FILE_SIZE_MB} MB per upload.
        </p>
        <div className="space-y-3">
          <input
            type="file"
            onChange={handleSingleSelect}
            disabled={singleUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50"
          />

          {singleFile && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-600">
              <p><strong>File:</strong> {singleFile.name}</p>
              <p><strong>Size:</strong> {formatBytes(singleFile.size)}</p>
              <p><strong>Type:</strong> {singleFile.type || 'Unknown'}</p>
            </div>
          )}

          {singleUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${singleProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-gray-600">
                Uploading... {singleProgress}%
              </p>
            </div>
          )}

          <button
            onClick={handleSingleUpload}
            disabled={!singleFile || singleUploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {singleUploading ? '⏳ Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-purple-100">
        <h3 className="font-semibold text-lg mb-2">🗂️ Upload Folder (Auto ZIP)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Compresses the selected folder into a single ZIP before uploading. Ideal for sharing large folders as one archive.
        </p>
        <div className="space-y-3">
          <input
            type="file"
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleZipFolderSelect}
            disabled={zipUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100
              disabled:opacity-50"
          />

          {zipFiles.length > 0 && (
            <div className="bg-purple-50 p-3 rounded border border-purple-200 text-sm text-purple-900">
              <p><strong>Folder:</strong> {zipFolderName}</p>
              <p><strong>Items:</strong> {zipFiles.length}</p>
              <p><strong>Total size (before zip):</strong> {formatBytes(zipTotalSize)}</p>
            </div>
          )}

          {zipUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${zipProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-gray-600">
                {zipStatus || 'Processing...'} {zipProgress}%
              </p>
            </div>
          )}

          <button
            onClick={handleZipUpload}
            disabled={!zipFiles.length || zipUploading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:bg-purple-200 disabled:cursor-not-allowed transition"
          >
            {zipUploading ? '⏳ Processing...' : 'Compress & Upload Folder'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-green-100">
        <h3 className="font-semibold text-lg mb-2">📁 Upload Folder (Preserve Structure)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Uploads every file in the selected folder individually, keeping the same folder hierarchy inside the project.
        </p>
        <div className="space-y-3">
          <input
            type="file"
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFolderSelect}
            disabled={folderUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100
              disabled:opacity-50"
          />

          {folderFiles.length > 0 && (
            <div className="bg-green-50 p-3 rounded border border-green-200 text-sm text-green-900">
              <p><strong>Folder:</strong> {folderRootName}</p>
              <p><strong>Items:</strong> {folderFiles.length}</p>
              <p><strong>Total size:</strong> {formatBytes(folderTotalSize)}</p>
            </div>
          )}

          {folderUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${folderProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-gray-600">
                {folderStatus || 'Uploading...'} {folderProgress}%
              </p>
            </div>
          )}

          <button
            onClick={handleFolderUpload}
            disabled={!folderFiles.length || folderUploading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-200 disabled:cursor-not-allowed transition"
          >
            {folderUploading ? '⏳ Uploading...' : 'Upload Folder'}
          </button>
        </div>
      </div>
    </div>
  );
}
