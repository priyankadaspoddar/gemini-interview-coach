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
  emotionDuringAnswer?: string;
  bodyLanguageNote?: string;
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
  nonVerbalAnalysis?: {
    overallPresence: string;
    emotionalIntelligence: string;
    strengthPraises: string[];
    improvementTips: string[];
  };
  integrityAssessment?: {
    tabSwitches: number;
    lookAways: number;
    headTilts: number;
    suspiciousGaze: number;
    multipleFaces: number;
    phoneDetections: number;
    screenShares: number;
    copyPastes: number;
    inactivity: number;
    riskLevel: string;
    notes: string;
  };
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
  doc.text("Powered by Groq AI + MediaPipe EMA + Integrity Monitor v2.0", pw / 2, y, { align: "center" });
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
  doc.text("Interview Type: Resume + HR Mock", 15, y);
  doc.text("Precision Difficulty Scaling: AI-Driven", pw / 2, y);
  y += 6;
  doc.text(`Date & Time: ${new Date().toLocaleString()}`, 15, y);
  doc.text("Location: Remote Web Client", pw / 2, y);
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
    const summaryLines = doc.splitTextToSize(analysis.summary, pw - 30);
    checkPage(15 + summaryLines.length * 5);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 5 + 8;
  }

  // Strengths & Improvements
  const drawList = (title: string, items: string[], prefix: string) => {
    if (!items?.length) return;
    checkPage(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    items.forEach(item => {
      const lines = doc.splitTextToSize(`${prefix} ${item}`, pw - 35);
      checkPage(lines.length * 5 + 2);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 2;
    });
    y += 5;
  };

  drawList("Top Strengths", analysis.topStrengths || [], "*");
  drawList("Areas to Improve", analysis.topImprovements || [], "-");

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
      y += 5;
      doc.text(`Demonstrated: ${analysis.resumeAlignment.skillsDemonstrated?.slice(0, 8).join(", ")}...`, 20, y);
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
      doc.setFillColor(220, 220, 220);
      doc.rect(70, y - 3, 80, 4, "F");
      const r = value >= 70 ? 34 : value >= 50 ? 245 : 239;
      const g = value >= 70 ? 197 : value >= 50 ? 158 : 68;
      const b = value >= 70 ? 94 : value >= 50 ? 11 : 68;
      doc.setFillColor(r, g, b);
      doc.rect(70, y - 3, Math.max(1, value * 0.8), 4, "F");
      doc.text(`${Math.round(value)}%`, 155, y);
      y += 7;
    });
    if (feedback) {
      const fbLines = doc.splitTextToSize(feedback, pw - 40);
      checkPage(fbLines.length * 5 + 3);
      doc.setTextColor(100);
      doc.text(fbLines, 20, y);
      doc.setTextColor(0);
      y += fbLines.length * 5 + 3;
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

  // ─── Non-Verbal Communication Analysis ───
  if (analysis.nonVerbalAnalysis) {
    checkPage(50);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Non-Verbal Communication Analysis", 15, y);
    y += 9;

    if (analysis.nonVerbalAnalysis.overallPresence) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 180);
      doc.text("OVERALL PRESENCE", 20, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(analysis.nonVerbalAnalysis.overallPresence, pw - 40);
      checkPage(lines.length * 4.5 + 4);
      doc.text(lines, 22, y);
      y += lines.length * 4.5 + 4;
    }

    if (analysis.nonVerbalAnalysis.emotionalIntelligence) {
      checkPage(15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 60, 150);
      doc.text("EMOTIONAL INTELLIGENCE", 20, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(analysis.nonVerbalAnalysis.emotionalIntelligence, pw - 40);
      checkPage(lines.length * 4.5 + 4);
      doc.text(lines, 22, y);
      y += lines.length * 4.5 + 4;
    }

    if (analysis.nonVerbalAnalysis.strengthPraises?.length) {
      checkPage(15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("PRAISED", 20, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFont("helvetica", "normal");
      analysis.nonVerbalAnalysis.strengthPraises.forEach(p => {
        const lines = doc.splitTextToSize(`✓ ${p}`, pw - 45);
        checkPage(lines.length * 4.5 + 2);
        doc.text(lines, 24, y);
        y += lines.length * 4.5 + 2;
      });
      y += 3;
    }

    if (analysis.nonVerbalAnalysis.improvementTips?.length) {
      checkPage(15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 158, 11);
      doc.text("IMPROVEMENT TIPS", 20, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFont("helvetica", "normal");
      analysis.nonVerbalAnalysis.improvementTips.forEach(t => {
        const lines = doc.splitTextToSize(`→ ${t}`, pw - 45);
        checkPage(lines.length * 4.5 + 2);
        doc.text(lines, 24, y);
        y += lines.length * 4.5 + 2;
      });
      y += 3;
    }
    y += 5;
  }

  // ─── Integrity Assessment (9 Signals) ───
  if (analysis.integrityAssessment) {
    checkPage(60);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Integrity Assessment", 15, y);

    // Risk level badge
    const risk = analysis.integrityAssessment.riskLevel || "Unknown";
    const isClean = risk === "None";
    const isLow = risk === "Low";
    doc.setFontSize(10);
    if (isClean) doc.setTextColor(34, 197, 94);
    else if (isLow) doc.setTextColor(245, 158, 11);
    else doc.setTextColor(239, 68, 68);
    doc.text(isClean ? "Clean" : `${risk} Risk`, pw - 20, y, { align: "right" });
    doc.setTextColor(0);
    y += 10;

    // 9-signal grid (3 columns × 3 rows)
    const signals: [string, number][] = [
      ["Tab Switches", analysis.integrityAssessment.tabSwitches || 0],
      ["Look-Aways", analysis.integrityAssessment.lookAways || 0],
      ["Head Tilts", analysis.integrityAssessment.headTilts || 0],
      ["Suspicious Gaze", analysis.integrityAssessment.suspiciousGaze || 0],
      ["Multiple Faces", analysis.integrityAssessment.multipleFaces || 0],
      ["Phone/Device", analysis.integrityAssessment.phoneDetections || 0],
      ["Screen Share", analysis.integrityAssessment.screenShares || 0],
      ["Copy/Paste", analysis.integrityAssessment.copyPastes || 0],
      ["Inactivity", analysis.integrityAssessment.inactivity || 0],
    ];

    doc.setFontSize(9);
    const colW = (pw - 40) / 3;
    for (let row = 0; row < 3; row++) {
      checkPage(14);
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const [label, value] = signals[idx];
        const x = 18 + col * colW;

        // Background box
        if (value > 0) {
          doc.setFillColor(255, 240, 240);
        } else {
          doc.setFillColor(240, 255, 240);
        }
        doc.roundedRect(x, y, colW - 4, 12, 2, 2, "F");

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(label, x + 3, y + 5);
        doc.setFont("helvetica", "bold");
        if (value > 0) doc.setTextColor(239, 68, 68);
        else doc.setTextColor(34, 197, 94);
        doc.text(`${value}`, x + colW - 10, y + 5);
        doc.setTextColor(0);
      }
      y += 14;
    }

    if (analysis.integrityAssessment.notes) {
      checkPage(15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      const notesLines = doc.splitTextToSize(analysis.integrityAssessment.notes, pw - 40);
      doc.text(notesLines, 20, y);
      doc.setTextColor(0);
      y += notesLines.length * 4.5 + 5;
    }
    y += 5;
  }

  // ─── Algorithm & Engine Notes ───
  if (analysis.algorithmNotes) {
    checkPage(35);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis Engine Details", 15, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    if (analysis.algorithmNotes.facsUnitsDetected) {
      doc.text(`FACS Units Detected: ${analysis.algorithmNotes.facsUnitsDetected}`, 20, y);
      y += 5;
    }
    if (analysis.algorithmNotes.emaSmoothingApplied !== undefined) {
      doc.text(`EMA Smoothing: ${analysis.algorithmNotes.emaSmoothingApplied ? "Applied" : "Not Applied"}`, 20, y);
      y += 5;
    }
    if (analysis.algorithmNotes.mediaPipeConfidence) {
      doc.text(`MediaPipe Confidence: ${analysis.algorithmNotes.mediaPipeConfidence}`, 20, y);
      y += 5;
    }
    if (analysis.algorithmNotes.voicePatternType) {
      doc.text(`Voice Pattern: ${analysis.algorithmNotes.voicePatternType}`, 20, y);
      y += 5;
    }
    doc.setTextColor(0);
    y += 5;
  }

  // ─── Precision Difficulty Scaling ───
  {
    checkPage(30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Precision Difficulty Scaling", 15, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const diffCounts: Record<string, number> = {};
    questions.forEach(q => {
      diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
    });
    const diffText = Object.entries(diffCounts).map(([d, c]) => `${d}: ${c}`).join("  |  ");
    doc.text(`Question Difficulty Distribution: ${diffText}`, 20, y);
    y += 5;
    doc.text("AI dynamically calibrates question complexity based on resume analysis,", 20, y);
    y += 5;
    doc.text("targeting skill gaps and experience depth for maximum evaluation accuracy.", 20, y);
    doc.setTextColor(0);
    y += 12;
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
    doc.text("Per-question breakdown with answers, ideal answers, scores, and feedback", pw / 2, y, { align: "center" });
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

      // Emotion & body language for this question
      if (qb.emotionDuringAnswer || qb.bodyLanguageNote) {
        checkPage(12);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        if (qb.emotionDuringAnswer) {
          doc.text(`Emotion: ${qb.emotionDuringAnswer}`, 18, y);
          y += 4;
        }
        if (qb.bodyLanguageNote) {
          doc.text(`Body Language: ${qb.bodyLanguageNote}`, 18, y);
          y += 4;
        }
        doc.setTextColor(0);
        y += 2;
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

      y += 8;
    });
  }

  doc.save("HAMII-Interview-Report.pdf");
}
