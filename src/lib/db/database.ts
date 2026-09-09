import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'thesis-defense-simulator';
const DB_VERSION = 1;

import type {
  Proposal,
  ProposalAnalysis,
  InterviewSession,
  InterviewMessage,
  AnswerEvaluation,
  DefenseReport,
  HumanJudgment
} from '../../types/domain';

export interface ThesisDefenseDBSchema extends DBSchema {
  proposals: { key: string; value: Proposal };
  proposalAnalyses: { key: string; value: ProposalAnalysis };
  interviewSessions: { key: string; value: InterviewSession };
  interviewMessages: { key: string; value: InterviewMessage; indexes: { 'sessionId': string } };
  answerEvaluations: { key: string; value: AnswerEvaluation };
  reports: { key: string; value: DefenseReport };
  judgments: { key: string; value: HumanJudgment; indexes: { 'sessionId': string } };
}

export async function openDatabase(): Promise<IDBPDatabase<ThesisDefenseDBSchema>> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is unavailable in this browser.');
  }

  return openDB<ThesisDefenseDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('proposals')) {
        db.createObjectStore('proposals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('proposalAnalyses')) {
        db.createObjectStore('proposalAnalyses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('interviewSessions')) {
        db.createObjectStore('interviewSessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('interviewMessages')) {
        const store = db.createObjectStore('interviewMessages', { keyPath: 'id' });
        store.createIndex('sessionId', 'sessionId');
      }
      if (!db.objectStoreNames.contains('answerEvaluations')) {
        db.createObjectStore('answerEvaluations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('judgments')) {
        const store = db.createObjectStore('judgments', { keyPath: 'id' });
        store.createIndex('sessionId', 'sessionId');
      }
    }
  });
}

export const dbStore = {
  async getProposal(id: string) {
    const db = await openDatabase();
    return db.get('proposals', id);
  },
  async saveProposal(proposal: Proposal) {
    const db = await openDatabase();
    await db.put('proposals', proposal);
  },
  async saveAnalysis(analysis: ProposalAnalysis) {
    const db = await openDatabase();
    await db.put('proposalAnalyses', analysis);
  },
  async getSession(id: string) {
    const db = await openDatabase();
    return db.get('interviewSessions', id);
  },
  async saveSession(session: InterviewSession) {
    const db = await openDatabase();
    await db.put('interviewSessions', session);
  },
  async getMessages(sessionId: string) {
    const db = await openDatabase();
    const all = await db.getAll('interviewMessages');
    return all.filter(m => m.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp);
  },
  async saveMessage(message: InterviewMessage) {
    const db = await openDatabase();
    await db.put('interviewMessages', message);
  },
  async saveReport(report: DefenseReport) {
    const db = await openDatabase();
    await db.put('reports', report);
  },
  async getReport(sessionId: string) {
    const db = await openDatabase();
    return db.get('reports', sessionId);
  },
  async saveJudgment(judgment: HumanJudgment) {
    const db = await openDatabase();
    await db.put('judgments', judgment);
  },
  async getJudgments(sessionId: string) {
    const db = await openDatabase();
    const all = await db.getAll('judgments');
    return all.filter(j => j.sessionId === sessionId).sort((a, b) => a.evaluatedAt - b.evaluatedAt);
  },
  async getAllSessions() {
    const db = await openDatabase();
    return db.getAll('interviewSessions');
  }
};
