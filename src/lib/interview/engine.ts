export type InterviewState =
  | 'CREATED'
  | 'READY'
  | 'QUESTIONING'
  | 'WAITING_FOR_ANSWER'
  | 'EVALUATING'
  | 'FOLLOW_UP'
  | 'COMPLETED'
  | 'REPORT_GENERATION'
  | 'REPORT_READY';

export interface InterviewSession {
  id: string;
  state: InterviewState;
  questionIndex: number;
  difficulty: number;
}

export function canTransition(from: InterviewState, to: InterviewState): boolean {
  const allowed: Record<InterviewState, InterviewState[]> = {
    CREATED: ['READY'],
    READY: ['QUESTIONING'],
    QUESTIONING: ['WAITING_FOR_ANSWER'],
    WAITING_FOR_ANSWER: ['EVALUATING'],
    EVALUATING: ['FOLLOW_UP', 'QUESTIONING', 'COMPLETED'],
    FOLLOW_UP: ['WAITING_FOR_ANSWER'],
    COMPLETED: ['REPORT_GENERATION'],
    REPORT_GENERATION: ['REPORT_READY'],
    REPORT_READY: []
  };
  return allowed[from].includes(to);
}

export function transitionSession(session: InterviewSession, to: InterviewState): InterviewSession {
  if (!canTransition(session.state, to)) {
    throw new Error(`Invalid interview transition: ${session.state} -> ${to}`);
  }
  return { ...session, state: to };
}
