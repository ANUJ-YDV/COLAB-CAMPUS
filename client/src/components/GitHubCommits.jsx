import { useState } from 'react';
import axios from 'axios';

export default function GitHubCommits() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoInfo, setRepoInfo] = useState(null);

  const fetchCommits = async () => {
    if (!owner || !repo) {
      setError('Please enter both owner and repository name');
      return;
    }

    setLoading(true);
    setError('');
    setCommits([]);
    setRepoInfo(null);

    try {
      console.log(`🔍 Fetching commits for ${owner}/${repo}...`);

      // Fetch commits
      const response = await axios.get(
        `http://localhost:5000/api/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );

      setCommits(response.data.commits);
      setRepoInfo({
        name: response.data.repo,
        count: response.data.count,
      });

      console.log(`✅ Found ${response.data.count} commits`);
    } catch (err) {
      console.error('❌ Error fetching commits:', err);

      if (err.response) {
        setError(err.response.data.error || 'Failed to fetch commits');
      } else if (err.request) {
        setError('No response from server. Make sure the backend is running.');
      } else {
        setError('Failed to fetch commits. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchCommits();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadExampleRepo = (exampleOwner, exampleRepo) => {
    setOwner(exampleOwner);
    setRepo(exampleRepo);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-8 h-8 text-gray-800"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800">GitHub Repository Commits</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        View the last 5 commits from any public GitHub repository
      </p>

      {/* Input Section */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Owner (e.g., facebook)"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          className="border border-gray-300 p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <input
          type="text"
          placeholder="Repo (e.g., react)"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          className="border border-gray-300 p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          onClick={fetchCommits}
          disabled={loading || !owner || !repo}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            loading || !owner || !repo
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
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
              Loading...
            </span>
          ) : (
            'Fetch Commits'
          )}
        </button>
      </div>

      {/* Quick Examples */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600">Try examples:</span>
        <button
          onClick={() => loadExampleRepo('facebook', 'react')}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
        >
          facebook/react
        </button>
        <button
          onClick={() => loadExampleRepo('microsoft', 'vscode')}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
        >
          microsoft/vscode
        </button>
        <button
          onClick={() => loadExampleRepo('nodejs', 'node')}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
        >
          nodejs/node
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Repository Info */}
      {repoInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            📦 {repoInfo.name} - Last {repoInfo.count} commits
          </p>
        </div>
      )}

      {/* Commits List */}
      {commits.length > 0 && (
        <div className="space-y-3">
          {commits.map((commit, index) => (
            <div
              key={commit.sha}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Commit Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <a
                  href={commit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-blue-600 hover:text-blue-800 font-medium text-sm leading-snug hover:underline"
                >
                  {commit.message.split('\n')[0]} {/* First line of commit message */}
                </a>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono">
                  {commit.shortSha}
                </span>
              </div>

              {/* Commit Metadata */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">{commit.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{formatDate(commit.date)}</span>
                </div>
              </div>

              {/* Full commit message if multiline */}
              {commit.message.split('\n').length > 1 && (
                <p className="mt-2 text-xs text-gray-500 pl-5 border-l-2 border-gray-300">
                  {commit.message.split('\n').slice(1).join('\n').trim()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && commits.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-medium">No commits to display</p>
          <p className="text-xs mt-1">Enter a repository owner and name to view recent commits</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> This fetches data from public GitHub repositories. Make sure the
          repository is accessible and the names are spelled correctly.
        </p>
      </div>
    </div>
  );
}
