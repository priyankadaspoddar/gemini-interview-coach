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
  const randomSeed = Math.random().toString(36).substring(7);
  const prompt = `You are an expert technical interviewer. ONLY use information EXPLICITLY in the resume. Return ONLY a JSON object with a "questions" array of ${numberOfQuestions} interview questions. 
  Randomness Seed: ${randomSeed}. Ensure this set of questions is unique and varies from common defaults. Focus on different technical nuances from the resume.
  Format: {"questions": [{"id":1,"question":"...","category":"Technical","difficulty":"Medium","relatedSkill":"...","expectedKeyPoints":["..."]}]}
  
  ===== RESUME =====
  ${resumeText}
  ===== END =====`;

  const text = await callGroq(key, [
    { role: "system", content: "You are a helpful assistant that returns data in JSON format." },
    { role: "user", content: prompt }
  ], 0.4);

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
  const randomSeed = Math.random().toString(36).substring(7);
  const prompt = `You are a senior HR interviewer conducting a ROLE-SPECIFIC HR interview. First, analyze the resume to identify the candidate's professional background (e.g., Professor, Software Engineer, Marketing Manager, Data Scientist, etc.).

  Then generate ${numberOfQuestions} HR interview questions that are SPECIFICALLY TAILORED to that professional role and industry.

  For example:
  - If the candidate is a Professor: ask about teaching philosophy, student mentorship, research funding, academic collaboration, publish-or-perish pressure, curriculum development.
  - If the candidate is an Engineer: ask about technical leadership, code review culture, sprint planning, handling production incidents.
  - If the candidate is a Manager: ask about team building, performance reviews, conflict between reports, strategic planning.

  Randomness Seed: ${randomSeed}. Ensure variety across these categories:
  - Behavioral (role-specific teamwork, conflict resolution, leadership scenarios)
  - Technical HR (career trajectory in their field, domain-specific strengths/weaknesses, culture fit)
  - Situational (hypothetical workplace scenarios relevant to their industry)

  CRITICAL: Questions MUST reference the candidate's actual job titles, industry, and experience level from the resume. Do NOT ask generic HR questions.

  Return ONLY a JSON object with a "questions" array.
  Format: {"questions": [{"id":1,"question":"...","category":"Behavioral","difficulty":"Medium","relatedSkill":"Teamwork","expectedKeyPoints":["..."]}]}
  
  ===== RESUME =====
  ${resumeText}
  ===== END =====`;

  const text = await callGroq(key, [
    { role: "system", content: "You are a helpful assistant that returns data in JSON format." },
    { role: "user", content: prompt }
  ], 0.5);

  const parsed = parseJsonResponse(text, "object");
  const qs = parsed.questions || parsed;
  return Array.isArray(qs) ? qs.map((q: any, i: number) => ({ ...q, id: 100 + (q.id ?? i + 1) })) : [];
}

