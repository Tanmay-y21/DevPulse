import mongoose from 'mongoose';

const ReportCacheSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  repository: { type: String, required: true, index: true },
  latestCommitSha: { type: String, required: true, index: true },
  summary: {
    dailyStandup: {
      yesterday: String,
      today: String,
      blockers: String,
    },
    projectHealth: {
      complexityScore: Number,
      summaryAnalysis: String,
      filesImpactedCount: Number,
    },
  },
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Automatically purges old caches after 24 hours
});

// Compound index to guarantee lightning-fast lookups
ReportCacheSchema.index({ repository: 1, latestCommitSha: 1 });

export default mongoose.model('ReportCache', ReportCacheSchema);