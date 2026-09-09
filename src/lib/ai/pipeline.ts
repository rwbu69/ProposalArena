import type { AIProvider } from '../../types/ai';
import type { ProposalAnalysis, InterviewMessage, AnswerEvaluation, DefenseReport } from '../../types/domain';

export async function analyzeProposal(provider: AIProvider, text: string, language: 'en' | 'id'): Promise<ProposalAnalysis> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const prompt = `You are a thesis advisor. Analyze the following thesis proposal text. 
Respond in ${sysLang}.
Return ONLY a valid JSON object with the following schema:
{
  "title": "String",
  "researchProblem": "String",
  "researchQuestions": ["String"],
  "objectives": ["String"],
  "methodology": "String",
  "limitations": "String",
  "weaknesses": "String",
  "likelyTopics": ["String"]
}
Text to analyze:
${text.slice(0, 15000)} // Truncating to avoid token limits for now`;

  const response = await provider.generate({
    model: provider.defaultModel,
    messages: [
      { role: 'system', content: 'You are an expert academic evaluator.' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.1
  });

  return JSON.parse(response.text) as ProposalAnalysis;
}

export async function generateQuestion(provider: AIProvider, analysis: ProposalAnalysis, transcript: InterviewMessage[], language: 'en' | 'id', difficulty: number): Promise<string> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const transcriptText = transcript.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const prompt = `You are an examiner in a thesis proposal defense. The defense is conducted in ${sysLang}.
Based on the proposal analysis and the transcript so far, generate the NEXT question for the student.
Difficulty level (1-5): ${difficulty}
Ask only ONE question. Do not provide greetings or explanations.

Analysis:
${JSON.stringify(analysis, null, 2)}

Transcript:
${transcriptText}`;

  const response = await provider.generate({
    model: provider.defaultModel,
    messages: [
      { role: 'system', content: 'You are a strict but fair thesis examiner. Ask concise, challenging questions.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  });

  return response.text.trim();
}

export async function evaluateAnswer(provider: AIProvider, question: string, answer: string, language: 'en' | 'id'): Promise<Partial<AnswerEvaluation>> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const prompt = `Evaluate the student's answer to the question in ${sysLang}.
Return ONLY a JSON object with this schema:
{
  "correctness": Number (1-5),
  "relevance": Number (1-5),
  "depth": Number (1-5),
  "justification": Number (1-5),
  "clarity": Number (1-5),
  "feedback": "String (Constructive feedback)"
}

Question: ${question}
Answer: ${answer}`;

  const response = await provider.generate({
    model: provider.defaultModel,
    messages: [
      { role: 'system', content: 'You are a thesis examiner evaluating a student.' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.1
  });

  return JSON.parse(response.text) as Partial<AnswerEvaluation>;
}

export async function generateReport(provider: AIProvider, transcript: InterviewMessage[], language: 'en' | 'id'): Promise<DefenseReport> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const transcriptText = transcript.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const prompt = `You are a thesis advisor writing a final defense report.
Analyze the following interview transcript. Write the report in ${sysLang}.
Return ONLY a valid JSON object with the following schema:
{
  "strengths": ["String"],
  "weaknesses": ["String"],
  "recommendations": ["String"],
  "practiceQuestions": ["String"],
  "summary": "String"
}

Transcript:
${transcriptText}`;

  const response = await provider.generate({
    model: provider.defaultModel,
    messages: [
      { role: 'system', content: 'You are an expert academic evaluator.' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.2
  });

  const parsed = JSON.parse(response.text);
  return {
    ...parsed,
    generatedAt: Date.now()
  } as DefenseReport;
}
