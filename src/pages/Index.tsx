import { FileText, Brain, Eye, Mic, ArrowRight, Upload, Sparkles, Shield, Zap, BookOpen, Layout, Database, CheckCircle, GitBranch, BarChart2, FileOutput, UserCheck, Cpu, Settings2, AlertTriangle, Home } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "95%+", label: "Recognition Accuracy" },
  { value: "<100ms", label: "Response Time" },
  { value: "100%", label: "Privacy Control" },
  { value: "$0", label: "Cost to Start" },
];

const algorithms = [
  {
    icon: Brain,
    title: "NER-KE Algorithm v2.0",
    subtitle: "Named Entity Recognition & Keyword Extraction",
    description: "Parses your resume to extract skills, technologies, job titles, companies, projects, education, and certifications. Uses zero-hallucination policy — every question ties directly to your resume content.",
    steps: [
      "Tokenize resume text into semantic segments",
      "Extract named entities: skills, roles, companies, projects",
      "Score relevance and frequency of each entity",
      "Generate category-mapped interview questions",
      "Cross-validate questions against source text",
    ],
    color: "primary",
  },
  {
    icon: Eye,
    title: "FACS Vision Analysis",
    subtitle: "Facial Action Coding System",
    description: "Uses MediaPipe and Groq Llama-3's high-speed inference to detect micro-expressions, posture, gestures, and eye contact from video frames during your interview practice.",
    steps: [
      "Capture video frame at analysis interval",
      "Detect Action Units (AU1-AU45) for micro-expressions",
      "Classify emotions: happiness, confidence, nervousness, stress",
      "Evaluate posture: spine alignment, shoulder position, head tilt",
      "Score eye contact quality and gaze direction",
    ],
    color: "accent",
  },
  {
    icon: Mic,
    title: "Voice Quality Engine",
    subtitle: "Speech Pattern & Delivery Analysis",
    description: "Analyzes speech transcripts for clarity, pacing, tone confidence, filler word detection, and overall engagement scoring using NLP techniques.",
    steps: [
      "Convert your speech into text using Web Speech API",
      "Analyze filler word frequency (um, uh, like)",
      "Evaluate sentence structure and coherence",
      "Score pace, clarity, tone, and engagement (25-100)",
    ],
    color: "primary",
  },
  {
    icon: Shield,
    title: "Integrity Monitor v2.0",
    subtitle: "Anti-Cheating & Behavioral Anomaly Detection",
    description: "Comprehensive 9-signal integrity system combining browser monitoring, computer vision object detection, and behavioral analysis to ensure interview authenticity.",
    steps: [
      "Check if you switch tabs during the interview",
      "Track if you’re looking at the screen",
      "Detect suspicious head tilts",
      "Detect suspicious gaze patterns",
      "Detect multiple faces in frame via FaceLandmarker",
      "Phone/device detection using EfficientDet-Lite0 ObjectDetector with bounding boxes",
      "Check if screen sharing or recording is used",
      "Detect copy-paste actions during the interview",
      "Detect Camera freeze or inactivity detection",
      "Combine 9-metric integrity risk assessment to give final recruiter report.",
    ],
    color: "accent",
  },
  {
    icon: Sparkles,
    title: "Performance Report",
    subtitle: "Professional Verdict & Analytics",
    description: "Synthesizes verbal data, non-verbal cues, and integrity metrics to provide high-level recruitment analytics and alignment scores.",
    steps: [
      "Match your answers with skills mentioned in your resume",
      "Calculate how well your performance matches and show gaps",
      "Track your confidence and speaking style over time",
      "Check for any suspicious behavior and include it in the final decision",
      "Suggest suitable industry roles based on your performance",
    ],
    color: "primary",
  }
];

