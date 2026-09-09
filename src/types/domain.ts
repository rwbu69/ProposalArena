import type { InterviewState } from '../lib/interview/engine';

export interface Proposal {
  id: string;
  title: string;
  text: string;
  language: 'en' | 'id';
  uploadedAt: number;
}

export interface ProposalAnalysis {
  id: string;
  title?: string;
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
  summary: string;
  generatedAt: number;
}
