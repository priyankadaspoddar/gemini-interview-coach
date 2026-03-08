import { useRef, useCallback, useState, useEffect } from "react";

export interface MediaPipeScores {
  eyeContact: number;
  posture: number;
  expression: number;
  bodyLanguage: number;
  headTilt: number;
  mouthOpenness: number;
  blinkRate: number;
  detectedEmotion: string;
  emotionConfidence: number;
  faceCount: number;
  handNearFace: boolean;
}

const DEFAULT_SCORES: MediaPipeScores = {
  eyeContact: 50,
  posture: 50,
  expression: 50,
  bodyLanguage: 50,
  headTilt: 0,
  mouthOpenness: 0,
  blinkRate: 0,
  detectedEmotion: "Neutral",
  emotionConfidence: 0,
  faceCount: 1,
  handNearFace: false,
};

const EMA_ALPHA = 0.3;

function emaSmooth(prev: number, next: number, alpha = EMA_ALPHA): number {
  return alpha * next + (1 - alpha) * prev;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// FACS-based emotion detection from blendshapes
function detectEmotionFromFACS(getShape: (name: string) => number): { emotion: string; confidence: number } {
  const smile = (getShape("mouthSmileLeft") + getShape("mouthSmileRight")) / 2;
  const frown = (getShape("mouthFrownLeft") + getShape("mouthFrownRight")) / 2;
  const browDown = (getShape("browDownLeft") + getShape("browDownRight")) / 2;
  const browUp = getShape("browInnerUp");
  const browOuterUp = (getShape("browOuterUpLeft") + getShape("browOuterUpRight")) / 2;
  const eyeWide = (getShape("eyeWideLeft") + getShape("eyeWideRight")) / 2;
  const jawOpen = getShape("jawOpen");
  const mouthPucker = getShape("mouthPucker");
  const noseSneer = (getShape("noseSneerLeft") + getShape("noseSneerRight")) / 2;
  const cheekSquint = (getShape("cheekSquintLeft") + getShape("cheekSquintRight")) / 2;
  const mouthPress = (getShape("mouthPressLeft") + getShape("mouthPressRight")) / 2;

  // Score each emotion using FACS Action Unit combinations
  const emotions: { emotion: string; score: number }[] = [
    { emotion: "Happy", score: smile * 0.5 + cheekSquint * 0.3 + browUp * 0.1 - frown * 0.2 },
    { emotion: "Sad", score: frown * 0.4 + browDown * 0.2 + browUp * 0.15 - smile * 0.3 },
    { emotion: "Surprised", score: eyeWide * 0.35 + browOuterUp * 0.3 + browUp * 0.2 + jawOpen * 0.15 },
    { emotion: "Angry", score: browDown * 0.4 + mouthPress * 0.2 + noseSneer * 0.2 - smile * 0.3 },
    { emotion: "Disgusted", score: noseSneer * 0.5 + browDown * 0.2 + mouthFrown(frown) * 0.2 - smile * 0.2 },
    { emotion: "Fearful", score: eyeWide * 0.3 + browUp * 0.3 + browOuterUp * 0.2 + mouthPress * 0.1 - smile * 0.2 },
    { emotion: "Focused", score: browDown * 0.3 + mouthPress * 0.25 + cheekSquint * 0.15 - eyeWide * 0.1 },
    { emotion: "Neutral", score: 0.15 }, // baseline
  ];

  const best = emotions.reduce((a, b) => (a.score > b.score ? a : b));
  const confidence = clamp(best.score * 100, 0, 100);

  // If confidence is too low, default to neutral
  if (confidence < 10) return { emotion: "Neutral", confidence: 15 };
  return { emotion: best.emotion, confidence };
}

function mouthFrown(v: number): number { return v; }

export function useMediaPipe(videoRef: React.RefObject<HTMLVideoElement>) {
  const scoresRef = useRef<MediaPipeScores>({ ...DEFAULT_SCORES });
  const [scores, setScores] = useState<MediaPipeScores>({ ...DEFAULT_SCORES });
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const objectDetectorRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const loadingRef = useRef(false);
  const historyRef = useRef<MediaPipeScores[]>([]);
  const objectDetectFrameRef = useRef(0);

  const loadMediaPipe = useCallback(async () => {
    if (loadedRef.current || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setLoadError(null);

    try {
      // @ts-ignore - dynamic CDN import
      const vision = await import(
        /* @vite-ignore */
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
      );

      const { FaceLandmarker, PoseLandmarker, FilesetResolver } = vision;
      const ObjectDetector = (vision as any).ObjectDetector;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 4,
        outputFaceBlendshapes: true,
      });

      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 2,
      });

      // Object detector for phone/device detection using EfficientDet-Lite0 (COCO classes include "cell phone")
      objectDetectorRef.current = await ObjectDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        scoreThreshold: 0.35,
        maxResults: 5,
      });

      loadedRef.current = true;
      console.log("MediaPipe loaded successfully");
    } catch (err) {
      console.error("MediaPipe load error:", err);
      setLoadError("Failed to load MediaPipe. Check your internet connection.");
      loadingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.paused || video.ended) return;
    const now = performance.now();

    const prev = scoresRef.current;
    let newScores = { ...prev };

    if (faceLandmarkerRef.current) {
      try {
        const faceResult = faceLandmarkerRef.current.detectForVideo(video, now);
        const faceCount = faceResult?.faceLandmarks?.length || 0;
        newScores.faceCount = faceCount;

        if (faceCount > 0) {
          const landmarks = faceResult.faceLandmarks[0];

          const noseTip = landmarks[1];
          const centerOffset = Math.abs(noseTip.x - 0.5) + Math.abs(noseTip.y - 0.5);
          const eyeContactRaw = clamp(100 - centerOffset * 200);
          newScores.eyeContact = emaSmooth(prev.eyeContact, eyeContactRaw);

          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const tiltAngle = Math.abs(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)) * (180 / Math.PI);
          newScores.headTilt = emaSmooth(prev.headTilt, tiltAngle);

          if (faceResult.faceBlendshapes?.length > 0) {
            const shapes = faceResult.faceBlendshapes[0].categories;
            const getShape = (name: string) => shapes.find((s: any) => s.categoryName === name)?.score || 0;

            const smile = getShape("mouthSmileLeft") + getShape("mouthSmileRight");
            const browUp = getShape("browInnerUp");
            const jawOpen = getShape("jawOpen");

            const expressionRaw = clamp(40 + smile * 30 + browUp * 20 - getShape("browDownLeft") * 15);
            newScores.expression = emaSmooth(prev.expression, expressionRaw);
            newScores.mouthOpenness = emaSmooth(prev.mouthOpenness, jawOpen * 100);

            const blinkL = getShape("eyeBlinkLeft");
            const blinkR = getShape("eyeBlinkRight");
            newScores.blinkRate = emaSmooth(prev.blinkRate, ((blinkL + blinkR) / 2) * 100);

            // FACS emotion detection
            const { emotion, confidence } = detectEmotionFromFACS(getShape);
            newScores.detectedEmotion = emotion;
            newScores.emotionConfidence = emaSmooth(prev.emotionConfidence, confidence);
          }
        }
      } catch (err) {
        // Silently ignore frame errors
      }
    }

    if (poseLandmarkerRef.current) {
      try {
        const poseResult = poseLandmarkerRef.current.detectForVideo(video, now + 1);

        if (poseResult?.landmarks?.length > 0) {
          const lm = poseResult.landmarks[0];
          const leftShoulder = lm[11];
          const rightShoulder = lm[12];
          const nose = lm[0];
          const leftWrist = lm[15];
          const rightWrist = lm[16];

          if (leftShoulder && rightShoulder && nose) {
            const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
            const shoulderMid = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
            const noseAboveShoulder = shoulderMid.y - nose.y;

            const postureRaw = clamp(80 - shoulderTilt * 300 + noseAboveShoulder * 50);
            newScores.posture = emaSmooth(prev.posture, postureRaw);

            const shoulderWidth = dist(leftShoulder, rightShoulder);
            const bodyLangRaw = clamp(50 + shoulderWidth * 100 - shoulderTilt * 200);
            newScores.bodyLanguage = emaSmooth(prev.bodyLanguage, bodyLangRaw);

            // Phone detection: hand raised near face/ear level (wider detection radius)
            const handNearFace = (leftWrist && dist(leftWrist, nose) < 0.35) ||
                                 (rightWrist && dist(rightWrist, nose) < 0.35);
            newScores.handNearFace = !!handNearFace;
          }
        }
      } catch (err) {
        // Silently ignore
      }
    }

    scoresRef.current = newScores;
    historyRef.current.push({ ...newScores });

    if (historyRef.current.length > 600) {
      historyRef.current = historyRef.current.slice(-600);
    }

    setScores({ ...newScores });
  }, [videoRef]);

  const start = useCallback(async () => {
    await loadMediaPipe();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalRef.current = setInterval(analyzeFrame, 333);
    setIsActive(true);
  }, [loadMediaPipe, analyzeFrame]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  const getAverageScores = useCallback((): MediaPipeScores & { emotionSummary: Record<string, number> } => {
    const h = historyRef.current;
    if (h.length === 0) return { ...DEFAULT_SCORES, emotionSummary: {} };

    const sum = h.reduce(
      (acc, s) => ({
        eyeContact: acc.eyeContact + s.eyeContact,
        posture: acc.posture + s.posture,
        expression: acc.expression + s.expression,
        bodyLanguage: acc.bodyLanguage + s.bodyLanguage,
        headTilt: acc.headTilt + s.headTilt,
        mouthOpenness: acc.mouthOpenness + s.mouthOpenness,
        blinkRate: acc.blinkRate + s.blinkRate,
      }),
      { eyeContact: 0, posture: 0, expression: 0, bodyLanguage: 0, headTilt: 0, mouthOpenness: 0, blinkRate: 0 }
    );

    // Count emotion occurrences for summary
    const emotionCounts: Record<string, number> = {};
    h.forEach(s => {
      emotionCounts[s.detectedEmotion] = (emotionCounts[s.detectedEmotion] || 0) + 1;
    });
    const emotionSummary: Record<string, number> = {};
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      emotionSummary[emotion] = Math.round((count / h.length) * 100);
    });

    // Most frequent emotion
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral";

    const len = h.length;
    return {
      eyeContact: Math.round(sum.eyeContact / len),
      posture: Math.round(sum.posture / len),
      expression: Math.round(sum.expression / len),
      bodyLanguage: Math.round(sum.bodyLanguage / len),
      headTilt: Math.round(sum.headTilt / len),
      mouthOpenness: Math.round(sum.mouthOpenness / len),
      blinkRate: Math.round(sum.blinkRate / len),
      detectedEmotion: topEmotion,
      emotionConfidence: 0,
      faceCount: 1,
      handNearFace: false,
      emotionSummary,
    };
  }, []);

  const resetHistory = useCallback(() => {
    historyRef.current = [];
    scoresRef.current = { ...DEFAULT_SCORES };
    setScores({ ...DEFAULT_SCORES });
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { scores, isActive, isLoading, loadError, start, stop, getAverageScores, resetHistory };
}
