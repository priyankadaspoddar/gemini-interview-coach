# AI Interview Coach (Groq-Powered)

An intelligent interview preparation platform that uses MediaPipe for real-time vision tracking and Groq (Llama-3) for high-speed speech and behavioral analysis.

## Features

- **Resume-Based Questions:** Upload your resume to generate 5 tailored technical questions based on your specific experience.
- **HR Round:** Practice common behavioral questions tailored to your profile.
- **Real-time Performance Metrics:**
  - **Vision:** Tracks eye contact, posture, and facial expressions via MediaPipe.
  - **Voice:** Analyzes transcript for clarity, pace, and engagement.
  - **Content:** Detailed feedback on your answer relevance and use of the STAR method.
- **Instant Analysis:** Sub-50ms inference thanks to the Groq Llama-3-70B model.
- **100% Privacy:** Analysis happens 100% client-side in your browser. Your data is never stored on a server.

## Getting Started

### Prerequisites

- Node.js & npm installed.
- A free Groq API Key from [console.groq.com](https://console.groq.com/keys).

### Local Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/priyankadaspoddar/Groq-interview-coach.git
   cd Groq-interview-coach
   ```

2. **Install dependencies:**
   ```sh
   npm i
   ```

3. **Configure Environment:**
   Create a `.env` file based on `.env.example` and add your `VITE_GROQ_API_KEY`.

4. **Start Development Server:**
   ```sh
   npm run dev
   ```

## Technologies Used

- **AI Model:** Groq (Llama-3-70B-Versatile)
- **Vision:** MediaPipe (FACS Analysis)
- **Frontend:** React, Vite, TypeScript
- **Styling:** shadcn-ui, Tailwind CSS

## Deployment

Pushed changes to `main` are automatically deployed to Vercel.

---
*Built for fast, private, and effective interview coaching.*
