import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, Loader2, ArrowLeft, Video, Mic, MicOff, Camera, CameraOff, ChevronRight, Eye, BarChart3, Activity, Brain, Target, AlertTriangle, CheckCircle2, TrendingUp, SkipForward, Download, Users } from "lucide-react";
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
    eyeContact: number;
    posture: number;
    expression: number;
    bodyLanguage: number;
    detectedEmotion?: string;
    gestureType?: string;
    postureType?: string;
    feedback?: string;
  };
  voice: {
    clarity: number;
    pace: number;
    tone: number;
    engagement: number;
    fillerWords?: number;
    hedgingPhrases?: number;
    feedback?: string;
  };
  content?: {
    relevance: number;
    depth: number;
    starMethod: number;
    feedback?: string;
  };
  overall: number;
  summary?: string;
  topStrengths?: string[];
  topImprovements?: string[];
  algorithmNotes?: {
    facsUnitsDetected?: string;
    emaSmoothingApplied?: boolean;
    mediaPipeConfidence?: string;
    voicePatternType?: string;
  };
}

type Step = "upload" | "questions" | "practice" | "hr-questions" | "hr-practice" | "results";

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const { scores: mpScores, isActive: mpActive, start: startMP, stop: stopMP, getAverageScores, resetHistory } = useMediaPipe(videoRef);

  // Determine which question set is active
  const isHrPhase = step === "hr-questions" || step === "hr-practice";
  const activeQuestions = isHrPhase ? hrQuestions : questions;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setPdfLoading(true);
      try {
        const text = await extractTextFromPdf(file);
        if (text.trim().length < 20) {
          toast({ title: "PDF Error", description: "Could not extract enough text. Try a text-based PDF.", variant: "destructive" });
        } else {
          setResumeText(text);
          toast({ title: "PDF Parsed", description: `Extracted ${text.length} characters from ${file.name}` });
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
      toast({ title: "API Key Required", description: "Please paste your Groq API key to continue. Get one free at console.groq.com/keys", variant: "destructive" });
      return;
    }
    if (resumeText.trim().length < 40) {
      toast({ title: "Resume too short", description: "Please enter more resume content.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const q = await generateQuestionsDirect(resumeText, 5, apiKeyInput || undefined) as Question[];
      if (q.length === 0) throw new Error("No questions generated");
      setQuestions(q);
      setStep("questions");
      toast({ title: "Success", description: `${q.length} resume-based questions generated` });
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

  const startCamera = async () => {
    try {
      // Enhanced camera constraints for better compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: { ideal: "user" }, // Front-facing camera for most devices
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to load metadata before starting analysis
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => resolve();
        });
      }
      
      setCameraOn(true);
      toast({ title: "Camera Ready", description: "Camera and microphone access granted" });
      
      // Start MediaPipe analysis after a short delay to ensure video is ready
      setTimeout(async () => {
        try {
          await startMP();
        } catch (err) {
          console.error("Failed to start MediaPipe analysis:", err);
          toast({ 
            title: "Analysis Warning", 
            description: "MediaPipe analysis failed to start, but camera is working", 
            variant: "destructive" 
          });
        }
      }, 1000);
    } catch (err) {
      console.error("Camera access error:", err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          toast({ 
            title: "Permission Denied", 
            description: "Please allow camera and microphone access in your browser settings", 
            variant: "destructive" 
          });
        } else if (err.name === 'NotFoundError') {
          toast({ 
            title: "Device Not Found", 
            description: "No camera or microphone detected on this device", 
            variant: "destructive" 
          });
        } else if (err.name === 'NotReadableError') {
          toast({ 
            title: "Hardware Error", 
            description: "Camera or microphone is in use by another application", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Camera Error", 
            description: `Could not access camera/microphone: ${err.message}`, 
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "Camera Error", 
          description: "Could not access camera/microphone", 
          variant: "destructive" 
        });
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    stopMP();
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        toast({ title: "Unsupported", description: "Speech recognition not supported", variant: "destructive" });
        return;
      }
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

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !cameraOn) {
      toast({ title: "Camera required", description: "Please enable your camera first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      const avgScores = getAverageScores() as unknown as Record<string, number>;
      const questionText = activeQuestions[currentQ]?.question || "";

      const data = await analyzePresentationDirect(imageData, transcript, avgScores, questionText, apiKeyInput || undefined);
      setAnalysis(data as unknown as AnalysisResult);
      setStep("results");
      stopCamera();
    } catch (err: any) {
      toast({ title: "Analysis Error", description: err?.message || "Failed to analyze", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      recognitionRef.current?.stop();
    };
  }, []);

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-semibold ${value >= 70 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-red-400"}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${value >= 70 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${value}%` }}
        />
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
                    <span className="font-semibold">Key points: </span>
                    {q.expectedKeyPoints.join(" • ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PracticeView = ({ qs, phaseLabel }: { qs: Question[]; phaseLabel: string }) => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Practice Session — {phaseLabel}</h1>
        <p className="text-muted-foreground">MediaPipe tracks you in real-time. Groq Llama-3 analyzes your performance.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 glow-border">
        <div className="mb-4">
          <span className="text-xs text-primary font-mono">{phaseLabel} — Question {currentQ + 1} of {qs.length}</span>
          <p className="text-lg font-medium mt-1">{qs[currentQ]?.question}</p>
        </div>

        <div className="relative aspect-video rounded-lg bg-secondary/50 border border-border overflow-hidden mb-4">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover"
            onCanPlay={() => {
              if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                console.log("Video stream is playing successfully");
              }
            }}
            onPlay={() => {
              if (videoRef.current) {
                console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
              }
            }}
            onError={(e) => {
              console.error("Video playback error:", e);
              toast({ 
                title: "Video Error", 
                description: "Failed to display camera feed", 
                variant: "destructive" 
              });
            }}
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Camera not active</p>
              </div>
            </div>
          )}
          {cameraOn && !mpActive && (
            <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs border border-border">
              <span className="text-muted-foreground">Camera Active</span>
            </div>
          )}
          {mpActive && (
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1.5 border border-border">
              <div className="flex items-center gap-1.5 text-primary font-mono font-semibold">
                <Activity className="h-3 w-3" /> Live Analysis
              </div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Eye Contact</span><span className="font-mono">{Math.round(mpScores.eyeContact)}%</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Posture</span><span className="font-mono">{Math.round(mpScores.posture)}%</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Expression</span><span className="font-mono">{Math.round(mpScores.expression)}%</span></div>
            </div>
          )}
        </div>

        {transcript && (
          <div className="rounded-lg bg-secondary/50 border border-border p-3 mb-4 text-sm text-muted-foreground">
            <span className="text-xs text-primary font-mono block mb-1">Transcript:</span>
            {transcript}
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
          {currentQ < qs.length - 1 && (
            <Button variant="outline" onClick={() => { setCurrentQ(prev => prev + 1); setTranscript(""); }} className="gap-2 border-border">
              <SkipForward className="h-4 w-4" />
              Skip Question
            </Button>
          )}
          <Button onClick={captureAndAnalyze} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 ml-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Analyze Performance
          </Button>
        </div>

        {qs.length > 1 && (
          <div className="flex gap-2 mt-4">
            {qs.map((_, i) => (
              <button key={i} onClick={() => { setCurrentQ(i); setTranscript(""); }} className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${i === currentQ ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center px-6 gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
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
        {/* UPLOAD STEP */}
        {step === "upload" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Upload Your Resume</h1>
              <p className="text-muted-foreground">Paste text or upload a <strong>.pdf</strong> / <strong>.txt</strong> file to generate personalized interview questions.</p>
            </div>

            {/* API Key Input — prominent */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">⚡ Groq API Key</h3>
              <input
                type="password"
                placeholder="Paste your key from https://console.groq.com/keys"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Free key — used only in your browser, never stored on any server. <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Get one here</a></p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-64 bg-secondary/50 border border-border rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer">
                  <input type="file" accept=".txt,.md,.pdf" onChange={handleFileUpload} className="hidden" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload PDF or TXT
                  </div>
                </label>
                <Button onClick={generateQuestions} disabled={loading || pdfLoading || resumeText.trim().length < 40 || !hasAIClientKey(apiKeyInput)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Generate Questions
                </Button>
              </div>
              {resumeText.length > 0 && (
                <p className="text-xs text-muted-foreground">{resumeText.length} characters extracted</p>
              )}
            </div>

            {/* Algorithm explanation */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> How It Works</h3>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div><strong className="text-foreground">Resume Round (5 Qs)</strong> — AI generates questions based ONLY on your resume skills and experience.</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <div><strong className="text-foreground">HR Round (5 Qs)</strong> — Behavioral & technical HR questions tailored to your experience level.</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div><strong className="text-foreground">AI Analysis</strong> — Vision (FACS + MediaPipe), Voice quality, and Content relevance scoring.</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <div><strong className="text-foreground">100% Client-Side</strong> — Uses Groq directly. No server dependency. Works independently.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESUME QUESTIONS STEP */}
        {step === "questions" && (
          <div>
            <QuestionList qs={questions} title="Resume-Based Questions" subtitle="Generated from your resume using NER-KE Algorithm v2.0" />
            <Button onClick={async () => { setCurrentQ(0); setTranscript(""); setIsRecording(false); recognitionRef.current?.stop(); setStep("practice"); resetHistory(); await startCamera(); }} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Video className="h-4 w-4" />
              Start Resume Practice
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* RESUME PRACTICE STEP */}
        {step === "practice" && (
          <div>
            <PracticeView qs={questions} phaseLabel="Resume Round" />
            <div className="mt-6 flex gap-3">
              <Button onClick={async () => { stopCamera(); recognitionRef.current?.stop(); setIsRecording(false); await generateHRQuestions(); }} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Finish & Start HR Round
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* HR QUESTIONS STEP */}
        {step === "hr-questions" && (
          <div>
            <QuestionList qs={hrQuestions} title="HR Interview Questions" subtitle="Behavioral & technical HR questions tailored to your profile" />
            <Button onClick={async () => { setCurrentQ(0); setTranscript(""); setIsRecording(false); recognitionRef.current?.stop(); setStep("hr-practice"); resetHistory(); await startCamera(); }} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Video className="h-4 w-4" />
              Start HR Practice
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* HR PRACTICE STEP */}
        {step === "hr-practice" && (
          <PracticeView qs={hrQuestions} phaseLabel="HR Round" />
        )}

        {/* RESULTS STEP */}
        {step === "results" && analysis && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Report</h1>
              <p className="text-muted-foreground">Comprehensive AI analysis using FACS, MediaPipe EMA, and Groq</p>
            </div>

            {/* Overall Score */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-primary animate-pulse-glow">
                <span className="text-4xl font-bold text-primary">{analysis.overall}</span>
              </div>
              <p className="text-muted-foreground mt-2">Overall Score</p>
            </div>

            {/* Summary */}
            {analysis.summary && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Summary</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.topStrengths && analysis.topStrengths.length > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-5 w-5" /> Strengths</h4>
                  <ul className="space-y-2">
                    {analysis.topStrengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.topImprovements && analysis.topImprovements.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-400"><TrendingUp className="h-5 w-5" /> Areas to Improve</h4>
                  <ul className="space-y-2">
                    {analysis.topImprovements.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Detailed Scores */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Vision Analysis</h3>
                <div className="space-y-4">
                  <ScoreBar label="Eye Contact" value={analysis.vision.eyeContact} />
                  <ScoreBar label="Posture" value={analysis.vision.posture} />
                  <ScoreBar label="Expression" value={analysis.vision.expression} />
                  <ScoreBar label="Body Language" value={analysis.vision.bodyLanguage} />
                </div>
                {analysis.vision.feedback && (
                  <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">{analysis.vision.feedback}</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Mic className="h-5 w-5 text-accent" /> Voice Analysis</h3>
                <div className="space-y-4">
                  <ScoreBar label="Clarity" value={analysis.voice.clarity} />
                  <ScoreBar label="Pace" value={analysis.voice.pace} />
                  <ScoreBar label="Tone" value={analysis.voice.tone} />
                  <ScoreBar label="Engagement" value={analysis.voice.engagement} />
                </div>
                {analysis.voice.feedback && (
                  <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">{analysis.voice.feedback}</p>
                )}
              </div>
            </div>

            {/* Content Analysis */}
            {analysis.content && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Content Analysis</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <ScoreBar label="Relevance" value={analysis.content.relevance} />
                  <ScoreBar label="Depth" value={analysis.content.depth} />
                  <ScoreBar label="STAR Method" value={analysis.content.starMethod} />
                </div>
                {analysis.content.feedback && (
                  <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-3">{analysis.content.feedback}</p>
                )}
              </div>
            )}

            {/* Algorithm Notes */}
            {analysis.algorithmNotes && (
              <div className="rounded-xl border border-border bg-secondary/30 p-5">
                <h4 className="text-xs font-mono text-primary mb-2">// Algorithm Debug Info</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                  {analysis.algorithmNotes.facsUnitsDetected && <div>FACS AUs: <span className="text-foreground">{analysis.algorithmNotes.facsUnitsDetected}</span></div>}
                  <div>EMA Smoothing: <span className="text-emerald-400">{analysis.algorithmNotes.emaSmoothingApplied ? "Yes" : "No"}</span></div>
                  {analysis.algorithmNotes.mediaPipeConfidence && <div>MediaPipe: <span className="text-foreground">{analysis.algorithmNotes.mediaPipeConfidence}</span></div>}
                  {analysis.algorithmNotes.voicePatternType && <div>Voice Pattern: <span className="text-foreground">{analysis.algorithmNotes.voicePatternType}</span></div>}
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => downloadReportPdf(analysis, [...questions, ...hrQuestions], resumeText)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Download className="h-4 w-4" />
                Download PDF Report
              </Button>
              <Button variant="outline" onClick={async () => { setCurrentQ(0); setTranscript(""); setIsRecording(false); recognitionRef.current?.stop(); setStep("practice"); setAnalysis(null); resetHistory(); await startCamera(); }} className="border-border gap-2">
                Practice Again
              </Button>
              <Button variant="outline" onClick={() => { setStep("upload"); setQuestions([]); setHrQuestions([]); setAnalysis(null); setResumeText(""); setTranscript(""); setCurrentQ(0); setIsRecording(false); recognitionRef.current?.stop(); resetHistory(); }} className="border-border gap-2">
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
