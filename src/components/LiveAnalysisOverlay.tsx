import { Activity, Eye, PersonStanding, Smile, Hand, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveAnalysisProps {
  eyeContact: number;
  posture: number;
  expression: number;
  bodyLanguage: number;
  detectedEmotion?: string;
  emotionConfidence?: number;
}

function getScoreColor(score: number) {
  if (score >= 75) return "from-emerald-500 to-emerald-400";
  if (score >= 50) return "from-amber-500 to-yellow-400";
  return "from-red-500 to-orange-400";
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

function getScoreBg(score: number) {
  if (score >= 75) return "bg-emerald-500/10 text-emerald-400";
  if (score >= 50) return "bg-amber-500/10 text-amber-400";
  return "bg-red-500/10 text-red-400";
}

const EMOTION_EMOJI: Record<string, string> = {
  Happy: "😊",
  Sad: "😔",
  Surprised: "😮",
  Angry: "😠",
  Disgusted: "🤢",
  Fearful: "😨",
  Focused: "🧐",
  Neutral: "😐",
};

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricRow({ icon, label, value }: MetricRowProps) {
  const rounded = Math.round(value);
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground group-hover:text-primary transition-colors duration-200">
            {icon}
          </span>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200 text-[11px]">
            {label}
          </span>
        </div>
        <span className={cn(
          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full transition-all duration-300",
          getScoreBg(rounded)
        )}>
          {rounded}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
            getScoreColor(rounded)
          )}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
}

export function LiveAnalysisOverlay({ eyeContact, posture, expression, bodyLanguage, detectedEmotion = "Neutral", emotionConfidence = 0 }: LiveAnalysisProps) {
  const overall = Math.round((eyeContact + posture + expression + bodyLanguage) / 4);
  const emoji = EMOTION_EMOJI[detectedEmotion] || "😐";

  return (
    <div className="absolute top-3 right-3 w-48 bg-background/85 backdrop-blur-md rounded-xl p-3 border border-border/50 shadow-lg animate-fade-in">
      {/* Header with pulse dot */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-foreground">Live Analysis</span>
        </div>
      </div>

      {/* Emotion badge */}
      <div className="flex items-center justify-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-muted/40 border border-border/30">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[11px] text-muted-foreground">Emotion:</span>
        <span className="text-sm">{emoji}</span>
        <span className="text-[11px] font-semibold text-foreground">{detectedEmotion}</span>
      </div>

      {/* Overall score ring */}
      <div className="flex items-center justify-center mb-3">
        <div className={cn(
          "relative h-14 w-14 rounded-full flex items-center justify-center",
          "border-2 transition-colors duration-500",
          overall >= 75 ? "border-emerald-500/60" : overall >= 50 ? "border-amber-500/60" : "border-red-500/60"
        )}>
          <div className="text-center">
            <div className={cn(
              "text-lg font-bold font-mono transition-colors duration-300",
              overall >= 75 ? "text-emerald-400" : overall >= 50 ? "text-amber-400" : "text-red-400"
            )}>
              {overall}
            </div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
              {getScoreLabel(overall)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5">
        <MetricRow icon={<Eye className="h-3 w-3" />} label="Eye Contact" value={eyeContact} />
        <MetricRow icon={<PersonStanding className="h-3 w-3" />} label="Posture" value={posture} />
        <MetricRow icon={<Smile className="h-3 w-3" />} label="Expression" value={expression} />
        <MetricRow icon={<Hand className="h-3 w-3" />} label="Body Lang" value={bodyLanguage} />
      </div>
    </div>
  );
}
