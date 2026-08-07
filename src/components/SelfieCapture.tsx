"use client";

import { useEffect, useRef, useState } from "react";

// --- Face detector (BlazeFace via CDN, works on iOS Safari too) ---
type Blazeface = {
  load: () => Promise<{ estimateFaces: (input: HTMLCanvasElement, flip?: boolean) => Promise<unknown[]> }>;
};
declare global {
  interface Window {
    tf?: unknown;
    blazeface?: Blazeface;
  }
}

type FaceModel = { estimateFaces: (i: HTMLCanvasElement, f?: boolean) => Promise<unknown[]> };

let loadedModel: FaceModel | null = null;
let inFlight: Promise<FaceModel | null> | null = null;

// Reject a promise if it doesn't settle in time, so a stalled network fetch can
// never hang the "Checking…" state forever.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === "true") return resolve();
    const s = existing ?? document.createElement("script");
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; reject(new Error("timeout")); }
    }, 8000);
    s.src = src;
    s.async = true;
    s.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(new Error("script failed"));
    };
    if (!existing) document.head.appendChild(s);
  });
}

async function attemptLoad(): Promise<FaceModel | null> {
  try {
    if (!window.tf) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
    if (!window.blazeface) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.1.0");
    if (!window.blazeface) return null;
    return (await withTimeout(window.blazeface.load(), 8000)) as FaceModel;
  } catch {
    return null;
  }
}

// Load the face model, retrying twice (spotty mobile connections often fail the
// first fetch of the ~1MB library). Every step is time-bounded, and a failure is
// NOT cached, so a later Retake gets a fresh attempt instead of being stuck.
async function getFaceModel(): Promise<FaceModel | null> {
  if (loadedModel) return loadedModel;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    for (let i = 0; i < 2; i++) {
      const model = await attemptLoad();
      if (model) {
        loadedModel = model;
        inFlight = null;
        return model;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    inFlight = null; // allow future retries
    return null;
  })();
  return inFlight;
}

export type SelfieResult = { dataUrl: string; faceOk: boolean; scannerBroken: boolean } | null;

/**
 * Live, camera-only selfie with a face-scan check. Shared by the signup and
 * ban-appeal flows. Reports every change to the parent via onChange: a captured
 * selfie (with whether a face was detected and whether the scanner even ran) or
 * null when cleared/retaken.
 */
export default function SelfieCapture({ onChange }: { onChange: (result: SelfieResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [faceOk, setFaceOk] = useState(false);
  const [scannerBroken, setScannerBroken] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Warm up the face model early (no flagging here — capture decides, after a
    // real attempt with retries, whether the scanner is genuinely unavailable).
    getFaceModel();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach the stream only once the <video> is actually on screen. Setting
  // srcObject inside startCamera doesn't work: the video element isn't mounted
  // until cameraOn flips true, so the ref is still null and the preview stays
  // blank (and a blank video has zero size, so "Take selfie" would no-op).
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setCameraError("");
    setSelfie(null);
    setFaceOk(false);
    onChange(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true); // mounts the <video>; the effect above attaches the stream
    } catch {
      setCameraError("Couldn't open the camera. Allow camera access and try again.");
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Camera is still starting — give it a second and tap again.");
      return;
    }
    setCameraError("");
    setScanning(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setScanning(false);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Face scan. Bounded so "Checking…" can never hang: if the model isn't ready
    // within a few seconds, or the scan itself stalls, we treat it as unavailable
    // rather than spinning forever.
    let ok = false;
    let broken = scannerBroken;
    let model: FaceModel | null = null;
    try {
      model = await withTimeout(getFaceModel(), 9000);
    } catch {
      model = null;
    }
    if (model) {
      try {
        const faces = await withTimeout(model.estimateFaces(canvas, false), 5000);
        ok = Array.isArray(faces) && faces.length > 0;
      } catch {
        // Scan stalled/failed — don't trap the user; defer to owner review.
        broken = true;
        setScannerBroken(true);
      }
    } else {
      broken = true;
      setScannerBroken(true);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setSelfie(dataUrl);
    setFaceOk(ok);
    setScanning(false);
    stopCamera();
    onChange({ dataUrl, faceOk: ok, scannerBroken: broken });
  }

  function retake() {
    setSelfie(null);
    setFaceOk(false);
    onChange(null);
    startCamera();
  }

  if (selfie) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selfie} alt="selfie" className="w-full max-w-xs rounded-xl border border-border" />
        <p className={`mt-1 text-xs font-semibold ${faceOk ? "text-emerald-600" : scannerBroken ? "text-foreground/50" : "text-primary"}`}>
          {faceOk
            ? "Face detected ✓"
            : scannerBroken
            ? "Couldn't auto-check your face — you can continue; the owner will verify your photo."
            : "No face detected — please retake."}
        </p>
        <button
          type="button"
          onClick={retake}
          className="mt-2 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground/70 hover:border-primary"
        >
          Retake
        </button>
      </div>
    );
  }

  if (cameraOn) {
    return (
      <div>
        <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-xs rounded-xl border border-border" />
        <button
          type="button"
          onClick={capture}
          disabled={scanning}
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {scanning ? "Checking..." : "Take selfie"}
        </button>
        {cameraError && <p className="mt-1 text-xs text-primary">{cameraError}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCamera}
        className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary"
      >
        Open camera
      </button>
      {cameraError && <p className="mt-1 text-xs text-primary">{cameraError}</p>}
    </div>
  );
}
