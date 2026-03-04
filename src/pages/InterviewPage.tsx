import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, Loader2, ArrowLeft, Video, Mic, MicOff, Camera, CameraOff, ChevronRight, Eye, BarChart3, Activity, Brain, Target, AlertTriangle, CheckCircle2, TrendingUp, SkipForward, Download, Users, Send, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { useMediaPipe } from "@/hooks/useMediaPipe";
import { extractTextFromPdf } from "@/lib/pdfParser";
import {
  hasAIClientKey,
  generateQuestionsDirect,
  generateHRQuestionsDirect,
  analyzePresentationDirect,
  chatWithReport,
} from "@/lib/aiClient";
import { downloadReportPdf } from "@/lib/generateReportPdf";

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  relatedSkill: string;
  expectedKeyPoints: string[];
}

interface AnalysisResult {
  vision: {
    eyeContact: number; posture: number; expression: number; bodyLanguage: number;
    detectedEmotion?: string; gestureType?: string; postureType?: string; feedback?: string;
  };
  voice: {
    clarity: number; pace: number; tone: number; engagement: number;
    fillerWords?: number; hedgingPhrases?: number; feedback?: string;
  };
  content?: { relevance: number; depth: number; starMethod: number; feedback?: string };
  overall: number;
  summary?: string;
  topStrengths?: string[];
  topImprovements?: string[];
  algorithmNotes?: { facsUnitsDetected?: string; emaSmoothingApplied?: boolean; mediaPipeConfidence?: string; voicePatternType?: string };
  questionBreakdown?: { questionNumber: number; userAnswer: string; idealAnswer: string; score: number; feedback: string }[];
}

type Step = "upload" | "questions" | "resume-tips" | "practice" | "hr-questions" | "hr-tips" | "hr-practice" | "results";

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/20 text-emerald-400",
  Medium: "bg-amber-500/20 text-amber-400",
  Hard: "bg-red-500/20 text-red-400",
};

