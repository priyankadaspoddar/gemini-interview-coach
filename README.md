# Gemini Interview Coach (HAMII)

An "Official" and "Intelligent" AI-powered interview coaching platform that uses real-time vision, voice, and resume analysis to prepare candidates for technical and HR interviews.

## 🚀 Core Technologies
- **AI Core**: Groq AI (Llama 3.3 70B Versatile)
- **Computer Vision**: Google MediaPipe (FaceMesh, Iris, Pose)
- **Speech Engine**: Web Speech API (Browser Native)
- **Frontend**: React + TypeScript + Tailwind CSS + Lucide Icons

---

## 🧠 Strategic Algorithms

### 1. NER-KE Algorithm v2.0 (Named Entity Recognition & Keyword Extraction)
The system uses a custom-tuned prompt engineering strategy (NER-KE) to parse resumes without hallucination.
- **Entity Extraction**: Identifies technical skills (e.g., GPT, React), job titles, and experience duration.
- **Contextual Mapping**: Questions are generated specifically from the extracted entities to ensure 100% relevance.
- **Randomization Seed**: Every generation uses a unique hash to prevent repeating questions for the same resume.

### 2. MediaPipe EMA Vision Analysis
Real-time behavioral tracking is processed through a stability layer.
- **FACS Units**: Monitors Facial Action Coding System points to detect confidence and engagement.
- **EMA Smoothing**: Applies an **Exponential Moving Average** (EMA) to raw MediaPipe scores. This prevents "jitter" in the data, ensuring the performance report reflects sustained behaviors rather than momentary glitches.
- **Eye Contact Tracking**: Analyzes iris centering and gaze direction relative to the webcam.

### 3. "Official" Intelligence Reporting
The report generation (Intelligence reporting) goes beyond simple scoring:
- **Resume Alignment Analysis**: Compares the skills present in your resume against the skills demonstrated in your spoken answers.
- **Professional Delivery Metadata**: Tracks filler words (um, uh, like), speaking pace (WPM), and confidence trends.
- **Recruiter Verdict**: Uses Llama-3's reasoning to provide a "Hire/No-Hire/Borderline" recommendation and suggests suitable industry roles (e.g., AI Research, SDE).

---

## 🛠️ Features
- **Upload Resume**: PDF and TXT parsing.
- **Resume-Based Session**: 5 focused technical questions based on your profile.
- **HR Prep Session**: 5 behavioral questions using the **STAR Methodology**.
- **Interactive AI Chat**: Ask follow-up questions about your performance analysis.
- **Export to PDF**: Download an official "Interview Performance Report."

## 🚥 Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/priyankadaspoddar/gemini-interview-coach.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add your API key:
   Create a `.env` file or paste it in the UI:
   `VITE_GROQ_API_KEY=your_key_here`
4. Run locally:
   ```bash
   npm run dev
   ```

---

## 🔒 Privacy
All video and voice analysis happens **locally in your browser**. Data is only sent to Groq AI in text format (transcripts and numerical scores) for analysis. We do not store your video recordings.
