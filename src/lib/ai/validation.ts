import type { AnswerEvaluation, DefenseReport, ProposalAnalysis } from '../../types/domain';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`AI response field "${field}" must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredString(value, field);
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error(`AI response field "${field}" must be an array of non-empty strings.`);
  }
  return value.map(item => item.trim());
}

function score(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`AI response field "${field}" must be an integer from 1 to 5.`);
  }
  return value;
}

export function validateProposalAnalysis(value: unknown): ProposalAnalysis {
  if (!isRecord(value)) throw new Error('AI proposal analysis must be an object.');

  return {
    id: typeof value.id === 'string' ? value.id : '',
    title: optionalString(value.title, 'title'),
    field: optionalString(value.field, 'field'),
    researchProblem: optionalString(value.researchProblem, 'researchProblem'),
    researchQuestions: value.researchQuestions === undefined ? undefined : stringArray(value.researchQuestions, 'researchQuestions'),
    objectives: value.objectives === undefined ? undefined : stringArray(value.objectives, 'objectives'),
    methodology: optionalString(value.methodology, 'methodology'),
    limitations: optionalString(value.limitations, 'limitations'),
    weaknesses: optionalString(value.weaknesses, 'weaknesses'),
    likelyTopics: value.likelyTopics === undefined ? undefined : stringArray(value.likelyTopics, 'likelyTopics'),
    analyzedAt: typeof value.analyzedAt === 'number' ? value.analyzedAt : Date.now()
  };
}

export function validateAnswerEvaluation(value: unknown): Partial<AnswerEvaluation> {
  if (!isRecord(value)) throw new Error('AI answer evaluation must be an object.');

  return {
    correctness: score(value.correctness, 'correctness'),
    relevance: score(value.relevance, 'relevance'),
    depth: score(value.depth, 'depth'),
    justification: score(value.justification, 'justification'),
    clarity: score(value.clarity, 'clarity'),
    feedback: requiredString(value.feedback, 'feedback')
  };
}

export function validateDefenseReport(value: unknown): DefenseReport {
  if (!isRecord(value)) throw new Error('AI defense report must be an object.');

  return {
    id: typeof value.id === 'string' ? value.id : '',
    strengths: stringArray(value.strengths, 'strengths'),
    weaknesses: stringArray(value.weaknesses, 'weaknesses'),
    recommendations: stringArray(value.recommendations, 'recommendations'),
    practiceQuestions: stringArray(value.practiceQuestions, 'practiceQuestions'),
    notes: value.notes === undefined ? [] : stringArray(value.notes, 'notes'),
    summary: requiredString(value.summary, 'summary'),
    generatedAt: typeof value.generatedAt === 'number' ? value.generatedAt : Date.now()
  };
}
