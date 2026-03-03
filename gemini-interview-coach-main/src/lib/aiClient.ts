/**
 * Client-side Groq API — replacing Groq for better reliability.
 * Key comes from: 1) user input in UI, or 2) VITE_GROQ_API_KEY env var.
 */

const ENV_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export function hasAIClientKey(override?: string): boolean {
  return !!override?.trim() || !!ENV_KEY?.trim();
}

function getKey(override?: string): string {
  const k = override?.trim() || ENV_KEY?.trim();
  if (!k) throw new Error("Groq API key required. Paste your key in the input field or set VITE_GROQ_API_KEY.");
  return k;
}

async function callGroq(key: string, messages: any[], temperature = 0.3): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" }
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || "";

    if (res.status === 401 || /invalid_api_key|unauthorized/i.test(msg)) {
      throw new Error(`Invalid Groq API key. Please check your key or get a new one at console.groq.com/keys. (Details: ${msg})`);
    }

    if (res.status === 429 || /quota|exhausted|rate_limit/i.test(msg)) {
      throw new Error(`Groq API rate limit reached. (Details: ${msg}). Free keys have limits, try again in a minute.`);
    }

    throw new Error(`Groq API error (${res.status}): ${msg}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

function parseJsonResponse(text: string, type: "array" | "object"): any {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch {
    const startChar = type === "array" ? "[" : "{";
    const endChar = type === "array" ? "]" : "}";
    const start = cleaned.indexOf(startChar);
    const end = cleaned.lastIndexOf(endChar);
    if (start === -1 || end === -1) throw new Error("Invalid response format from AI");
    return JSON.parse(cleaned.substring(start, end + 1));
  }
}

export async function generateQuestionsDirect(
  resumeText: string,
  numberOfQuestions = 5,
  apiKeyOverride?: string
): Promise<unknown[]> {
  const key = getKey(apiKeyOverride);
  const prompt = `You are an expert technical interviewer. ONLY use information EXPLICITLY in the resume. Return ONLY a JSON object with a "questions" array of ${numberOfQuestions} interview questions. 
  Format: {"questions": [{"id":1,"question":"...","category":"Technical","difficulty":"Medium","relatedSkill":"...","expectedKeyPoints":["..."]}]}
  
  ===== RESUME =====
  ${resumeText}
  ===== END =====`;

  const text = await callGroq(key, [
    { role: "system", content: "You are a helpful assistant that returns data in JSON format." },
    { role: "user", content: prompt }
  ], 0.2);

  const parsed = parseJsonResponse(text, "object");
  const qs = parsed.questions || parsed;
  return Array.isArray(qs) ? qs.map((q: any, i: number) => ({ ...q, id: q.id ?? i + 1 })) : [];
}

export async function generateHRQuestionsDirect(
  resumeText: string,
  numberOfQuestions = 5,
  apiKeyOverride?: string
): Promise<unknown[]> {
  const key = getKey(apiKeyOverride);
  const prompt = `You are a senior HR interviewer. Based on the candidate's resume, generate ${numberOfQuestions} HR interview questions.
  Return ONLY a JSON object with a "questions" array.
  
  Mix these categories equally:
  - Behavioral (teamwork, conflict resolution, leadership, adaptability)
  - Technical HR (work style, career goals, strengths/weaknesses, culture fit)
  - Situational (hypothetical workplace scenarios)
  
  Questions should be professional, insightful, and relevant to the candidate's experience level.
  
  Format: {"questions": [{"id":1,"question":"...","category":"Behavioral","difficulty":"Medium","relatedSkill":"Teamwork","expectedKeyPoints":["..."]}]}
  
  ===== RESUME =====
  ${resumeText}
  ===== END =====`;

  const text = await callGroq(key, [
    { role: "system", content: "You are a helpful assistant that returns data in JSON format." },
    { role: "user", content: prompt }
  ], 0.3);

  const parsed = parseJsonResponse(text, "object");
  const qs = parsed.questions || parsed;
  return Array.isArray(qs) ? qs.map((q: any, i: number) => ({ ...q, id: 100 + (q.id ?? i + 1) })) : [];
}

export async function analyzePresentationDirect(
  imageData: string,
  transcript: string,
  mediaPipeScores: Record<string, number>,
  questionText: string,
  apiKeyOverride?: string
): Promise<Record<string, unknown>> {
  const key = getKey(apiKeyOverride);

  // Note: Groq (Llama 3) is text-based. We will focus analysis on transcript and MediaPipe scores.
  // We cannot process the imageData frame directly like Groq Multimodal.

  const prompt = `Analyze this interview performance. 
  Question: "${questionText}"
  MediaPipe Vision Scores: ${JSON.stringify(mediaPipeScores)}
  Speech Transcript: "${transcript}"
  
  Return ONLY valid JSON: {
    "vision": {"eyeContact":0,"posture":0,"expression":0,"bodyLanguage":0,"feedback":""},
    "voice": {"clarity":0,"pace":0,"tone":0,"engagement":0,"feedback":""},
    "content": {"relevance":0,"depth":0,"starMethod":0,"feedback":""},
    "overall": 0,
    "summary": "",
    "topStrengths": [],
    "topImprovements": []
  }
  
  Use the MediaPipe scores to calculate the vision feedback. Analyze the transcript for content and voice quality.`;

  const text = await callGroq(key, [
    { role: "system", content: "You are an expert interview coach. Return analysis in strict JSON format." },
    { role: "user", content: prompt }
  ], 0.3);

  return parseJsonResponse(text, "object") as Record<string, unknown>;
}
