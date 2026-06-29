import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { generateStandupReport } from '../services/aiServices.ts';
import { Report } from '../models/Report.ts';

const router = Router();

router.post('/summarize', async (req: Request, res: Response) => {
  console.log('--- AI Summarization Pipeline Triggered ---');
  try {
    // 1. Authenticate user context via Clerk
    const auth = getAuth(req);
    const userId = auth.userId;

    console.log('User Identity Context:', userId);
    console.log('Payload Repository Name:', req.body?.repository);
    console.log('Commits Array Length:', req.body?.commits?.length);

    if (!userId) {
        console.log('❌ Pipeline halted: Clerk user context is unauthorized or missing.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { commits, repository } = req.body;

    if (!repository) {
      return res.status(400).json({ error: 'Missing target repository context name.' });
    }

    if (!commits || !Array.isArray(commits) || commits.length === 0) {
      return res.status(400).json({ error: 'No structured commit records provided to summarize.' });
    }

    // Capture the deterministic fingerprint of this commit block
    const latestCommitSha = commits[0].sha;
    console.log('Parsed Fingerprint SHA Identifier:', latestCommitSha);

    // 2. Cache Validation (SHA-Based Fingerprint Optimization)
    // Find a cached report that matches the exact state of this branch 
    const cachedReport = await Report.findOne({
      userId,
      repository,
      latestCommitSha // <-- Ensures we don't serve stale data if new code was pushed!
    });

    if (cachedReport) {
      console.log(`⚡ [Cache Hit] Serving optimized report footprint for ${repository} at ${latestCommitSha}`);
      return res.json({
        success: true,
        cached: true,
        summary: {
          dailyStandup: cachedReport.dailyStandup,
          projectHealth: cachedReport.projectHealth
        }
      });
    }

    // 3. Run the AI processing engine
    console.log(`🤖 [Cache Miss] Compiling fresh Gemini analysis for ${repository}...`);
    const summary = await generateStandupReport(commits);

    // 4. Persist the beautifully formatted JSON payload into MongoDB
    const newReport = new Report({
      userId,
      repository,
      latestCommitSha, // <-- Save this identifier alongside the document payload
      dailyStandup: summary.dailyStandup,
      projectHealth: summary.projectHealth
    });
    await newReport.save();

    res.json({
      success: true,
      cached: false,
      summary
    });

  } catch (error: any) {
    console.error('AI Route Processing Exception:', error.message);
    res.status(500).json({ 
      error: 'AI Core failed to compile and save report.', 
      details: error.message 
    });
  }
});

export default router;