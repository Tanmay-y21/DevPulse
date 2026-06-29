import { Schema, model, Document } from 'mongoose';

export interface IReport extends Document {
  userId: string;
  repository: string;
  fingerprintSha: string; // 👈 Added for cache management
  dailyStandup: {
    yesterday: string;
    today: string;
    blockers: string;
  };
  projectHealth: {
    complexityScore: number;
    summaryAnalysis: string;
    filesImpactedCount: number;
  };
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  userId: { type: String, required: true, index: true },
  repository: { type: String, required: true },
  fingerprintSha: { type: String, required: true, unique: true, index: true }, // 👈 Added unique index for lightning-fast cache hits
  dailyStandup: {
    yesterday: { type: String, required: true },
    today: { type: String, required: true },
    blockers: { type: String, required: true },
  },
  projectHealth: {
    complexityScore: { type: Number, required: true },
    summaryAnalysis: { type: String, required: true },
    filesImpactedCount: { type: Number, required: true },
  },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to quickly fetch cached reports per user/repo combo
ReportSchema.index({ userId: 1, repository: 1, createdAt: -1 });

export const Report = model<IReport>('Report', ReportSchema);