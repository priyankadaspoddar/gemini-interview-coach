/**
 * Client-side Groq API for interview analysis.
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
  if (!k) throw new Error("Groq API key required. Paste your key in the input field.");
  return k;
}

async function callGroq(key: string, messages: any[], temperature = 0.3, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
          throw new Error(`Invalid Groq API key. Please check your key at console.groq.com/keys`);
        }

        if (res.status === 429 || /quota|exhausted|rate_limit/i.test(msg)) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          throw new Error(`Groq rate limit reached. Wait a minute and try again.`);
        }

        throw new Error(`Groq API error (${res.status}): ${msg}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from Groq");
      return text;
    } catch (err: any) {
      if (attempt === retries || err.message.includes("Invalid Groq")) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw new Error("Failed after retries");
}

function parseJsonResponse(text: string, type: "array" | "object"): any {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
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
  transcripts: string[],
  allMediaPipeScores: Record<string, number>[],
  questions: { question: string }[],
  apiKeyOverride?: string
): Promise<Record<string, unknown>> {
  const key = getKey(apiKeyOverride);

  const questionsData = questions.map((q, i) => ({
    question: q.question,
    transcript: transcripts[i] || "(no response)",
    mediaPipeScores: allMediaPipeScores[i] || {},
  }));

  const prompt = `Analyze this complete interview performance across ${questions.length} questions.
  
  Questions & Responses:
  ${JSON.stringify(questionsData, null, 2)}
  
  Return ONLY valid JSON: {
    "vision": {"eyeContact":0,"posture":0,"expression":0,"bodyLanguage":0,"feedback":"detailed feedback"},
    "voice": {"clarity":0,"pace":0,"tone":0,"engagement":0,"feedback":"detailed feedback"},
    "content": {"relevance":0,"depth":0,"starMethod":0,"feedback":"detailed feedback"},
    "overall": 0,
    "summary": "comprehensive summary of the interview performance",
    "topStrengths": ["strength1", "strength2", "strength3"],
    "topImprovements": ["improvement1", "improvement2", "improvement3"],
    "questionBreakdown": [{"questionNumber":1,"score":0,"feedback":"brief feedback"}]
  }
  
  Score all values 0-100. Use MediaPipe scores for vision analysis. Analyze transcripts for content and voice quality. Be thorough and constructive.`;

  const text = await callGroq(key, [
    { role: "system", content: "You are an expert interview coach. Return comprehensive analysis in strict JSON format." },
    { role: "user", content: prompt }
  ], 0.3);

  return parseJsonResponse(text, "object") as Record<string, unknown>;
}

export async function chatWithReport(
  analysisData: Record<string, unknown>,
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  apiKeyOverride?: string
): Promise<string> {
  const key = getKey(apiKeyOverride);

  const messages = [
    {
      role: "system",
      content: `You are an expert interview coach. The user just completed a mock interview. Here is their performance analysis:
${JSON.stringify(analysisData, null, 2)}

Help them understand their results, give actionable tips, and answer questions about improving their interview skills. Be encouraging but honest. Keep responses concise (2-4 sentences unless more detail is asked for). Return a JSON object with a "reply" field: {"reply": "your response"}`
    },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage }
  ];

  const text = await callGroq(key, messages, 0.5);
  const parsed = parseJsonResponse(text, "object");
  return parsed.reply || parsed.response || text;
}