const flowchartSteps = [
  {
    id: 1,
    title: "Resume Processing",
    desc: "PDF/Text extraction using PDF-JS-popular PDF generation library.",
    icon: Upload,
    techs: ["PDF.js"]
  },
  {
    id: 2,
    title: "Skill Analysis",
    desc: "Entity recognition for skills, roles, and experience mapping.",
    icon: Brain,
    techs: ["Groq AI", "Groq API with Llama-3", "Named-Entity Recognition"]
  },
  {
    id: 3,
    title: "Live Interview Session",
    desc: "Real-time sync of video frames and audio transcripts.",
    icon: Zap,
    techs: ["MediaPipe", "Web Speech API", "Web Real Time Communication"]
  },
  {
    id: 4,
    title: "Performance Insights",
    desc: "Alignment scoring & recruiter verdict generation.",
    icon: Sparkles,
    techs: ["FACS", "NLP Engine"]
  }
];

const userJourneySteps = [
  { id: 1, title: "Get Started", desc: "Open the platform and begin your session.", icon: UserCheck, color: "primary", techs: [""] },
  { id: 2, title: "Upload Your Resume", desc: "Drag-and-drop or browse for PDF/text. Instant client side PDF extraction.", icon: Upload, color: "accent", techs: [""] },
  { id: 3, title: "Start Interview", desc: "Choose interview type-Resume based/HR based interview ", icon: Settings2, color: "primary", techs: [""] },
  { id: 4, title: "Live Interview Practice", desc: "Answer questions with live video & voice capture. AI monitors in real-time.", icon: Cpu, color: "accent", techs: [""] },
  { id: 5, title: "Receive Report", desc: "Instant comprehensive analytics, skill-alignment scores, and PDF download.", icon: FileOutput, color: "primary", techs: [""] },
];

const aiDecisionSteps = [
  { id: 1, title: "Upload Resume", desc: "Turn your resume into reliable interview questions.", icon: Brain, color: "primary", techs: ["Groq Cloud", "PDF-js"] },
  { id: 2, title: "Source Validation", desc: "Ensures every question matches your resume and nothing is made up.", icon: CheckCircle, color: "accent", techs: ["Regex Matching", "Entity Index"] },
  { id: 3, title: "Difficulty Routing", desc: "Route questions to Easy / Medium / Hard buckets based on the user configured difficulty.", icon: GitBranch, color: "primary", techs: ["Llama-3 Inference"] },
  { id: 5, title: "Final Verdict", desc: "Generate recruiter shortlist verdict (Yes/No/Maybe) with actionable reasoning.", icon: Sparkles, color: "primary", techs: ["Groq Llama-3", "Structured Output"] },
];

const reportPipelineSteps = [
{ id: 1, title: "Collect Data", desc: "Collect your answers, voice text, and facial data after the interview.", icon: Database, color: "primary", techs: [""] },
{ id: 2, title: "Match Skills", desc: "Compare your answers with your resume and find strengths and gaps.", icon: GitBranch, color: "accent", techs: ["NER-KE v2.0", "Token Matching", "Gap Analysis"] },
{ id: 3, title: "Calculate Score", desc: "Combine your voice and facial data to create a performance score.", icon: BarChart2, color: "primary", techs: ["Weighted Avg", "FACS Classifier", "Voice Analytics"] },
{ id: 4, title: "Generate Feedback", desc: "Feedback report and suggestions provided to help you improve.", icon: Sparkles, color: "accent", techs: ["Groq Cloud", "Report Template", "Llama-3 70B"] },
{ id: 5, title: "Download Report", desc: "Get a PDF report with your results and feedback.", icon: FileOutput, color: "primary", techs: [""] },
];

