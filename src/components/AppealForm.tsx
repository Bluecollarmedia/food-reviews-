"use client";

import { useEffect, useRef, useState } from "react";

const WHATSAPP_NUMBER = "18482264055";

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

let modelPromise: Promise<{ estimateFaces: (i: HTMLCanvasElement, f?: boolean) => Promise<unknown[]> } | null> | null =
  null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script failed"));
    document.head.appendChild(s);
  });
}

async function getFaceModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        if (!window.tf) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
        if (!window.blazeface) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.1.0");
        if (!window.blazeface) return null;
        return await window.blazeface.load();
      } catch {
        return null;
      }
    })();
  }
  return modelPromise;
}

export default function AppealForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [faceOk, setFaceOk] = useState(false);
  const [scannerBroken, setScannerBroken] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Warm up the face model early.
    getFaceModel().then((m) => { if (!m) setScannerBroken(true); });
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setCameraError("");
    setSelfie(null);
    setFaceOk(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
    } catch {
      setCameraError("Couldn't open the camera. Allow camera access and try again.");
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setScanning(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Face scan.
    let ok = false;
    const model = await getFaceModel();
    if (model) {
      try {
        const faces = await model.estimateFaces(canvas, false);
        ok = Array.isArray(faces) && faces.length > 0;
      } catch {
        ok = false;
      }
    } else {
      setScannerBroken(true);
    }

    setSelfie(canvas.toDataURL("image/jpeg", 0.8));
    setFaceOk(ok);
    setScanning(false);
    stopCamera();
  }

  function retake() {
    setSelfie(null);
    setFaceOk(false);
    startCamera();
  }

  async function ownIp(): Promise<string | undefined> {
    try {
      const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      if (r.ok) return (await r.json())?.ip;
    } catch {}
  }

  const canSubmit = !!name.trim() && !!selfie && (faceOk || scannerBroken) && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    let deviceId = "";
    try { deviceId = localStorage.getItem("dsfr_vid") ?? ""; } catch {}
    const ip = await ownIp();

    const res = await fetch("/api/appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, message, selfie, deviceId, ip, faceVerified: faceOk }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't send. Try again.");
      return;
    }
    setSent(true);
  }

  const whatsappText = encodeURIComponent(
    `Hi, I'm appealing my ban on D&S Food Reviews.\nName: ${name}\n${message}`.trim()
  );
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-lg font-semibold text-foreground">Appeal sent ✓</p>
        <p className="mt-1 text-sm text-foreground/60">
          The owner got it. Want to give them a nudge?
        </p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Message on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-left">
      <p className="text-base font-semibold text-foreground">Request an appeal</p>
      <p className="mt-0.5 text-xs text-foreground/50">
        Fill this in and snap a quick selfie so the owner knows it&apos;s really you.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground/70">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground/70">
            How can they reach you? (phone / WhatsApp / email)
          </label>
          <input value={contact} onChange={(e) => setContact(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground/70">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Why do you think this was a mistake?"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Selfie */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground/70">
            Live selfie (required — camera only)
          </label>

          {selfie ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfie} alt="selfie" className="w-full max-w-xs rounded-xl border border-border" />
              <p className={`mt-1 text-xs font-semibold ${faceOk ? "text-emerald-600" : scannerBroken ? "text-foreground/50" : "text-primary"}`}>
                {faceOk ? "Face detected ✓" : scannerBroken ? "Couldn't run the face check — you can still send." : "No face detected — please retake."}
              </p>
              <button
                type="button"
                onClick={retake}
                className="mt-2 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground/70 hover:border-primary"
              >
                Retake
              </button>
            </div>
          ) : cameraOn ? (
            <div>
              <video ref={videoRef} playsInline muted className="w-full max-w-xs rounded-xl border border-border" />
              <button
                type="button"
                onClick={capture}
                disabled={scanning}
                className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {scanning ? "Checking..." : "Take selfie"}
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {error && <p className="text-xs text-primary">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-1 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send appeal"}
        </button>
      </div>
    </div>
  );
}
