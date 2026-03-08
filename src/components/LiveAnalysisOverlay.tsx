import { Activity, Eye, PersonStanding, Smile, Hand, Sparkles, AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveAnalysisProps {
  eyeContact: number;
  posture: number;
  expression: number;
  bodyLanguage: number;
  detectedEmotion?: string;
  emotionConfidence?: number;
  warning?: string | null;
  tabSwitchCount?: number;
  lookAwayCount?: number;
  headTiltCount?: number;
  erraticEyeCount?: number;
  multipleFaceCount?: number;
  phoneDetectCount?: number;
  screenShareCount?: number;
  copyPasteCount?: number;
  inactivityCount?: number;
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

export function LiveAnalysisOverlay({ eyeContact, posture, expression, bodyLanguage, detectedEmotion = "Neutral", emotionConfidence = 0, warning, tabSwitchCount = 0, lookAwayCount = 0, headTiltCount = 0, erraticEyeCount = 0, multipleFaceCount = 0, phoneDetectCount = 0, screenShareCount = 0, copyPasteCount = 0, inactivityCount = 0 }: LiveAnalysisProps) {
  const overall = Math.round((eyeContact + posture + expression + bodyLanguage) / 4);
  const emoji = EMOTION_EMOJI[detectedEmotion] || "😐";
  const totalFlags = tabSwitchCount + lookAwayCount + headTiltCount + erraticEyeCount + multipleFaceCount + phoneDetectCount + screenShareCount + copyPasteCount + inactivityCount;

  return (
    <>
      {/* Warning banner — full width, above everything */}
      {warning && (
        <div className="absolute top-0 left-0 right-0 z-50 animate-fade-in p-2">
          <div className="bg-destructive text-destructive-foreground rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 shadow-2xl border border-destructive-foreground/20">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <span>{warning}</span>
          </div>
        </div>
      )}

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
          {totalFlags > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-[9px] font-bold">
              <Shield className="h-2.5 w-2.5" />
              {totalFlags}
            </div>
          )}
        </div>

        {/* Integrity monitor */}
        {totalFlags > 0 && (
          <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-[10px]">
            <div className="flex items-center gap-1 text-destructive font-semibold mb-0.5">
              <Shield className="h-2.5 w-2.5" /> Integrity Monitor
            </div>
            {tabSwitchCount > 0 && (
              <div className="text-muted-foreground">Tab switches: <span className="text-destructive font-mono">{tabSwitchCount}</span></div>
            )}
            {lookAwayCount > 0 && (
              <div className="text-muted-foreground">Look-aways: <span className="text-destructive font-mono">{lookAwayCount}</span></div>
            )}
            {headTiltCount > 0 && (
              <div className="text-muted-foreground">Head tilts: <span className="text-destructive font-mono">{headTiltCount}</span></div>
            )}
            {erraticEyeCount > 0 && (
              <div className="text-muted-foreground">Erratic eyes: <span className="text-destructive font-mono">{erraticEyeCount}</span></div>
            )}
            {multipleFaceCount > 0 && (
              <div className="text-muted-foreground">Multi-face: <span className="text-destructive font-mono">{multipleFaceCount}</span></div>
            )}
            {phoneDetectCount > 0 && (
              <div className="text-muted-foreground">Phone detected: <span className="text-destructive font-mono">{phoneDetectCount}</span></div>
            )}
            {screenShareCount > 0 && (
              <div className="text-muted-foreground">Screen share: <span className="text-destructive font-mono">{screenShareCount}</span></div>
            )}
            {copyPasteCount > 0 && (
              <div className="text-muted-foreground">Copy/paste: <span className="text-destructive font-mono">{copyPasteCount}</span></div>
            )}
            {inactivityCount > 0 && (
              <div className="text-muted-foreground">Inactivity: <span className="text-destructive font-mono">{inactivityCount}</span></div>
            )}
          </div>
        )}

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
    </>
  );
}
