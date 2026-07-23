"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

export async function compressVideo(
  file: File,
  onProgress: (pct: number) => void
): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  });

  const [coreURL, wasmURL] = await Promise.all([
    toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
    toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm"),
  ]);
  // @ffmpeg/ffmpeg's own worker.js does a fully dynamic `import(coreURL)`,
  // which Next's bundler refuses to statically analyze. Point at our own
  // copy served as a plain static file instead, so it's never bundled —
  // just loaded natively by the browser at runtime, where a dynamic
  // import is completely normal. Must be a full absolute URL: the library
  // resolves classWorkerURL against its own bundled module's import.meta.url,
  // which isn't the page origin in Next's dev bundler.
  const classWorkerURL = new URL("/ffmpeg/worker.js", window.location.origin).toString();
  await ffmpeg.load({ classWorkerURL, coreURL, wasmURL });

  const inputName = "input" + (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".mp4");
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  await ffmpeg.exec([
    "-i",
    inputName,
    // Cap resolution at 1080p — plenty for phone/laptop screens, and much
    // smaller than the untouched, often much larger, source file.
    "-vf",
    "scale='min(1920,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "26",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  ffmpeg.terminate();

  onProgress(100);
  const bytes = new Uint8Array(data as Uint8Array);
  return new Blob([bytes], { type: "video/mp4" });
}