const InterviewPage = () => {
  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hrQuestions, setHrQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Per-question data collection
  const [questionTranscripts, setQuestionTranscripts] = useState<string[]>([]);
  const [questionScores, setQuestionScores] = useState<Record<string, number>[]>([]);

  // Interactive chat
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { scores: mpScores, isActive: mpActive, start: startMP, stop: stopMP, getAverageScores, resetHistory } = useMediaPipe(videoRef);

  const isHrPhase = step === "hr-questions" || step === "hr-practice";
  const activeQuestions = isHrPhase ? hrQuestions : questions;

  // Save current question data before moving to next
  const saveCurrentQuestionData = useCallback(() => {
    const idx = isHrPhase ? questions.length + currentQ : currentQ;
    const avgScores = getAverageScores() as unknown as Record<string, number>;
    setQuestionTranscripts(prev => {
      const copy = [...prev];
      copy[idx] = transcript;
      return copy;
    });
    setQuestionScores(prev => {
      const copy = [...prev];
      copy[idx] = { ...avgScores };
      return copy;
    });
  }, [currentQ, transcript, getAverageScores, isHrPhase, questions.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setPdfLoading(true);
      try {
        const text = await extractTextFromPdf(file);
        if (text.trim().length < 20) {
          toast({ title: "PDF Error", description: "Could not extract enough text.", variant: "destructive" });
        } else {
          setResumeText(text);
          toast({ title: "PDF Parsed", description: `Extracted ${text.length} characters` });
        }
      } catch (err: any) {
        toast({ title: "PDF Error", description: err.message || "Failed to parse PDF", variant: "destructive" });
      } finally {
        setPdfLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setResumeText(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const generateQuestions = async () => {
    if (!hasAIClientKey(apiKeyInput)) {
      toast({ title: "API Key Required", description: "Please paste your Groq API key", variant: "destructive" });
      return;
    }
    if (resumeText.trim().length < 40) {
      toast({ title: "Resume too short", description: "Please enter more content.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const q = await generateQuestionsDirect(resumeText, 5, apiKeyInput || undefined) as Question[];
      if (q.length === 0) throw new Error("No questions generated");
      setQuestions(q);
      setQuestionTranscripts([]);
      setQuestionScores([]);
      setStep("questions");
      toast({ title: "Success", description: `${q.length} resume questions generated` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateHRQuestions = async () => {
    setLoading(true);
    try {
      const q = await generateHRQuestionsDirect(resumeText, 5, apiKeyInput || undefined) as Question[];
      if (q.length === 0) throw new Error("No HR questions generated");
      setHrQuestions(q);
      setCurrentQ(0);
      setTranscript("");
      setStep("hr-questions");
      toast({ title: "HR Round", description: `${q.length} HR questions generated` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate HR questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraOn(true);
      toast({ title: "Camera Ready", description: "Camera and microphone access granted" });
    } catch (err: any) {
      const name = err?.name || "";
      const desc = name === "NotAllowedError" ? "Please allow camera access in browser settings"
        : name === "NotFoundError" ? "No camera detected"
          : name === "NotReadableError" ? "Camera in use by another app"
            : `Could not access camera: ${err?.message || "unknown"}`;
      toast({ title: "Camera Error", description: desc, variant: "destructive" });
    }
  }, [toast]);

  // Attach stream to video element when cameraOn changes
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        console.log("Video playing:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
      };
      // Start MediaPipe after video is ready
      const timer = setTimeout(() => { startMP().catch(console.error); }, 800);
      return () => clearTimeout(timer);
    }
  }, [cameraOn, startMP]);

  // Auto-start camera when entering practice steps
  useEffect(() => {
    if (step === "practice" || step === "hr-practice") {
      if (!cameraOn) startCamera();
    }
  }, [step]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    stopMP();
  }, [isRecording, stopMP]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { toast({ title: "Unsupported", description: "Speech recognition not supported", variant: "destructive" }); return; }
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
        setTranscript(t.trim());
      };
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  const goToNextQuestion = () => {
    saveCurrentQuestionData();
    if (currentQ < activeQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setTranscript("");
      resetHistory();
    }
  };

  const finishResumeRound = async () => {
    saveCurrentQuestionData();
    stopCamera();
    recognitionRef.current?.stop();
    setIsRecording(false);
    await generateHRQuestions();
  };

  const finishAllAndAnalyze = async () => {
    saveCurrentQuestionData();
    stopCamera();
    recognitionRef.current?.stop();
    setIsRecording(false);
    setLoading(true);
    try {
      const allQuestions = [...questions, ...hrQuestions];
      // Use the latest saved data plus current question
      const idx = questions.length + currentQ;
      const finalTranscripts = [...questionTranscripts];
      finalTranscripts[idx] = transcript;
      const avgScores = getAverageScores() as unknown as Record<string, number>;
      const finalScores = [...questionScores];
      finalScores[idx] = { ...avgScores };

      const data = await analyzePresentationDirect(
        finalTranscripts,
        finalScores,
        allQuestions,
        apiKeyInput || undefined
      );
      setAnalysis(data as unknown as AnalysisResult);
      setChatMessages([]);
      setStep("results");
    } catch (err: any) {
      toast({ title: "Analysis Error", description: err?.message || "Failed to analyze", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !analysis) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newHistory);
    setChatLoading(true);
    try {
      const reply = await chatWithReport(analysis as unknown as Record<string, unknown>, userMsg, chatMessages, apiKeyInput || undefined);
      setChatMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setChatMessages([...newHistory, { role: "assistant", content: `Error: ${err?.message || "Failed to get response"}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  useEffect(() => {
    return () => { stopCamera(); recognitionRef.current?.stop(); };
  }, []);

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-semibold ${value >= 70 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-red-400"}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${value >= 70 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  const QuestionList = ({ qs, title, subtitle }: { qs: Question[]; title: string; subtitle: string }) => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-4">
        {qs.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-border bg-card p-6 glow-border">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{i + 1}</span>
              <div className="flex-1 space-y-3">
                <p className="font-medium text-foreground">{q.question}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">{q.category}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors[q.difficulty] || "bg-secondary text-muted-foreground"}`}>{q.difficulty}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-secondary text-muted-foreground">{q.relatedSkill}</span>
                </div>
                {q.expectedKeyPoints?.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Key points: </span>{q.expectedKeyPoints.join(" • ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PracticeView = ({ qs, phaseLabel, onFinish, finishLabel, finishIcon }: { qs: Question[]; phaseLabel: string; onFinish: () => void; finishLabel: string; finishIcon: React.ReactNode }) => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Practice Session — {phaseLabel}</h1>
        <p className="text-muted-foreground">Answer all {qs.length} questions. Analysis runs after both rounds complete.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 glow-border">
        <div className="mb-4">
          <span className="text-xs text-primary font-mono">{phaseLabel} — Question {currentQ + 1} of {qs.length}</span>
          <p className="text-lg font-medium mt-1">{qs[currentQ]?.question}</p>
        </div>

        <div className="relative aspect-video rounded-lg bg-secondary/50 border border-border overflow-hidden mb-4">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><CameraOff className="h-12 w-12 mx-auto mb-2" /><p className="text-sm">Camera not active</p></div>
            </div>
          )}
          {mpActive && (
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1.5 border border-border">
              <div className="flex items-center gap-1.5 text-primary font-mono font-semibold"><Activity className="h-3 w-3" /> Live</div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Eye</span><span className="font-mono">{Math.round(mpScores.eyeContact)}%</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Posture</span><span className="font-mono">{Math.round(mpScores.posture)}%</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Expression</span><span className="font-mono">{Math.round(mpScores.expression)}%</span></div>
            </div>
          )}
        </div>

        {transcript && (
          <div className="rounded-lg bg-secondary/50 border border-border p-3 mb-4 text-sm text-muted-foreground">
            <span className="text-xs text-primary font-mono block mb-1">Transcript:</span>{transcript}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={cameraOn ? stopCamera : startCamera} className="gap-2 border-border">
            {cameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {cameraOn ? "Stop Camera" : "Start Camera"}
          </Button>
          <Button variant="outline" onClick={toggleRecording} className={`gap-2 border-border ${isRecording ? "text-red-400 border-red-400/50" : ""}`}>
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>

          {currentQ < qs.length - 1 ? (
            <Button variant="outline" onClick={goToNextQuestion} className="gap-2 border-border">
              <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Submit Answer & Next</span>
            </Button>
          ) : (
            <Button onClick={onFinish} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 ml-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : finishIcon}
              {finishLabel}
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex gap-2 mt-4">
          {qs.map((_, i) => (
            <button key={i} onClick={() => { saveCurrentQuestionData(); setCurrentQ(i); setTranscript(""); resetHistory(); }}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${i === currentQ ? "bg-primary text-primary-foreground" : i < currentQ ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center px-6 gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-sm font-mono text-muted-foreground">
            {step === "upload" && "Step 1: Upload Resume"}
            {step === "questions" && "Step 2: Resume Questions"}
            {step === "practice" && "Step 3: Resume Practice"}
            {step === "hr-questions" && "Step 4: HR Questions"}
            {step === "hr-practice" && "Step 5: HR Practice"}
            {step === "results" && "Performance Report"}
          </span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {/* UPLOAD */}
        {step === "upload" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Upload Your Resume</h1>
              <p className="text-muted-foreground">Paste text or upload a <strong>.pdf</strong> / <strong>.txt</strong> file.</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">⚡ Groq API Key</h3>
              <input type="password" placeholder="Paste your key from https://console.groq.com/keys" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="text-xs text-muted-foreground mt-1.5">Free key — used only in your browser. <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Get one here</a></p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume text here..."
                className="w-full h-64 bg-secondary/50 border border-border rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground" />
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer">
                  <input type="file" accept=".txt,.md,.pdf" onChange={handleFileUpload} className="hidden" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload PDF or TXT
                  </div>
                </label>
                <Button onClick={generateQuestions} disabled={loading || pdfLoading || resumeText.trim().length < 40 || !hasAIClientKey(apiKeyInput)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate Questions
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> How It Works</h3>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" /><div><strong className="text-foreground">Resume Round (5 Qs)</strong> — AI questions from your resume.</div></div>
                <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" /><div><strong className="text-foreground">HR Round (5 Qs)</strong> — Behavioral & HR questions.</div></div>
                <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" /><div><strong className="text-foreground">Analysis after all 10</strong> — Vision, Voice, Content scoring.</div></div>
                <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" /><div><strong className="text-foreground">Interactive Report</strong> — Chat with AI about your results.</div></div>
              </div>
            </div>
          </div>
        )}

        {/* RESUME QUESTIONS */}
        {step === "questions" && (
          <div>
            <QuestionList qs={questions} title="Resume-Based Questions" subtitle="Generated from your resume using NER-KE Algorithm v2.0" />
            <Button onClick={() => setStep("resume-tips")} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Next: Preparation Tips <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* RESUME TIPS */}
        {step === "resume-tips" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">10 Tips for Resume-Based Interviews</h1>
              <p className="text-muted-foreground">Review these tips before you start your practice session.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 glow-border">
              <ol className="space-y-4 text-sm text-muted-foreground list-decimal pl-5">
                <li><strong className="text-foreground">Know Your Resume Inside Out:</strong> Be prepared to discuss any detail you've included.</li>
                <li><strong className="text-foreground">Quantify Your Achievements:</strong> Use metrics and numbers to demonstrate impact whenever possible.</li>
                <li><strong className="text-foreground">Be Honest About Your Skills:</strong> If you don't know something, admit it and explain how you'd learn.</li>
                <li><strong className="text-foreground">Connect Experience to the Role:</strong> Always tie your past work to what typical employers look for.</li>
                <li><strong className="text-foreground">Keep Answers Concise:</strong> Aim for 1-2 minutes per question to keep the interviewer engaged.</li>
                <li><strong className="text-foreground">Highlight Problem-Solving:</strong> Focus on how you approached difficult technical or business problems.</li>
                <li><strong className="text-foreground">Showcase Collaboration:</strong> Mention how you worked with teams, not just your solitary contributions.</li>
                <li><strong className="text-foreground">Speak Clearly and Pace Yourself:</strong> Don't rush. Make sure your microphone captures your voice clearly.</li>
                <li><strong className="text-foreground">Maintain Eye Contact:</strong> Look at the camera (not the screen) to simulate direct eye contact.</li>
                <li><strong className="text-foreground">Submit Your Answer Audibly:</strong> Ensure you finish your thought completely before clicking submit.</li>
              </ol>
            </div>
            <Button onClick={() => { setCurrentQ(0); setTranscript(""); resetHistory(); setStep("practice"); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Video className="h-4 w-4" /> Start Resume Practice <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* RESUME PRACTICE */}
        {step === "practice" && (
          <PracticeView qs={questions} phaseLabel="Resume Round"
            onFinish={finishResumeRound}
            finishLabel="Finish & Start HR Round"
            finishIcon={<Users className="h-4 w-4" />} />
        )}

        {/* HR QUESTIONS */}
        {step === "hr-questions" && (
          <div>
            <QuestionList qs={hrQuestions} title="HR Interview Questions" subtitle="Behavioral & technical HR questions" />
            <Button onClick={() => setStep("hr-tips")} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Next: The STAR Method <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* HR TIPS */}
        {step === "hr-tips" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Master the STAR Method</h1>
              <p className="text-muted-foreground">The best framework for answering behavioral and situational questions.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="text-2xl font-bold text-primary mb-2">S</div>
                <h3 className="font-semibold text-foreground mb-1">Situation</h3>
                <p className="text-xs text-muted-foreground">Set the scene and give the necessary details of your example.</p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                <div className="text-2xl font-bold text-accent mb-2">T</div>
                <h3 className="font-semibold text-foreground mb-1">Task</h3>
                <p className="text-xs text-muted-foreground">Describe what your responsibility was in that situation.</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="text-2xl font-bold text-emerald-500 mb-2">A</div>
                <h3 className="font-semibold text-foreground mb-1">Action</h3>
                <p className="text-xs text-muted-foreground">Explain exactly what steps you took to address it.</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="text-2xl font-bold text-amber-500 mb-2">R</div>
                <h3 className="font-semibold text-foreground mb-1">Result</h3>
                <p className="text-xs text-muted-foreground">Share what outcomes your actions achieved (use metrics!).</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <strong>Tip:</strong> Spend 20% of your time on Situation/Task, 60% on Action, and 20% on Result.
              The interviewer wants to hear about what <em>you</em> specifically did.
            </div>
            <Button onClick={() => { setCurrentQ(0); setTranscript(""); resetHistory(); setStep("hr-practice"); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Video className="h-4 w-4" /> Start HR Practice <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* HR PRACTICE — analysis only after completing all 5 HR questions */}
        {step === "hr-practice" && (
          <PracticeView qs={hrQuestions} phaseLabel="HR Round"
            onFinish={finishAllAndAnalyze}
            finishLabel={loading ? "Analyzing..." : "Finish & Analyze All"}
            finishIcon={<BarChart3 className="h-4 w-4" />} />
        )}

        {/* RESULTS */}
        {step === "results" && analysis && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Report</h1>
              <p className="text-muted-foreground">Comprehensive AI analysis of all 10 questions</p>
            </div>

            {/* Overall Score */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-primary animate-pulse-glow">
                <span className="text-4xl font-bold text-primary">{analysis.overall}</span>
              </div>
              <p className="text-muted-foreground mt-2">Overall Score</p>
            </div>

            {analysis.summary && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Summary</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {analysis.topStrengths && analysis.topStrengths.length > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-5 w-5" /> Strengths</h4>
                  <ul className="space-y-2">{analysis.topStrengths.map((s, i) => (<li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> {s}</li>))}</ul>
                </div>
              )}
              {analysis.topImprovements && analysis.topImprovements.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-400"><TrendingUp className="h-5 w-5" /> Areas to Improve</h4>
                  <ul className="space-y-2">{analysis.topImprovements.map((s, i) => (<li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-amber-400 mt-0.5">→</span> {s}</li>))}</ul>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Vision Analysis</h3>
                <div className="space-y-4">
                  <ScoreBar label="Eye Contact" value={analysis.vision.eyeContact} />
                  <ScoreBar label="Posture" value={analysis.vision.posture} />
                  <ScoreBar label="Expression" value={analysis.vision.expression} />
                  <ScoreBar label="Body Language" value={analysis.vision.bodyLanguage} />
                </div>
                {analysis.vision.feedback && <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">{analysis.vision.feedback}</p>}
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Mic className="h-5 w-5 text-accent" /> Voice Analysis</h3>
                <div className="space-y-4">
                  <ScoreBar label="Clarity" value={analysis.voice.clarity} />
                  <ScoreBar label="Pace" value={analysis.voice.pace} />
                  <ScoreBar label="Tone" value={analysis.voice.tone} />
                  <ScoreBar label="Engagement" value={analysis.voice.engagement} />
                </div>
                {analysis.voice.feedback && <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">{analysis.voice.feedback}</p>}
              </div>
            </div>

            {analysis.content && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Content Analysis</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <ScoreBar label="Relevance" value={analysis.content.relevance} />
                  <ScoreBar label="Depth" value={analysis.content.depth} />
                  <ScoreBar label="STAR Method" value={analysis.content.starMethod} />
                </div>
                {analysis.content.feedback && <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-3">{analysis.content.feedback}</p>}
              </div>
            )}

            {/* Per-Question Breakdown (Ideal Answers) */}
            {analysis.questionBreakdown && analysis.questionBreakdown.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Detailed Answer Report</h3>
                {analysis.questionBreakdown.map((q, i) => {
                  const questionObj = [...questions, ...hrQuestions][i];
                  return (
                    <div key={i} className="rounded-xl border border-border bg-card p-6 group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-primary font-mono font-bold bg-primary/10 px-2.5 py-1 rounded-md">Q{q.questionNumber || i + 1} Score: {q.score}%</span>
                      </div>
                      <p className="font-medium text-foreground mb-4">{questionObj?.question}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-lg bg-secondary/30 border border-border p-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Answer Transcript</h4>
                          <p className="text-sm text-foreground italic">"{q.userAnswer || "(No audible answer detected)"}"</p>
                        </div>
                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
                          <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Ideal Answer Approach</h4>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{q.idealAnswer}</p>
                        </div>
                      </div>

                      {q.feedback && (
                        <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground flex gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{q.feedback}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Interactive Chat */}
            <div className="rounded-xl border border-primary/30 bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Ask AI About Your Results</h3>
              <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Ask anything about your interview performance, tips for improvement, or specific feedback on any area.</p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`text-sm rounded-lg p-3 ${m.role === "user" ? "bg-primary/10 text-foreground ml-8" : "bg-secondary text-muted-foreground mr-8"}`}>
                    <span className="text-xs font-mono text-primary block mb-1">{m.role === "user" ? "You" : "AI Coach"}</span>
                    {m.content}
                  </div>
                ))}
                {chatLoading && <div className="text-sm text-muted-foreground animate-pulse">AI is thinking...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="e.g. How can I improve my eye contact?"
                  className="flex-1 px-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <Button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} size="sm" className="bg-primary text-primary-foreground gap-1">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => downloadReportPdf(analysis, [...questions, ...hrQuestions], resumeText)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Download className="h-4 w-4" /> Download PDF Report
              </Button>
              <Button variant="outline" onClick={() => { setStep("upload"); setQuestions([]); setHrQuestions([]); setAnalysis(null); setResumeText(""); setTranscript(""); setCurrentQ(0); setChatMessages([]); }} className="border-border gap-2">
                New Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;