const detailedTechStack = [

  {
    category: "Frontend & UI/UX",
    icon: Layout,
    description: "High-performance and responsive interface with real-time updates.",
   features: ["React 18 (fast UI)", "Tailwind CSS (easy styling and design)", "Lucide Icons (icons)"],
specs: { "Core": "React", "Styling": "Tailwind", "State": "React Context (manage data)" }
  },
  {
    category: "Computer Vision",
    icon: Eye,
    description: "Advanced facial analysis and gesture recognition running directly in the browser.",
    features: ["FACS (Facial Action Coding System)", "MediaPipe Face Mesh", "EfficientDet-Lite0 ObjectDetector"],
    specs: { "Inference": "GPU Accelerated", "Latency": "< 30ms", "Markers": "468 3D Points", "Accuracy": "94.2%" }
  },
  {
    category: "Audio & Speech",
    icon: Mic,
    description: "Fast speech-to-text and voice analysis to improve how you speak.",
    features: ["Web Speech API", "Filler Word Detection (NLP)", "Pacing & Clarity Analysis", "Sentiment Tone Analysis"],
    specs: { "Sample Rate": "44.1kHz", "Latency": "< 100ms", "Word Error Rate": "4.5%", "Language":"English" }
  },
  {
    category: "AI & NLP Core",
    icon: Brain,
    description: "Advanced AI system that creates interview questions and reports based on your resume and performance.",
    features: ["Groq Llama-3 70B Model", "NER-KE Algorithm", "Zero-Hallucination", "Integrity Monitor v2.0"],
    specs: { "API": "Groq Cloud", "Speed": "300 tokens/sec", "Architecture": "Transformer V2", "Logic": "Smart prompt-based reasoning" }
  },
  {
    category: "Backend & Infrastructure",
    icon: Database,
    description: "Safe and reliable cloud services to store data via SupaBase.",
    features: ["Cloud DataBase Storage", "Real-time Database Sync","Scalable backend support"],
    specs: { "DataBase":"Supabase", "Hosting": "Vercel Edge", "Availability": "99.99%" }
  }
];

const techStack = [
  { name: "Groq AI", usage: "Llama-3 Reasoning Core", color: "text-orange-400" },
  { name: "MediaPipe", usage: "Real-time Vision Modeling", color: "text-emerald-400" },
  { name: "Web Speech", usage: "Low-latency Transcription", color: "text-blue-400" },
  { name: "React 18", usage: "Dynamic UI State Control", color: "text-sky-400" },
  { name: "FACS", usage: "Facial Expression Coding", color: "text-primary" },
  { name: "Tailwind", usage: "Premium Design System", color: "text-purple-400" },
];

