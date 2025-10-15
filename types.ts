export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  suggestions?: string[];
}

export type ToolCategory =
  '生成AIチャット' |
  'ノーコード開発' |
  'カスタムAIチャット' |
  'GAS' |
  'システム開発' |
  'その他';

export interface Carte {
  workId: string;
  title: string;
  category: string;
  frequency: string;
  monthlyCount: number;
  totalMinutes: number; // minutes per run (1-time total)
  numSteps: number;
  primaryTool: string;
  currentBottlenecks: string[];
  primaryData: string;
  dataFormat: string;
  dataState: string;
  dataStorage: string;
  apiIntegration: string;
  asIsSummary: string;
  asIsSteps: AsIsStep[]; // Embedded As-Is steps
  automationScore: number;
  automationScoreRationale: string; // rationale for automation score
  humanDependency: '高' | '中' | '低';
  humanDependencyRationale: string;
  notes: string;
  recommendedSolution: string;
  recommendedToolCategory: ToolCategory;
  toBeSummary: string;
  toBeSteps: ToBeStep[]; // Embedded To-Be steps
  improvementImpact: string;
  monthlySavedMinutes: number; // per-carte monthly saved minutes
  estimatedInternalCostJPY: number; // self-build development cost estimate (JPY)
  totalWorkloadMinutesPerMonth?: number; // derived: totalMinutes * monthlyCount * numberOfPeople
  numberOfPeople?: number;
  advancedProposal: {
    title: string;
    description: string;
  };
}

export interface AsIsStep {
  workId: string;
  stepNo: number;
  asIsStepName: string;
  toolUsed: string;
  minutes: number;
  input: string;
  output: string;
  dataState: string;
}

export interface ToBeStep {
  workId: string;
  stepNo: number;
  toBeStepName: string;
  executorType: 'manual' | 'automated';
  toolUsed: string;
  minutes: number;
  improvementPoint: string;
}

export type Answers = {
  [key: string]: string | null;
};

// --- User Profile ---
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  fullname: string;
  department: string;
  email: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
