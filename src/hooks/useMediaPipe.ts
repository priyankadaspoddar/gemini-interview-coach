import { useRef, useCallback, useState, useEffect } from "react";

interface MediaPipeScores {
  eyeContact: number;
  posture: number;
  expression: number;
  bodyLanguage: number;
  headTilt: number;
  mouthOpenness: number;
  blinkRate: number;
}

const DEFAULT_SCORES: MediaPipeScores = {
  eyeContact: 50,
  posture: 50,
  expression: 50,
  bodyLanguage: 50,
  headTilt: 0,
  mouthOpenness: 0,
  blinkRate: 0,
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

export function useMediaPipe(videoRef: React.RefObject<HTMLVideoElement>) {
  const scoresRef = useRef<MediaPipeScores>({ ...DEFAULT_SCORES });
  const [scores, setScores] = useState<MediaPipeScores>({ ...DEFAULT_SCORES });
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const loadingRef = useRef(false);
  const historyRef = useRef<MediaPipeScores[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  const loadMediaPipe = useCallback(async () => {
    // Prevent double loading
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

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });

      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
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

    // Face analysis
    if (faceLandmarkerRef.current) {
      try {
        const faceResult = faceLandmarkerRef.current.detectForVideo(video, now);

        if (faceResult?.faceLandmarks?.length > 0) {
          const landmarks = faceResult.faceLandmarks[0];

          // Eye contact: check if nose tip (1) is centered
          const noseTip = landmarks[1];
          const centerOffset = Math.abs(noseTip.x - 0.5) + Math.abs(noseTip.y - 0.5);
          const eyeContactRaw = clamp(100 - centerOffset * 200);
          newScores.eyeContact = emaSmooth(prev.eyeContact, eyeContactRaw);

          // Head tilt from landmarks
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const tiltAngle = Math.abs(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)) * (180 / Math.PI);
          newScores.headTilt = emaSmooth(prev.headTilt, tiltAngle);

          // Expression from blendshapes
          if (faceResult.faceBlendshapes?.length > 0) {
            const shapes = faceResult.faceBlendshapes[0].categories;
            const getShape = (name: string) => shapes.find((s: any) => s.categoryName === name)?.score || 0;

            const smile = getShape("mouthSmileLeft") + getShape("mouthSmileRight");
            const browUp = getShape("browInnerUp");
            const jawOpen = getShape("jawOpen");

            const expressionRaw = clamp(40 + smile * 30 + browUp * 20 - getShape("browDownLeft") * 15);
            newScores.expression = emaSmooth(prev.expression, expressionRaw);
            newScores.mouthOpenness = emaSmooth(prev.mouthOpenness, jawOpen * 100);

            // Blink detection
            const blinkL = getShape("eyeBlinkLeft");
            const blinkR = getShape("eyeBlinkRight");
            newScores.blinkRate = emaSmooth(prev.blinkRate, ((blinkL + blinkR) / 2) * 100);
          }
        }
      } catch (err) {
        // Silently ignore frame errors
      }
    }

    // Pose analysis
    if (poseLandmarkerRef.current) {
      try {
        // Use a slightly different timestamp to avoid collision with face detection
        const poseResult = poseLandmarkerRef.current.detectForVideo(video, now + 1);

        if (poseResult?.landmarks?.length > 0) {
          const lm = poseResult.landmarks[0];
          const leftShoulder = lm[11];
          const rightShoulder = lm[12];
          const nose = lm[0];

          if (leftShoulder && rightShoulder && nose) {
            // Posture: shoulder alignment + head position
            const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
            const shoulderMid = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
            const noseAboveShoulder = shoulderMid.y - nose.y;

            const postureRaw = clamp(80 - shoulderTilt * 300 + noseAboveShoulder * 50);
            newScores.posture = emaSmooth(prev.posture, postureRaw);

            // Body language: shoulder width (openness) and stability
            const shoulderWidth = dist(leftShoulder, rightShoulder);
            const bodyLangRaw = clamp(50 + shoulderWidth * 100 - shoulderTilt * 200);
            newScores.bodyLanguage = emaSmooth(prev.bodyLanguage, bodyLangRaw);
          }
        }
      } catch (err) {
        // Silently ignore
      }
    }

    scoresRef.current = newScores;
    historyRef.current.push({ ...newScores });

    // Keep last 600 frames (~60s at 10fps)
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
    // Use setInterval at 5 FPS to avoid blocking the main thread
    intervalRef.current = setInterval(analyzeFrame, 333); // ~3 FPS - gentle on GPU
    setIsActive(true);
  }, [loadMediaPipe, analyzeFrame]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  const getAverageScores = useCallback((): MediaPipeScores => {
    const h = historyRef.current;
    if (h.length === 0) return { ...DEFAULT_SCORES };

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

    const len = h.length;
    return {
      eyeContact: Math.round(sum.eyeContact / len),
      posture: Math.round(sum.posture / len),
      expression: Math.round(sum.expression / len),
      bodyLanguage: Math.round(sum.bodyLanguage / len),
      headTilt: Math.round(sum.headTilt / len),
      mouthOpenness: Math.round(sum.mouthOpenness / len),
      blinkRate: Math.round(sum.blinkRate / len),
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
