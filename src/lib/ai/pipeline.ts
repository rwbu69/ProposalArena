import type { AIProvider, AIRequest } from '../../types/ai';
import type { ProposalAnalysis, InterviewMessage, AnswerEvaluation, DefenseReport } from '../../types/domain';
import examinerPromptTemplate from '../../prompts/examiner.md?raw';
import { validateAnswerEvaluation, validateDefenseReport, validateProposalAnalysis } from './validation';

export function cleanAndParseJson<T>(raw: string): T {
  let cleaned = raw.trim();
  // Strip code fences like ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  // Extract substring between outermost braces if extra narrative is present
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    // LLMs frequently output trailing commas before ] or } which standard JSON disallows.
    const sanitized = cleaned.replace(/,\s*([\]}])/g, '$1');
    try {
      return JSON.parse(sanitized) as T;
    } catch {
      throw firstError;
    }
  }
}

export async function analyzeProposal(provider: AIProvider, text: string, language: 'en' | 'id'): Promise<ProposalAnalysis> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const prompt = `You are a thesis advisor. Analyze the following thesis proposal text. 
Respond in ${sysLang}.
Return ONLY a valid JSON object with the following schema:
{
  "title": "String",
  "field": "String (Computer Science sub-field, e.g., Machine Learning, HCI, Systems)",
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
    language,
    messages: [
      { role: 'system', content: 'You are an expert academic evaluator.' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.1
  });

  return validateProposalAnalysis(cleanAndParseJson<unknown>(response.text));
}

export async function generateQuestion(provider: AIProvider, analysis: ProposalAnalysis, transcript: InterviewMessage[], language: 'en' | 'id', difficulty: number): Promise<string> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const recentTranscript = transcript.slice(-6);
  const transcriptText = recentTranscript.map(m => `${m.role}: ${m.content}`).join('\n');
  
  // Advanced Grounding: search for relevant chunks
  let relevantContext = 'No specific excerpts retrieved.';
  if (analysis.id) {
    const { globalIndexer } = await import('../search/indexer');
    const chunks = globalIndexer.searchContext(analysis.id, transcriptText);
    if (chunks.length > 0) {
      relevantContext = chunks.join('\n\n---\n\n');
    }
  }

  const prompt = examinerPromptTemplate
    .replace(/{{LANGUAGE}}/g, sysLang)
    .replace(/{{DIFFICULTY}}/g, difficulty.toString())
    .replace(/{{FIELD}}/g, analysis.field || 'Computer Science')
    .replace(/{{ANALYSIS}}/g, JSON.stringify(analysis, null, 2))
    .replace(/{{RELEVANT_CONTEXT}}/g, relevantContext)
    .replace(/{{TRANSCRIPT}}/g, transcriptText);

  const response = await provider.generate({
    model: provider.defaultModel,
    language,
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
    language,
    messages: [
      { role: 'system', content: 'You are a thesis examiner evaluating a student.' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.1
  });

  return validateAnswerEvaluation(cleanAndParseJson<unknown>(response.text));
}

function toCleanStringArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(item => (typeof item === 'string' ? item.trim() : String(item))).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split('\n')
      .map(line => line.replace(/^[-*•\d\.\)]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeDefenseReport(raw: any): DefenseReport {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      practiceQuestions: [],
      notes: [],
      summary: '',
      generatedAt: Date.now()
    };
  }

  return {
    id: raw.id || '',
    strengths: toCleanStringArray(raw.strengths || raw.kelebihan || raw.kekuatan),
    weaknesses: toCleanStringArray(raw.weaknesses || raw.kelemahan || raw.kekurangan),
    recommendations: toCleanStringArray(raw.recommendations || raw.rekomendasi || raw.saran),
    practiceQuestions: toCleanStringArray(raw.practiceQuestions || raw.pertanyaanLatihan || raw.pertanyaanPraktik || raw.pertanyaan),
    notes: toCleanStringArray(raw.notes || raw.catatan),
    summary: typeof raw.summary === 'string' ? raw.summary : (typeof raw.ringkasan === 'string' ? raw.ringkasan : ''),
    generatedAt: typeof raw.generatedAt === 'number' ? raw.generatedAt : Date.now()
  };
}

export async function generateReport(provider: AIProvider, transcript: InterviewMessage[], language: 'en' | 'id'): Promise<DefenseReport> {
  const sysLang = language === 'en' ? 'English' : 'Bahasa Indonesia';
  const transcriptText = transcript.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const prompt = `You are an experienced, empathetic, and constructive academic thesis advisor and mentor conducting a comprehensive post-defense debrief.
Your goal is to provide a grounded, constructive, and empowering evaluation of the student's proposal defense rehearsal.
Analyze the following interview transcript. Write all values/content strictly in ${sysLang}.
Maintain an encouraging yet rigorous academic tone. Avoid generic slogans or clichés; focus directly on substance, clarity of research logic, and defensibility.

IMPORTANT: The JSON keys MUST remain strictly in English ("strengths", "weaknesses", "recommendations", "practiceQuestions", "notes", "summary"). Do NOT translate the JSON keys into ${sysLang}.

Return ONLY a valid JSON object matching this schema:
{
  "strengths": [
    "String: Concrete aspects of the proposal or arguments that were solid, convincing, and well-justified"
  ],
  "weaknesses": [
    "String: Specific areas that need deepening or clarification, explaining what examiners look for and how to strengthen them"
  ],
  "recommendations": [
    "String: Prioritized, actionable next steps for the student to execute before the actual defense day"
  ],
  "practiceQuestions": [
    "String: Targeted drill questions that examiners are likely to raise regarding the identified research gaps"
  ],
  "notes": [
    "String: Constructive feedback on the student's communication clarity, composure, and answer structuring"
  ],
  "summary": "String: A reflective narrative synthesis of the student's overall defense readiness, acknowledging their effort while outlining key developmental priorities"
}

Transcript:
${transcriptText}`;

  const request: AIRequest = {
    model: provider.defaultModel,
    language,
    messages: [
      { role: 'system', content: 'You are an expert academic mentor and thesis advisor focused on constructive student empowerment.' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.2
  };

  const response = await provider.generate(request);
  let parsed: unknown;
  try {
    parsed = cleanAndParseJson<unknown>(response.text);
  } catch {
    const retryResponse = await provider.generate({
      ...request,
      messages: [
        ...request.messages,
        {
          role: 'user',
          content: `Your previous response was not valid JSON. Return only the JSON object matching the requested schema. Do not include a refusal, explanation, markdown fence, or commentary.`
        }
      ]
    });
    try {
      parsed = cleanAndParseJson<unknown>(retryResponse.text);
    } catch {
      throw new Error('The AI model did not return a valid JSON report. Try another OpenRouter model.');
    }
  }

  return {
    ...validateDefenseReport(parsed),
    generatedAt: Date.now()
  };
}
