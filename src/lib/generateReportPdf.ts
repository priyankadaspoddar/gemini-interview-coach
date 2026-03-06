/**
 * Generate a downloadable PDF report using jsPDF.
 */
import jsPDF from "jspdf";

interface AnalysisResult {
  vision: { eyeContact: number; posture: number; expression: number; bodyLanguage: number; feedback?: string };
  voice: { clarity: number; pace: number; tone: number; engagement: number; feedback?: string };
  content?: { relevance: number; depth: number; starMethod: number; feedback?: string };
  overall: number;
  summary?: string;
  topStrengths?: string[];
  topImprovements?: string[];
}

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  relatedSkill: string;
  expectedKeyPoints: string[];
}

function scoreLabel(v: number): string {
  if (v >= 70) return "Good";
  if (v >= 50) return "Fair";
  return "Needs Work";
}

export function downloadReportPdf(analysis: AnalysisResult, questions: Question[], resumeText: string) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkPage = (need: number) => { if (y + need > 275) addPage(); };

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("HAMII Interview Report", pw / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pw / 2, y, { align: "center" });
  y += 4;
  doc.text("Powered by Groq AI + MediaPipe EMA Analysis", pw / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  // Overall Score
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Score", pw / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(36);
  doc.text(`${Math.round(analysis.overall)}%`, pw / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(scoreLabel(analysis.overall), pw / 2, y, { align: "center" });
  y += 14;

  // Summary
  if (analysis.summary) {
    checkPage(30);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(analysis.summary, pw - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 8;
  }

  // Strengths & Improvements
  const drawList = (title: string, items: string[], prefix: string) => {
    if (!items?.length) return;
    checkPage(10 + items.length * 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    items.forEach(item => {
      checkPage(7);
      const lines = doc.splitTextToSize(`${prefix} ${item}`, pw - 35);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 2;
    });
    y += 5;
  };

  drawList("Top Strengths", analysis.topStrengths || [], "✓");
  drawList("Areas to Improve", analysis.topImprovements || [], "→");

  // Score section helper
  const drawScores = (title: string, scores: [string, number][], feedback?: string) => {
    checkPage(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    scores.forEach(([label, value]) => {
      checkPage(8);
      doc.text(label, 20, y);
      // Draw bar background
      doc.setFillColor(220, 220, 220);
      doc.rect(70, y - 3, 80, 4, "F");
      // Draw bar fill
      const r = value >= 70 ? 34 : value >= 50 ? 245 : 239;
      const g = value >= 70 ? 197 : value >= 50 ? 158 : 68;
      const b = value >= 70 ? 94 : value >= 50 ? 11 : 68;
      doc.setFillColor(r, g, b);
      doc.rect(70, y - 3, Math.max(1, value * 0.8), 4, "F");
      doc.text(`${Math.round(value)}%`, 155, y);
      y += 7;
    });
    if (feedback) {
      checkPage(10);
      doc.setTextColor(100);
      const lines = doc.splitTextToSize(feedback, pw - 40);
      doc.text(lines, 20, y);
      doc.setTextColor(0);
      y += lines.length * 5 + 3;
    }
    y += 5;
  };

  drawScores("Vision Analysis", [
    ["Eye Contact", analysis.vision.eyeContact],
    ["Posture", analysis.vision.posture],
    ["Expression", analysis.vision.expression],
    ["Body Language", analysis.vision.bodyLanguage],
  ], analysis.vision.feedback);

  drawScores("Voice Analysis", [
    ["Clarity", analysis.voice.clarity],
    ["Pace", analysis.voice.pace],
    ["Tone", analysis.voice.tone],
    ["Engagement", analysis.voice.engagement],
  ], analysis.voice.feedback);

  if (analysis.content) {
    drawScores("Content Analysis", [
      ["Relevance", analysis.content.relevance],
      ["Depth", analysis.content.depth],
      ["STAR Method", analysis.content.starMethod],
    ], analysis.content.feedback);
  }

  // Questions
  if (questions.length > 0) {
    checkPage(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Interview Questions", 15, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    questions.forEach((q, i) => {
      checkPage(14);
      const lines = doc.splitTextToSize(`${i + 1}. ${q.question}`, pw - 35);
      doc.text(lines, 18, y);
      y += lines.length * 4.5;
      doc.setTextColor(120);
      doc.text(`${q.category} · ${q.difficulty} · ${q.relatedSkill}`, 22, y);
      doc.setTextColor(0);
      y += 6;
    });
  }

  doc.save("HAMII-Interview-Report.pdf");
}