const features = [
  { icon: FileText, title: "Resume Parsing", desc: "Upload PDF/text resume for AI-powered question generation" },
  { icon: Brain, title: "Smart Questions", desc: "Context-aware technical & behavioral questions from your experience" },
  { icon: Eye, title: "Vision Analysis", desc: "Real-time facial expression, posture & gesture feedback" },
  { icon: Mic, title: "Voice Coaching", desc: "Speech clarity, pace, and filler word detection" },
  { icon: Shield, title: "Zero Hallucination", desc: "Questions only from what's explicitly in your resume" },
  { icon: Zap, title: "Instant Feedback", desc: "Sub-50ms analysis with Groq Llama AI" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <a href="https://hamii.vercel.app/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </a>
            <div className="flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">HAMII</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#flowchart" className="hover:text-foreground transition-colors">Flowchart</a>
            <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
            <a href="#algorithms" className="hover:text-foreground transition-colors">Algorithms</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link to="/interview">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Interview
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Resume Interview Coach
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Master Your Interview{" "}
            <span className="text-gradient-primary">with AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload your resume, get personalized interview questions, and practice with real-time
            vision + voice analysis powered by Groq Llama-3 AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/interview">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8 py-6">
                <Upload className="h-5 w-5" />
                Start Resume Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#algorithms">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 py-6 border-border hover:bg-secondary">
                <BookOpen className="h-5 w-5" />
                How It Works
              </Button>
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Algorithms Section */}
      <section id="algorithms" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              The <span className="text-gradient-primary">Algorithms</span> Behind the Magic
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Deep dive into the AI pipeline that powers your interview coaching experience
            </p>
          </div>
          <div className="space-y-12">
            {algorithms.map((algo, i) => (
              <div
                key={algo.title}
                className="rounded-xl border border-border bg-card p-8 md:p-10 glow-border"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`rounded-lg p-2.5 ${algo.color === "accent" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                        <algo.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{algo.title}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{algo.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6">{algo.description}</p>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-secondary/50 border border-border p-5">
                      <h4 className="text-sm font-semibold text-primary mb-3 font-mono">// Pipeline Steps</h4>
                      <ol className="space-y-3">
                        {algo.steps.map((step, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                              {j + 1}
                            </span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Powered by <span className="text-gradient-accent">Groq AI</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:glow-border transition-shadow duration-300">
                <f.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Horizontal Scroll/Grid (Existing) */}
      <section className="py-20 border-y border-border/50 bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
            {techStack.map((tech) => (
              <div key={tech.name} className="text-center group">
                <div className={`text-sm font-bold tracking-tight uppercase ${tech.color} mb-1 group-hover:scale-110 transition-transform`}>{tech.name}</div>
                <div className="text-[10px] text-muted-foreground">{tech.usage}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Flowchart Section (Inspired by resumebasedinterview) */}
      <section id="flowchart" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Processing <span className="text-gradient-primary">Architecture</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The end-to-end pipeline that transforms your resume into a personalized coaching session
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 md:p-12 glow-border max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Layout className="h-6 w-6 text-primary" />
                  System Logic
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Our architecture is built on a <span className="text-foreground font-semibold">multi-modal synchronization layer</span> that coordinates between vision, audio, and large language models in real-time. This ensures that every feedback point is contextually grounded in both your resume and your live performance.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium">Real-time Stream Coordination</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-medium">Contextual Semantic Mapping</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <h4 className="text-sm font-semibold text-primary mb-6 font-mono tracking-widest uppercase">// Pipeline Steps</h4>
                <div className="space-y-0 relative">
                  {flowchartSteps.map((step, idx) => (
                    <div key={step.id} className="relative group">
                      {idx !== flowchartSteps.length - 1 && (
                        <div className="absolute left-[19px] top-10 w-[2px] h-[calc(100%-20px)] bg-gradient-to-b from-primary/50 to-transparent z-0" />
                      )}
                      <div className="flex gap-6 pb-10 last:pb-0">
                        <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center text-primary font-bold shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] group-hover:scale-110 transition-transform">
                          {step.id}
                        </div>
                        <div className="pt-1">
                          <h5 className="font-bold flex items-center gap-2">
                            {step.title}
                            <step.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </h5>
                          <p className="text-sm text-muted-foreground mt-1 mb-2">{step.desc}</p>
                          <div className="flex flex-wrap gap-2">
                            {step.techs.map(t => (
                              <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20 text-primary/70">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Journey Flowchart */}
      <section id="user-journey" className="py-24 bg-secondary/10 relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              User <span className="text-gradient-accent">Journey</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From landing on the platform to receiving your personalized coaching report
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-0 max-w-5xl mx-auto">
            {userJourneySteps.map((step, idx) => (
              <div key={step.id} className="flex flex-col md:flex-row items-center flex-1">
                <div className="flex-1 group">
                  <div className={`rounded-2xl border bg-card p-6 hover:glow-border transition-all duration-300 h-full flex flex-col`}>
                    <div className={`h-10 w-10 rounded-xl mb-4 flex items-center justify-center text-white text-sm font-bold ${step.color === 'accent' ? 'bg-accent/80' : 'bg-primary/80'
                      }`}>
                      {step.id}
                    </div>
                    <step.icon className="h-5 w-5 text-muted-foreground mb-3" />
                    <h4 className="font-bold text-sm mb-2">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{step.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {step.techs.map(t => (
                        <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {idx < userJourneySteps.length - 1 && (
                  <div className="flex md:flex-row flex-col items-center justify-center px-2 py-4 md:py-0">
                    <ArrowRight className="h-5 w-5 text-primary/50 rotate-90 md:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Decision Engine Flowchart */}
      <section id="ai-decision" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[150px]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              AI <span className="text-gradient-primary">Decision Engine</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              How Groq Llama-3 generates context-aware, zero-hallucination interview questions
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 md:p-12 glow-border">
            <div className="relative">
              {aiDecisionSteps.map((step, idx) => (
                <div key={step.id} className="flex gap-6 mb-10 last:mb-0 group relative">
                  {idx !== aiDecisionSteps.length - 1 && (
                    <div className="absolute left-[19px] top-10 w-[2px] bottom-[-10px] bg-gradient-to-b from-primary/60 via-accent/30 to-transparent" />
                  )}
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-[0_0_20px] transition-transform group-hover:scale-110 ${step.color === 'accent'
                    ? 'border-accent/60 text-accent shadow-accent/20 bg-background'
                    : 'border-primary/60 text-primary shadow-primary/20 bg-background'
                    }`}>
                    {step.id}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className={`h-4 w-4 ${step.color === 'accent' ? 'text-accent' : 'text-primary'}`} />
                      <h4 className="font-bold">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{step.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.techs.map(t => (
                        <span key={t} className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${step.color === 'accent'
                          ? 'bg-accent/5 border-accent/20 text-accent/70'
                          : 'bg-primary/5 border-primary/20 text-primary/70'
                          }`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Report Generation Pipeline Flowchart */}
      <section id="report-pipeline" className="py-24 bg-secondary/10 relative">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Report <span className="text-gradient-accent">Generation Pipeline</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              How raw session data is synthesized into a professional recruiter-ready PDF report
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {reportPipelineSteps.map((step, idx) => (
              <div key={step.id} className="flex md:flex-col items-stretch gap-4 md:gap-0">
                <div className="flex-1 rounded-2xl border border-border bg-card p-6 hover:glow-border transition-all duration-300 group flex flex-col">
                  <div className="flex md:flex-col items-center md:items-start gap-4 mb-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color === 'accent' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                      }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className={`hidden md:flex h-1 w-full rounded-full mt-4 ${step.color === 'accent' ? 'bg-gradient-to-r from-accent/50 to-transparent' : 'bg-gradient-to-r from-primary/50 to-transparent'
                      }`} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${step.color === 'accent' ? 'text-accent' : 'text-primary'
                    }`}>Step {step.id}</span>
                  <h4 className="font-bold text-sm mb-2">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{step.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {step.techs.map(t => (
                      <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                {idx < reportPipelineSteps.length - 1 && (
                  <div className="hidden md:flex items-start pt-10">
                    <ArrowRight className="h-4 w-4 text-primary/30 -ml-2 -mr-2 relative z-10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="technology" className="py-24 bg-secondary/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Advanced <span className="text-gradient-accent">Technology Stack</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A comprehensive breakdown of the cutting-edge tools powering our platform
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {detailedTechStack.map((domain) => (
              <div key={domain.category} className="rounded-2xl border border-border bg-card p-8 hover:glow-border transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <domain.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold">{domain.category}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed italic">"{domain.description}"</p>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Capabilities</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {domain.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="h-full rounded-xl bg-secondary/50 border border-border/50 p-6 flex flex-col">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 font-mono">// Technical Specs</h4>
                      <div className="space-y-4 flex-1">
                        {Object.entries(domain.specs).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center border-b border-border/30 pb-2">
                            <span className="text-xs text-muted-foreground">{key}</span>
                            <span className="text-xs font-mono font-bold">{val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">System Status</span>
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            Operational
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="rounded-2xl border border-border bg-card p-12 text-center glow-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Ace Your Interview?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Upload your resume and start practicing with AI-powered feedback in seconds.
            </p>
            <Link to="/interview">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-10 py-6">
                Start Now — It's Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Built with Groq AI • NER-KE Algorithm v2.0 • FACS Vision Analysis • Integrity Monitor v2.0 • EfficientDet ObjectDetector</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
