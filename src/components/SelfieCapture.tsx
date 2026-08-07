"use client";

import { useEffect, useRef, useState } from "react";

export type SelfieResult = { dataUrl: string } | null;

/**
 * Live, camera-only selfie. Shared by the signup and ban-appeal flows. No
 * gallery uploads — the photo must be snapped from the camera. Reports the
 * captured photo to the parent via onChange (or null when cleared/retaken).
 */
export default function SelfieCapture({ onChange }: { onChange: (result: SelfieResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach the stream only once the <video> is actually on screen. Setting
  // srcObject inside startCamera doesn't work: the video element isn't mounted
  // until cameraOn flips true, so the ref is still null and the preview stays
  // blank.
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

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Camera is still starting — give it a second and tap again.");
      return;
    }
    setCameraError("");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setSelfie(dataUrl);
    stopCamera();
    onChange({ dataUrl });
  }

  function retake() {
    setSelfie(null);
    onChange(null);
    startCamera();
  }

  if (selfie) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selfie} alt="selfie" className="w-full max-w-xs rounded-xl border border-border" />
        <p className="mt-1 text-xs font-semibold text-emerald-600">Photo captured ✓</p>
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
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
        >
          Take selfie
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
