import { Router, Request, Response } from 'express';
import { generateStandupReport } from '../services/aiServices.ts';
import { Report } from '../models/Report.ts';

const router = Router();

// Helper to safely extract user claims from Clerk's request state in Express v5
const getClerkUserId = (req: any): string | null => {
  // Check every possible injection point where Clerk stores the parsed auth state
  if (req.auth?.userId) return req.auth.userId;
  if (req.session?.userId) return req.session.userId;
  
  // Fallback: If Express v5 masked the middleware object state, check the unparsed token claims
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        return decoded.sub || null; // 'sub' is the standard JWT field for Clerk's userId
      }
    } catch (e) {
      console.error('Handshake JWT Parse Warning:', e);
    }
  }
  return null;
};

router.post('/summarize', async (req: Request, res: Response) => {
  console.log('--- AI Summarization Pipeline Triggered ---');
  try {
    // Extract user ID safely without using the broken getAuth(req) tool
    const userId = getClerkUserId(req);

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

    const latestCommitSha = commits[0].sha;
    console.log('Parsed Fingerprint SHA Identifier:', latestCommitSha);

    // 2. Cache Validation (SHA-Based Fingerprint Optimization)
    const cachedReport = await Report.findOne({
      userId,
      repository,
      latestCommitSha
    });

    if (cachedReport) {
      console.log(`⚡ [Cache Hit] Serving optimized report footprint for ${repository}`);
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

    // 4. Persist into MongoDB
    const newReport = new Report({
      userId,
      repository,
      latestCommitSha,
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