/**
 * Generate a downloadable PDF report using jsPDF.
 */
import jsPDF from "jspdf";

interface QuestionBreakdownItem {
  questionNumber?: number;
  userAnswer: string;
  idealAnswer: string;
  score: number;
  feedback: string;
}

interface AnalysisResult {
  vision: { eyeContact: number; posture: number; expression: number; bodyLanguage: number; feedback?: string };
  voice: { clarity: number; pace: number; tone: number; engagement: number; feedback?: string };
  content?: { relevance: number; depth: number; starMethod: number; feedback?: string };
  overall: number;
  summary?: string;
  topStrengths?: string[];
  topImprovements?: string[];
  metadata?: { avgResponseLength: number; fillerWordCount: number; confidenceScore: number };
  resumeAlignment?: { skillsInResume: string[]; skillsDemonstrated: string[]; alignmentPercentage: number };
  recruiterView?: { shortlist: boolean; hireRecommendation: string; suitableRoles: string[] };
  questionBreakdown?: QuestionBreakdownItem[];
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
  y += 15;

  // Candidate Profile Section
  checkPage(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Candidate Profile", 15, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Interview Type: Resume + HR Mock`, 15, y);
  doc.text(`Difficulty Level: AI Adaptive`, pw / 2, y);
  y += 6;
  doc.text(`Date & Time: ${new Date().toLocaleString()}`, 15, y);
  doc.text(`Location: Remote Web Client`, pw / 2, y);
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
  y += 12;

  // Recruiter Verdict
  if (analysis.recruiterView) {
    checkPage(30);
    doc.setFillColor(analysis.recruiterView.shortlist ? 240 : 255, analysis.recruiterView.shortlist ? 255 : 240, 240);
    doc.rect(15, y, pw - 30, 25, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recruiter Verdict", 20, y + 8);
    doc.setFontSize(16);
    doc.setTextColor(analysis.recruiterView.shortlist ? 0 : 200, analysis.recruiterView.shortlist ? 150 : 0, 0);
    doc.text(analysis.recruiterView.shortlist ? "SHORTLISTED" : "NOT SHORTLISTED", pw - 20, y + 8, { align: "right" });
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Recommendation: ${analysis.recruiterView.hireRecommendation}`, 20, y + 16);
    doc.text(`Target Roles: ${analysis.recruiterView.suitableRoles?.join(", ")}`, 20, y + 21);
    y += 32;
  }

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

  // Metadata & Alignment
  if (analysis.metadata || analysis.resumeAlignment) {
    checkPage(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Professional Intelligence Analytics", 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (analysis.metadata) {
      doc.text(`Average Response Length: ${analysis.metadata.avgResponseLength} words`, 20, y);
      doc.text(`Filler Words Detected: ${analysis.metadata.fillerWordCount}`, pw / 2, y);
      y += 6;
      doc.text(`Analysis Confidence: ${analysis.metadata.confidenceScore}%`, 20, y);
      y += 8;
    }
    if (analysis.resumeAlignment) {
      doc.setFont("helvetica", "bold");
      doc.text(`Resume Skills Alignment: ${analysis.resumeAlignment.alignmentPercentage}%`, 20, y);
      y += 6;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text(`Extracted: ${analysis.resumeAlignment.skillsInResume?.slice(0, 8).join(", ")}...`, 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    }
  }

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

  // Detailed Answer Report
  if (analysis.questionBreakdown && analysis.questionBreakdown.length > 0) {
    addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Answer Report", pw / 2, y, { align: "center" });
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text("Per-question breakdown with your answers, ideal answers, scores, and feedback", pw / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 12;

    analysis.questionBreakdown.forEach((qb, i) => {
      const questionObj = questions[i];
      const qNum = qb.questionNumber ?? i + 1;

      checkPage(60);

      // Question header box
      doc.setFillColor(240, 242, 255);
      doc.rect(15, y, pw - 30, 10, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 180);
      doc.text(`Q${qNum}`, 19, y + 7);
      doc.setTextColor(0);
      // Score badge
      const scoreColor: [number, number, number] = qb.score >= 70 ? [34, 197, 94] : qb.score >= 50 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(...scoreColor);
      doc.roundedRect(pw - 48, y + 2, 30, 6, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`Score: ${Math.round(qb.score)}%`, pw - 33, y + 6.5, { align: "center" });
      doc.setTextColor(0);
      y += 13;

      // Question text
      if (questionObj) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const qLines = doc.splitTextToSize(questionObj.question, pw - 35);
        checkPage(qLines.length * 5 + 4);
        doc.text(qLines, 18, y);
        y += qLines.length * 5 + 4;
      }

      // Your Answer
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text("YOUR ANSWER TRANSCRIPT", 18, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFont("helvetica", "italic");
      const answerText = qb.userAnswer ? `"${qb.userAnswer}"` : "(No audible answer detected)";
      const answerLines = doc.splitTextToSize(answerText, pw - 40);
      checkPage(answerLines.length * 4.5 + 4);
      doc.setFillColor(245, 245, 245);
      doc.rect(18, y - 2, pw - 36, answerLines.length * 4.5 + 4, "F");
      doc.text(answerLines, 20, y + 2);
      y += answerLines.length * 4.5 + 8;

      // Ideal Answer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(20, 120, 60);
      doc.text("IDEAL ANSWER APPROACH", 18, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFont("helvetica", "normal");
      const idealLines = doc.splitTextToSize(qb.idealAnswer || "", pw - 40);
      checkPage(idealLines.length * 4.5 + 4);
      doc.setFillColor(240, 253, 244);
      doc.rect(18, y - 2, pw - 36, idealLines.length * 4.5 + 4, "F");
      doc.text(idealLines, 20, y + 2);
      y += idealLines.length * 4.5 + 8;

      // Feedback
      if (qb.feedback) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(180, 90, 0);
        doc.text("FEEDBACK", 18, y);
        doc.setTextColor(0);
        y += 5;
        doc.setFont("helvetica", "normal");
        const fbLines = doc.splitTextToSize(qb.feedback, pw - 40);
        checkPage(fbLines.length * 4.5 + 4);
        doc.text(fbLines, 20, y);
        y += fbLines.length * 4.5 + 4;
      }

      y += 8; // gap between questions
    });
  }

  doc.save("HAMII-Interview-Report.pdf");
}
