import type { InterviewState } from '../lib/interview/engine';

export interface Proposal {
  id: string;
  title: string;
  text: string;
  fileData?: ArrayBuffer; // For PDF rendering
  language: 'en' | 'id';
  uploadedAt: number;
}

export interface ProposalAnalysis {
  id: string;
  title?: string;
  field?: string;
  researchProblem?: string;
  researchQuestions?: string[];
  objectives?: string[];
  methodology?: string;
  limitations?: string;
  weaknesses?: string;
  likelyTopics?: string[];
  analyzedAt: number;
}

export interface InterviewSession {
  id: string;
  proposalId: string;
  state: InterviewState;
  questionIndex: number;
  difficulty: number;
  interruptions: number;
  createdAt: number;
  updatedAt: number;
}

export interface InterviewMessage {
  id: string;
  sessionId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AnswerEvaluation {
  id: string;
  sessionId: string;
  correctness: number;
  relevance: number;
  depth: number;
  justification: number;
  clarity: number;
  feedback: string;
  evaluatedAt: number;
}

export interface DefenseReport {
  id: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  practiceQuestions: string[];
  notes?: string[];
  summary: string;
  generatedAt: number;
}

export interface HumanJudgment {
  id: string; // e.g. "judgment_sessionId_messageId"
  sessionId: string;
  messageId: string; // The ID of the assistant's question message
  relevanceScore: number; // 1-5
  difficultyScore: number; // 1-5
  notes?: string;
  evaluatedAt: number;
}
