import { Router, Request, Response } from 'express';
import { clerkMiddleware, getAuth, createClerkClient } from '@clerk/express';
import dotenv from 'dotenv';
import { fetchRecentCommits, fetchUserRepositories } from '../services/githubService.js';
dotenv.config();
const router = Router();
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

// We don't need requireAuth() here anymore since getAuth(req) handles validation elegantly
router.get('/commits', async (req: Request, res: Response) => {
  console.log('--- New Request Received ---');
  try {
    // 1. Properly extract the authenticated state using the modern SDK helper
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!userId) {
      console.log('No user ID found in token context');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const providerTokens = await clerkClient.users.getUserOauthAccessToken(userId, 'github');
    const githubToken = providerTokens.data[0]?.token;

    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub authorization token missing.' });
    }

    const owner = (req.query.owner as string) || 'octocat';
    const repo = (req.query.repo as string) || 'Hello-World';

    console.log(`Fetching latest git activity for: ${owner}/${repo}`);
    const commits = await fetchRecentCommits(githubToken, owner, repo);

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      commits
    });

  } catch (error: any) {
    console.error('Commit Pipeline Exception:', error.message);
    res.status(500).json({ 
      error: 'Failed to extract GitHub repository streams.', 
      details: error.message 
    });
  }
});

// Add this route to your existing github.ts file:
router.get('/repos', async (req: Request, res: Response) => {
  console.log('--- Fetching User Repository Index ---');
  try {
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const providerTokens = await clerkClient.users.getUserOauthAccessToken(userId, 'github');
    const githubToken = providerTokens.data[0]?.token;

    if (!githubToken) return res.status(400).json({ error: 'GitHub token missing.' });

    const repositories = await fetchUserRepositories(githubToken);
    res.json({ success: true, repositories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to extract repos.', details: error.message });
  }
});

export default router;