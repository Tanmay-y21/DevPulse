import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Gen AI SDK using the standard environment variable
const ai = new GoogleGenAI({});

export interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
}

// Define the exact TypeScript interface for what this function will return
export interface StandupReportResponse {
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
}

/**
 * Define the validation schema for the Gemini SDK.
 * This forces the AI model to reply only in this exact structural format.
 */
const standupSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dailyStandup: {
      type: Type.OBJECT,
      properties: {
        yesterday: {
          type: Type.STRING,
          description: "Bullet points detailing exactly what work was accomplished based on the commits. Translate them into business value/progress.",
        },
        today: {
          type: Type.STRING,
          description: "Bullet points identifying logical next steps or immediate trajectory inferred from recent code changes.",
        },
        blockers: {
          type: Type.STRING,
          description: "Potential risks, technical debt items, or 'None reported' if the changes look clean.",
        },
      },
      required: ["yesterday", "today", "blockers"],
    },
    projectHealth: {
      type: Type.OBJECT,
      properties: {
        complexityScore: {
          type: Type.INTEGER,
          description: "A calculated code complexity rating from 1 (simple changes) to 100 (highly volatile/complex refactoring).",
        },
        summaryAnalysis: {
          type: Type.STRING,
          description: "A brief, high-level single-sentence overview tracking the architectural health or refactoring pattern.",
        },
        filesImpactedCount: {
          type: Type.INTEGER,
          description: "An estimation or extraction of distinct code modules or files altered.",
        },
      },
      required: ["complexityScore", "summaryAnalysis", "filesImpactedCount"],
    },
  },
  required: ["dailyStandup", "projectHealth"],
};

/**
 * Analyzes an array of commits and returns a strictly structured JSON engineering report.
 */
export async function generateStandupReport(commits: CommitData[]): Promise<StandupReportResponse> {
  try {
    if (!commits || commits.length === 0) {
      throw new Error("No recent engineering transactions detected to analyze.");
    }

    // Convert the commits array into a readable text block for the model context
    const commitSummaryText = commits
      .map(c => `[Commit ${c.sha.substring(0, 7)}] by ${c.author}: ${c.message}`)
      .join('\n');

    const prompt = `
      You are an expert technical lead and scrum master. Review the following list of recent code commits from a developer's workspace and generate a structured JSON report including both the daily standup summaries and a code health assessment.
      
      Recent Commits:
      ${commitSummaryText}
    `;

    // Execute the request forcing a JSON structured output configuration
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly perceptive Engineering Lead. Synthesize clean engineering standup components and metrics. Keep text block string entries clean, bulleted using standard Markdown (- point), and professional. Avoid conversational filler.",
        responseMimeType: "application/json",
        responseSchema: standupSchema,
        temperature: 0.2, // Low temperature for consistent analysis
      }
    });

    if (response.text) {
      // Because we used responseSchema, parsing this is perfectly safe
      return JSON.parse(response.text) as StandupReportResponse;
    }
    
    throw new Error("The AI processing layer returned an empty response stream.");

  } catch (error: any) {
    console.error("Error inside AI Generation Service:", error.message);
    throw new Error(`AI processing pipeline failed: ${error.message}`);
  }
}