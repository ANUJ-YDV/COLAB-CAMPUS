import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * GET /api/github/commits
 * Fetch the last 5 commits from a GitHub repository
 *
 * Query params:
 * - owner: GitHub username or organization (e.g., "facebook")
 * - repo: Repository name (e.g., "react")
 *
 * Returns:
 * - Array of commit objects with sha, message, author, date, and url
 */
router.get('/commits', async (req, res) => {
  try {
    const { owner, repo } = req.query;

    // Validation
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Missing required parameters: owner and repo',
        example: '/api/github/commits?owner=facebook&repo=react',
      });
    }

    console.log(`🔍 Fetching commits for ${owner}/${repo}...`);

    // Fetch commits from GitHub API
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      params: {
        per_page: 5, // Get last 5 commits
      },
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : undefined,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CollabCampus-App',
      },
    });

    // Format commit data
    const commits = response.data.map((c) => ({
      sha: c.sha,
      shortSha: c.sha.substring(0, 7), // Short commit hash
      message: c.commit.message,
      author: c.commit.author.name,
      authorEmail: c.commit.author.email,
      date: c.commit.author.date,
      url: c.html_url,
      committer: c.commit.committer.name,
    }));

    console.log(`✅ Found ${commits.length} commits for ${owner}/${repo}`);

    res.json({
      repo: `${owner}/${repo}`,
      commits,
      count: commits.length,
    });
  } catch (err) {
    console.error('❌ GitHub API Error:', err.message);

    // Handle specific GitHub API errors
    if (err.response) {
      const status = err.response.status;

      if (status === 404) {
        return res.status(404).json({
          error: 'Repository not found',
          message: 'Please check the owner and repo name',
        });
      }

      if (status === 403) {
        return res.status(403).json({
          error: 'GitHub API rate limit exceeded',
          message: 'Please add a GITHUB_TOKEN to your .env file for higher limits',
        });
      }

      if (status === 401) {
        return res.status(401).json({
          error: 'Invalid GitHub token',
          message: 'Please check your GITHUB_TOKEN in .env',
        });
      }
    }

    res.status(500).json({
      error: 'Failed to fetch commits',
      message: err.message,
    });
  }
});

/**
 * GET /api/github/repo-info
 * Fetch basic repository information
 *
 * Query params:
 * - owner: GitHub username or organization
 * - repo: Repository name
 *
 * Returns:
 * - Repository details (name, description, stars, forks, etc.)
 */
router.get('/repo-info', async (req, res) => {
  try {
    const { owner, repo } = req.query;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Missing owner or repo' });
    }

    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : undefined,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CollabCampus-App',
      },
    });

    const repoData = {
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      watchers: response.data.watchers_count,
      language: response.data.language,
      url: response.data.html_url,
      defaultBranch: response.data.default_branch,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };

    res.json(repoData);
  } catch (err) {
    console.error('❌ GitHub API Error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch repository info',
      message: err.message,
    });
  }
});

export default router;