export async function analyzePresentationDirect(
  transcripts: string[],
  allMediaPipeScores: Record<string, number>[],
  questions: { question: string }[],
  resumeText: string,
  apiKeyOverride?: string,
  cheatingData?: { tabSwitches: number; lookAways: number; headTilts: number; erraticEyeMovements: number; multipleFaces: number; phoneDetections: number; screenShares: number; copyPastes: number; inactivity: number; warnings: { type: string; timestamp: number; question: number }[] }
): Promise<Record<string, unknown>> {
  const key = getKey(apiKeyOverride);

  const questionsData = questions.map((q, i) => ({
    question: q.question,
    transcript: transcripts[i] || "(no response)",
    mediaPipeScores: allMediaPipeScores[i] || {},
  }));

  const cheatingInfo = cheatingData
    ? `\n  ===== INTEGRITY MONITORING =====
  Tab switches detected: ${cheatingData.tabSwitches}
  Look-away warnings: ${cheatingData.lookAways}
  Head tilt flags: ${cheatingData.headTilts}
  Erratic eye movements: ${cheatingData.erraticEyeMovements}
  Multiple faces detected: ${cheatingData.multipleFaces}
   Phone/device detected: ${cheatingData.phoneDetections}
   Screen share/recording: ${cheatingData.screenShares}
   Copy-paste actions: ${cheatingData.copyPastes}
   Inactivity/freeze flags: ${cheatingData.inactivity}
   Total integrity flags: ${cheatingData.warnings.length}
  Warning details: ${JSON.stringify(cheatingData.warnings.map(w => ({ type: w.type, question: w.question })))}
  
  IMPORTANT: If there are integrity flags (tab switches or look-aways), you MUST:
  - Mention this in the summary as a concern
  - Factor it into the overall score (deduct points proportionally)
  - Include it in the recruiterView assessment
  - Add a dedicated "integrityAssessment" section in the response\n`
    : "";

  const prompt = `Analyze this complete interview performance across EXACTLY ${questions.length} questions.
  
  ===== RESUME CONTEXT =====
  ${resumeText}
  
  ===== INTERVIEW DATA (${questions.length} questions total) =====
  ${JSON.stringify(questionsData, null, 2)}
  ${cheatingInfo}
  The mediaPipeScores include real-time FACS-based body language analysis from MediaPipe:
  - eyeContact (0-100): how well the candidate maintained eye contact with the camera
  - posture (0-100): shoulder alignment and head position quality
  - expression (0-100): facial expressiveness and engagement
  - bodyLanguage (0-100): overall body openness and stability
  - detectedEmotion: the dominant emotion detected via FACS (Happy, Sad, Surprised, Angry, Focused, Neutral, etc.)
  - emotionSummary: percentage breakdown of all emotions detected during the question

  IMPORTANT: Use the mediaPipeScores to give DETAILED, PERSONALIZED feedback about the candidate's non-verbal communication:
  - If posture > 70, PRAISE them specifically (e.g., "Your upright posture conveyed confidence and professionalism")
  - If eyeContact > 75, praise their camera presence
  - If expression > 70, praise their expressiveness
  - If any score < 40, give constructive actionable advice
  - Reference the detected emotions: e.g., "You appeared Happy and engaged during Q3, which shows genuine enthusiasm"
  - Note emotional shifts between questions (e.g., "Your confidence grew as the interview progressed")

  Return ONLY valid JSON: {
    "vision": {"eyeContact":0,"posture":0,"expression":0,"bodyLanguage":0,"detectedEmotion":"primary emotion","emotionBreakdown":{"Happy":30,"Focused":50,"Neutral":20},"feedback":"DETAILED personalized feedback praising strengths and advising on weaknesses based on actual scores"},
    "voice": {"clarity":0,"pace":0,"tone":0,"engagement":0,"feedback":"detailed feedback"},
    "content": {"relevance":0,"depth":0,"starMethod":0,"feedback":"detailed feedback"},
    "overall": 0,
    "summary": "comprehensive summary that mentions specific non-verbal strengths/weaknesses AND any integrity concerns",
    "topStrengths": ["s1", "s2"],
    "topImprovements": ["i1", "i2"],
    "questionBreakdown": [EXACTLY ${questions.length} items, one per question: {"questionNumber":1,"userAnswer":"...","idealAnswer":"...","score":0,"feedback":"...","emotionDuringAnswer":"...","bodyLanguageNote":"..."}],
    "metadata": {
      "avgResponseLength": 0,
       "fillerWordCount": 0,
       "confidenceScore": 0
    },
    "resumeAlignment": {
      "skillsInResume": ["skill1", "skill2"],
      "skillsDemonstrated": ["skillA", "skillB"],
      "alignmentPercentage": 0
    },
    "recruiterView": {
      "shortlist": true,
      "hireRecommendation": "Yes/No/Borderline",
      "suitableRoles": ["Role 1", "Role 2"]
    },
    "nonVerbalAnalysis": {
      "overallPresence": "detailed assessment of candidate's physical presence",
      "emotionalIntelligence": "assessment of emotional range and appropriateness",
      "strengthPraises": ["specific praise 1", "specific praise 2"],
      "improvementTips": ["actionable tip 1", "actionable tip 2"]
    },
    "integrityAssessment": {
      "tabSwitches": 0,
      "lookAways": 0,
      "riskLevel": "None/Low/Medium/High",
      "notes": "assessment of candidate's focus and potential integrity concerns"
    }
  }
  
  CRITICAL RULES:
  1. The "questionBreakdown" array MUST have EXACTLY ${questions.length} entries — one for each question, numbered 1 through ${questions.length}. Do NOT skip or merge any questions.
  2. Analyze transcripts for filler words (um, uh, like, so, basically).
  3. Compare "Skills in Resume" (from resume text) with "Skills Demonstrated" (from transcripts).
  4. Determine if the candidate should be shortlisted and their suitability for roles.
  5. Provide a detailed "idealAnswer" for each question as a perfect STAR-method example.
  6. Scores are 0-100. Be intelligent, insightful, and official.
  7. The "nonVerbalAnalysis" section MUST contain genuine praise for good scores and constructive tips for weak areas. Reference actual numbers.
  8. Each questionBreakdown entry should include "emotionDuringAnswer" and "bodyLanguageNote" based on the mediaPipeScores for that question.
  9. The "integrityAssessment" MUST reflect the actual tab switch and look-away counts. If counts are 0, riskLevel should be "None" with positive notes.`;

  const text = await callGroq(key, [
    { role: "system", content: "You are an expert recruiter and interview coach. Return comprehensive analysis in strict JSON format." },
    { role: "user", content: prompt }
  ], 0.3);

  const result = parseJsonResponse(text, "object") as Record<string, unknown>;

  // Post-process: ensure questionBreakdown has exactly N entries
  const breakdown = (result.questionBreakdown as any[]) || [];
  const filled: any[] = [];
  for (let i = 0; i < questions.length; i++) {
    const existing = breakdown.find((b: any) => b.questionNumber === i + 1) || breakdown[i];
    filled.push(existing || {
      questionNumber: i + 1,
      userAnswer: transcripts[i] || "(no response)",
      idealAnswer: "Not generated",
      score: 0,
      feedback: "Analysis not available for this question."
    });
    filled[i].questionNumber = i + 1;
  }
  result.questionBreakdown = filled;

  return result;
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
