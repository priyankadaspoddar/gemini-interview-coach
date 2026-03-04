/**
 * Generate a downloadable PDF report from interview analysis results.
 * Uses plain HTML → print-to-PDF approach (no external libs needed).
 */

interface AnalysisResult {
  vision: { eyeContact: number; posture: number; expression: number; bodyLanguage: number; feedback?: string; detectedEmotion?: string; postureType?: string };
  voice: { clarity: number; pace: number; tone: number; engagement: number; fillerWords?: number; hedgingPhrases?: number; feedback?: string };
  content?: { relevance: number; depth: number; starMethod: number; feedback?: string };
  overall: number;
  summary?: string;
  topStrengths?: string[];
  topImprovements?: string[];
  algorithmNotes?: { facsUnitsDetected?: string; emaSmoothingApplied?: boolean; mediaPipeConfidence?: string; voicePatternType?: string };
}

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  relatedSkill: string;
  expectedKeyPoints: string[];
}

function scoreColor(v: number) {
  if (v >= 70) return "#22c55e";
  if (v >= 50) return "#f59e0b";
  return "#ef4444";
}

function bar(label: string, value: number) {
  return `<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
      <span>${label}</span><span style="color:${scoreColor(value)};font-weight:600">${Math.round(value)}%</span>
    </div>
    <div style="background:#1e293b;border-radius:6px;height:8px;overflow:hidden">
      <div style="width:${value}%;height:100%;background:${scoreColor(value)};border-radius:6px"></div>
    </div>
  </div>`;
}

export function downloadReportPdf(analysis: AnalysisResult, questions: Question[], resumeText: string) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const questionsHtml = questions.map((q, i) =>
    `<div style="margin-bottom:12px;padding:10px;background:#1e293b;border-radius:8px">
      <div style="font-weight:600;margin-bottom:4px">${i + 1}. ${q.question}</div>
      <div style="font-size:12px;color:#94a3b8">${q.category} · ${q.difficulty} · ${q.relatedSkill}</div>
    </div>`
  ).join("");

  const strengthsHtml = (analysis.topStrengths || []).map(s => `<li style="margin-bottom:4px">✓ ${s}</li>`).join("");
  const improvementsHtml = (analysis.topImprovements || []).map(s => `<li style="margin-bottom:4px">→ ${s}</li>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Interview Performance Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#0f172a; color:#e2e8f0; padding:40px; font-size:14px; }
  .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #334155; padding-bottom:20px; }
  .header h1 { font-size:28px; margin-bottom:4px; }
  .header p { color:#94a3b8; }
  .overall { text-align:center; margin:24px 0; }
  .overall .score { display:inline-flex; align-items:center; justify-content:center; width:100px; height:100px; border-radius:50%; border:4px solid #6366f1; font-size:36px; font-weight:700; color:#6366f1; }
  .section { margin-bottom:24px; }
  .section h2 { font-size:18px; margin-bottom:12px; border-bottom:1px solid #334155; padding-bottom:6px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .card { background:#1e293b; border-radius:10px; padding:16px; }
  .card h3 { font-size:15px; margin-bottom:10px; }
  ul { list-style:none; padding:0; }
  .resume-preview { max-height:200px; overflow:hidden; font-size:11px; color:#64748b; white-space:pre-wrap; background:#1e293b; border-radius:8px; padding:12px; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
<div class="header">
  <h1>HAMII Interview Report</h1>
  <p>${date} · Powered by NER-KE v2.0 + MediaPipe EMA + Groq AI</p>
</div>

<div class="overall">
  <div class="score">${analysis.overall}</div>
  <p style="color:#94a3b8;margin-top:8px">Overall Score</p>
</div>

${analysis.summary ? `<div class="section"><h2>Summary</h2><p style="color:#cbd5e1;line-height:1.6">${analysis.summary}</p></div>` : ""}

<div class="section grid2">
  ${strengthsHtml ? `<div class="card" style="border:1px solid #22c55e33"><h3 style="color:#22c55e">Strengths</h3><ul>${strengthsHtml}</ul></div>` : ""}
  ${improvementsHtml ? `<div class="card" style="border:1px solid #f59e0b33"><h3 style="color:#f59e0b">Areas to Improve</h3><ul>${improvementsHtml}</ul></div>` : ""}
</div>

<div class="section grid2">
  <div class="card"><h3>👁 Vision Analysis</h3>
    ${bar("Eye Contact", analysis.vision.eyeContact)}
    ${bar("Posture", analysis.vision.posture)}
    ${bar("Expression", analysis.vision.expression)}
    ${bar("Body Language", analysis.vision.bodyLanguage)}
    ${analysis.vision.feedback ? `<p style="font-size:12px;color:#94a3b8;margin-top:8px">${analysis.vision.feedback}</p>` : ""}
  </div>
  <div class="card"><h3>🎤 Voice Analysis</h3>
    ${bar("Clarity", analysis.voice.clarity)}
    ${bar("Pace", analysis.voice.pace)}
    ${bar("Tone", analysis.voice.tone)}
    ${bar("Engagement", analysis.voice.engagement)}
    ${analysis.voice.feedback ? `<p style="font-size:12px;color:#94a3b8;margin-top:8px">${analysis.voice.feedback}</p>` : ""}
  </div>
</div>

${analysis.content ? `<div class="section"><div class="card"><h3>🧠 Content Analysis</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
    ${bar("Relevance", analysis.content.relevance)}
    ${bar("Depth", analysis.content.depth)}
    ${bar("STAR Method", analysis.content.starMethod)}
  </div>
  ${analysis.content.feedback ? `<p style="font-size:12px;color:#94a3b8;margin-top:8px">${analysis.content.feedback}</p>` : ""}
</div></div>` : ""}

<div class="section"><h2>Interview Questions</h2>${questionsHtml}</div>

<div class="section"><h2>Resume Preview</h2><div class="resume-preview">${resumeText.slice(0, 1500).replace(/</g, "&lt;")}</div></div>

</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    // Fallback: download as HTML
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-report.html";
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
