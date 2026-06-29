import { Router, Request, Response } from 'express';
import { Report } from '../models/Report.js';
import { generateStandupReport } from '../services/aiServices.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  console.log('⚓ GitHub Webhook Event Received!');

  try {
    const eventType = req.headers['x-github-event'];

    if (eventType === 'push') {
      const { repository: repoPayload, commits } = req.body;
      const repoName = repoPayload?.full_name; // e.g., "Tanmay-y21/SystemGuardian"

      if (commits && commits.length > 0) {
        const latestCommitSha = commits[0].id;
        const fingerprintSha = latestCommitSha.substring(0, 7);
        console.log(`📦 Webhook Pushed: ${repoName} | Fingerprint: ${fingerprintSha}`);

        // 1. Check database cache
        const existingReport = await Report.findOne({ fingerprintSha });

        if (existingReport) {
          console.log(`⚡ [Webhook Cache Hit] Analysis for SHA ${fingerprintSha} already exists.`);
          return res.status(200).json({ success: true, cached: true });
        }

        console.log(`🤖 [Webhook Cache Miss] Running background pipeline...`);

        // 2. Discover who owns this repository in your database from prior manual loads
        const previousUserReport = await Report.findOne({ repository: repoName });
        const userId = previousUserReport ? previousUserReport.userId : 'webhook_automated_fallback';

        // 3. Format commits array for your Gemini service structure
        const formattedCommits = commits.map((c: any) => ({
          sha: c.id,
          commit: {
            message: c.message,
            author: { name: c.author.name, date: c.timestamp }
          }
        }));

        // 4. Fire AI Pipeline (Assumes your service returns structured data matching your sub-schemas)
        const aiAnalysis = await generateStandupReport(formattedCommits);

        // 5. Build and save the structured Mongoose document
        const newReport = new Report({
          userId,
          repository: repoName,
          fingerprintSha,
          dailyStandup: {
            yesterday: aiAnalysis.dailyStandup?.yesterday || 'Refactoring existing architectural frameworks.',
            today: aiAnalysis.dailyStandup?.today || 'Processing recent webhook automated push adjustments.',
            blockers: aiAnalysis.dailyStandup?.blockers || 'None detected.'
          },
          projectHealth: {
            complexityScore: aiAnalysis.projectHealth?.complexityScore || 70,
            summaryAnalysis: aiAnalysis.projectHealth?.summaryAnalysis || 'Codebase structural updates pushed through active automated deployment pipelines.',
            filesImpactedCount: commits.length // Quick structural mapping logic
          }
        });

        await newReport.save();
        console.log(`💾 Automated Background Report cached successfully for SHA ${fingerprintSha}!`);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook pipeline processed.' });
  } catch (error: any) {
    console.error('❌ Webhook Processing Pipeline Exception:', error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

export default router;