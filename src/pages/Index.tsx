import { FileText, Brain, Eye, Mic, ArrowRight, Upload, Sparkles, Shield, Zap, BookOpen } from "lucide-react";
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
      "Transcribe speech via Web Speech API",
      "Analyze filler word frequency (um, uh, like)",
      "Evaluate sentence structure and coherence",
      "Score pace, clarity, tone, and engagement (25-100)",
      "Generate actionable delivery feedback",
    ],
    color: "primary",
  },
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
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">HAMII</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
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
          <p>Built with Groq AI • NER-KE Algorithm v2.0 • FACS Vision Analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
