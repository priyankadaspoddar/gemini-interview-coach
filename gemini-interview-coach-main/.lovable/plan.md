

## Plan: Fix Build Errors & Remove Lovable Dependency

The project has TypeScript build errors and relies on Lovable's infrastructure as a fallback. The fix involves:

### 1. Fix TypeScript errors in InterviewPage.tsx

- **Lines 150-151, 174-175**: Cast `generateQuestionsDirect` return (`unknown[]`) to `Question[]` using `as Question[]`
- **Lines 258, 285**: Cast `avgScores` / `getAverageScores()` with `as Record<string, number>` to fix `MediaPipeScores` index signature mismatch
- **Lines 259, 273, 286**: Cast analysis result with `as unknown as AnalysisResult` instead of direct cast

### 2. Remove Lovable AI dependency

The edge functions (`generate-interview-questions`, `get-interview-questions`, `analyze-presentation`) already call Google Groq directly using the `ABARA` secret — they do NOT use Lovable AI gateway. The issue is purely the build errors preventing deployment.

### 3. Request new Groq API key

You mentioned you'll provide a new Groq secret key. Once the build errors are fixed, I'll prompt you to update the `ABARA` secret with your new key so the edge functions work independently of Lovable credits.

### Technical Details

All 6 build errors are type-casting issues:
- `unknown[]` → `Question[]` (2 locations)
- `MediaPipeScores` → `Record<string, number>` (2 locations)  
- `Record<string, unknown>` → `AnalysisResult` (2 locations, needs double cast via `unknown`)

