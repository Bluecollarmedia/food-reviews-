"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, cities, reviewers, prices, type Review } from "@/lib/data";
import ImageCropper from "../ImageCropper";

type Props = {
  mode: "create" | "edit";
  initial?: Review;
};

function UploadDropzone({
  accept,
  icon,
  title,
  subtitle,
  onPicked,
}: {
  accept: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPicked: (file: File | undefined) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-sm font-bold text-foreground">{title}</span>
      <span className="text-xs text-foreground/50">{subtitle}</span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onPicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

const uploadIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
    <path d="M12 16V4m0 0L7 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function MediaUploadFields({
  label,
  thumbnailKey,
  thumbnailPreviewUrl,
  thumbnailProgress,
  onThumbnailPicked,
  videoKey,
  videoFile,
  videoProgress,
  onVideoPicked,
}: {
  label?: string;
  thumbnailKey?: string;
  thumbnailPreviewUrl: string | null;
  thumbnailProgress: number | null;
  onThumbnailPicked: (file: File | undefined) => void;
  videoKey?: string;
  videoFile: File | null;
  videoProgress: number | null;
  onVideoPicked: (file: File | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-base font-bold text-foreground">
          {label ? `Upload ${label}'s video` : "Upload the video"}
        </p>
        <UploadDropzone
          accept="video/*"
          icon={uploadIcon}
          title={
            videoKey || videoFile
              ? `Tap here to replace ${label ? `${label}'s` : "the"} video`
              : `Tap here to upload ${label ? `${label}'s` : "the"} video`
          }
          subtitle={
            videoFile
              ? `Selected: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(1)} MB)`
              : videoKey
              ? "A video is already uploaded ✓"
              : "The review video file from your phone or computer"
          }
          onPicked={onVideoPicked}
        />
        {videoProgress !== null && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Uploading...</span>
              <span>{videoProgress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border border-border bg-surface-muted">
              <div
                className="h-full bg-primary transition-[width] duration-150 ease-out"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 text-base font-bold text-foreground">
          {label ? `Upload ${label}'s thumbnail` : "Upload a thumbnail"}
        </p>
        {thumbnailPreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailPreviewUrl}
            alt="Thumbnail preview"
            className="mb-2 aspect-video w-full rounded-lg border border-border object-cover"
          />
        )}
        <UploadDropzone
          accept="image/*"
          icon={uploadIcon}
          title={
            thumbnailKey || thumbnailPreviewUrl
              ? `Tap here to replace ${label ? `${label}'s` : "the"} thumbnail`
              : `Tap here to upload ${label ? `${label}'s` : "a"} thumbnail image`
          }
          subtitle={
            thumbnailKey && !thumbnailPreviewUrl
              ? "A thumbnail is already uploaded ✓"
              : "JPG or PNG photo of the food"
          }
          onPicked={onThumbnailPicked}
        />
        {thumbnailProgress !== null && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Uploading...</span>
              <span>{thumbnailProgress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border border-border bg-surface-muted">
              <div
                className="h-full bg-accent transition-[width] duration-150 ease-out"
                style={{ width: `${thumbnailProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function uploadFile(
  file: File | Blob,
  filename: string,
  folder: "videos" | "thumbnails",
  onProgress: (pct: number) => void
): Promise<string> {
  return fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType: file.type, folder }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Could not get upload URL");
      return res.json();
    })
    .then(({ uploadUrl, key }) => {
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(key);
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });
    });
}

export default function ReviewForm({ mode, initial }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [store, setStore] = useState(initial?.store ?? "");
  const [city, setCity] = useState(initial?.city ?? cities[0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial?.categories ?? []
  );
  const [rating, setRating] = useState(initial?.rating?.toString() ?? "8");
  const [price, setPrice] = useState<string>(initial?.price ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [reviewer, setReviewer] = useState(initial?.reviewer ?? reviewers[0]);
  const [isGuestReviewer, setIsGuestReviewer] = useState(
    initial ? !reviewers.includes(initial.reviewer) : false
  );
  const [guestName, setGuestName] = useState(
    initial && !reviewers.includes(initial.reviewer) ? initial.reviewer : ""
  );
  const [status, setStatus] = useState<"published" | "draft" | "locked" | "vault">(
    initial?.status ?? "draft"
  );
  const [videoKey, setVideoKey] = useState<string | undefined>(initial?.videoKey);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const [thumbnailKey, setThumbnailKey] = useState<string | undefined>(
    initial?.thumbnailKey
  );
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [thumbnailProgress, setThumbnailProgress] = useState<number | null>(null);

  const [hasSecondReviewer, setHasSecondReviewer] = useState(!!initial?.secondReviewer);
  const [secondReviewer, setSecondReviewer] = useState(initial?.secondReviewer ?? "");
  const [isSecondGuestReviewer, setIsSecondGuestReviewer] = useState(
    initial?.secondReviewer ? !reviewers.includes(initial.secondReviewer) : false
  );
  const [secondGuestName, setSecondGuestName] = useState(
    initial?.secondReviewer && !reviewers.includes(initial.secondReviewer)
      ? initial.secondReviewer
      : ""
  );
  const [secondReviewerRating, setSecondReviewerRating] = useState(
    initial?.secondReviewerRating?.toString() ?? ""
  );

  const [secondReviewerVideoKey, setSecondReviewerVideoKey] = useState<string | undefined>(
    initial?.secondReviewerVideoKey
  );
  const [secondReviewerVideoFile, setSecondReviewerVideoFile] = useState<File | null>(null);
  const [secondReviewerVideoProgress, setSecondReviewerVideoProgress] = useState<
    number | null
  >(null);

  const [secondReviewerThumbnailKey, setSecondReviewerThumbnailKey] = useState<
    string | undefined
  >(initial?.secondReviewerThumbnailKey);
  const [secondReviewerCropperFile, setSecondReviewerCropperFile] = useState<File | null>(
    null
  );
  const [secondReviewerThumbnailBlob, setSecondReviewerThumbnailBlob] =
    useState<Blob | null>(null);
  const [secondReviewerThumbnailPreviewUrl, setSecondReviewerThumbnailPreviewUrl] =
    useState<string | null>(null);
  const [secondReviewerThumbnailProgress, setSecondReviewerThumbnailProgress] = useState<
    number | null
  >(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleThumbnailPicked(file: File | undefined) {
    if (!file) return;
    setCropperFile(file);
  }

  function handleCropConfirm(blob: Blob) {
    setThumbnailBlob(blob);
    setThumbnailPreviewUrl(URL.createObjectURL(blob));
    setCropperFile(null);
  }

  function handleSecondReviewerThumbnailPicked(file: File | undefined) {
    if (!file) return;
    setSecondReviewerCropperFile(file);
  }

  function handleSecondReviewerCropConfirm(blob: Blob) {
    setSecondReviewerThumbnailBlob(blob);
    setSecondReviewerThumbnailPreviewUrl(URL.createObjectURL(blob));
    setSecondReviewerCropperFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      setError("Pick at least one category.");
      return;
    }
    if (isGuestReviewer && !guestName.trim()) {
      setError("Enter the guest reviewer's name.");
      return;
    }
    if (hasSecondReviewer && isSecondGuestReviewer && !secondGuestName.trim()) {
      setError("Enter the second reviewer's name.");
      return;
    }
    if (hasSecondReviewer && !secondReviewer.trim()) {
      setError("Pick who the second reviewer is.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      let finalThumbnailKey = thumbnailKey;
      if (thumbnailBlob) {
        setThumbnailProgress(0);
        finalThumbnailKey = await uploadFile(
          thumbnailBlob,
          "thumbnail.webp",
          "thumbnails",
          setThumbnailProgress
        );
        setThumbnailProgress(null);
      }

      let finalVideoKey = videoKey;
      if (videoFile) {
        setVideoProgress(0);
        finalVideoKey = await uploadFile(
          videoFile,
          videoFile.name,
          "videos",
          setVideoProgress
        );
        setVideoProgress(null);
      }

      let finalSecondReviewerThumbnailKey = secondReviewerThumbnailKey;
      if (hasSecondReviewer && secondReviewerThumbnailBlob) {
        setSecondReviewerThumbnailProgress(0);
        finalSecondReviewerThumbnailKey = await uploadFile(
          secondReviewerThumbnailBlob,
          "thumbnail.webp",
          "thumbnails",
          setSecondReviewerThumbnailProgress
        );
        setSecondReviewerThumbnailProgress(null);
      }

      let finalSecondReviewerVideoKey = secondReviewerVideoKey;
      if (hasSecondReviewer && secondReviewerVideoFile) {
        setSecondReviewerVideoProgress(0);
        finalSecondReviewerVideoKey = await uploadFile(
          secondReviewerVideoFile,
          secondReviewerVideoFile.name,
          "videos",
          setSecondReviewerVideoProgress
        );
        setSecondReviewerVideoProgress(null);
      }

      const payload = {
        title: title.trim(),
        store: store.trim(),
        city,
        categories: selectedCategories,
        rating: parseFloat(rating),
        price: price.trim() || undefined,
        description: description.trim(),
        reviewer: reviewer.trim(),
        status,
        videoKey: finalVideoKey,
        thumbnailKey: finalThumbnailKey,
        secondReviewer: hasSecondReviewer ? secondReviewer.trim() : undefined,
        secondReviewerVideoKey: hasSecondReviewer ? finalSecondReviewerVideoKey : undefined,
        secondReviewerThumbnailKey: hasSecondReviewer
          ? finalSecondReviewerThumbnailKey
          : undefined,
        secondReviewerRating:
          hasSecondReviewer && secondReviewerRating
            ? parseFloat(secondReviewerRating)
            : undefined,
      };

      const url =
        mode === "create"
          ? "/api/admin/reviews"
          : `/api/admin/reviews/${initial!.slug}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
      setVideoProgress(null);
      setThumbnailProgress(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <>
      {cropperFile && (
        <ImageCropper
          file={cropperFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropperFile(null)}
        />
      )}
      {secondReviewerCropperFile && (
        <ImageCropper
          file={secondReviewerCropperFile}
          onConfirm={handleSecondReviewerCropConfirm}
          onCancel={() => setSecondReviewerCropperFile(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm text-foreground/70">
          <p className="font-bold text-foreground">How to add a review</p>
          <p className="mt-1">
            Fill in the details below. Near the bottom, tap the boxes to upload the video and a thumbnail photo. When you&apos;re done, hit the big red button at the very bottom to save it.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Video title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder='e.g. "This Pizza Almost Made Us Fight"'
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Store name
            </label>
            <input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              City / Town
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              list="city-suggestions"
              placeholder="Pick a suggestion or type any town"
              required
              className={inputClass}
            />
            <datalist id="city-suggestions">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Categories (pick all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategories.includes(cat)
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Rating (1-10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Price (optional)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              list="price-suggestions"
              placeholder="e.g. $, $$, or $12.99"
              className={inputClass}
            />
            <datalist id="price-suggestions">
              {prices.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Reviewer
          </label>
          <div className="flex flex-wrap gap-2">
            {reviewers.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => {
                  setIsGuestReviewer(false);
                  setReviewer(r);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  !isGuestReviewer && reviewer === r
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsGuestReviewer(true);
                setReviewer(guestName);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                isGuestReviewer
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              Guest Reviewer
            </button>
          </div>
          {isGuestReviewer && (
            <input
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setReviewer(e.target.value);
              }}
              placeholder="Guest's name"
              required
              className={`${inputClass} mt-2 max-w-xs`}
            />
          )}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              checked={hasSecondReviewer}
              onChange={(e) => {
                const checked = e.target.checked;
                setHasSecondReviewer(checked);
                if (!checked) {
                  setSecondReviewer("");
                  setIsSecondGuestReviewer(false);
                  setSecondGuestName("");
                }
              }}
              className="h-4 w-4"
            />
            Add a second reviewer (two people reviewed this same video)
          </label>
          {hasSecondReviewer && (
            <>
              <p className="mb-2 text-xs text-foreground/50">
                Pick who else reviewed this. Viewers will get a switch between the two
                reviewers on the video page.
              </p>
              <div className="flex flex-wrap gap-2">
                {reviewers
                  .filter((r) => r !== reviewer)
                  .map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => {
                        setIsSecondGuestReviewer(false);
                        setSecondReviewer(r);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        !isSecondGuestReviewer && secondReviewer === r
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsSecondGuestReviewer(true);
                    setSecondReviewer(secondGuestName);
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isSecondGuestReviewer
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent"
                  }`}
                >
                  Guest Reviewer
                </button>
              </div>
              {isSecondGuestReviewer && (
                <input
                  value={secondGuestName}
                  onChange={(e) => {
                    setSecondGuestName(e.target.value);
                    setSecondReviewer(e.target.value);
                  }}
                  placeholder="Guest's name"
                  required
                  className={`${inputClass} mt-2 max-w-xs`}
                />
              )}
              <div className="mt-3 max-w-xs">
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  {secondReviewer ? `${secondReviewer}'s rating (1-10)` : "Second reviewer's rating (1-10)"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={secondReviewerRating}
                  onChange={(e) => setSecondReviewerRating(e.target.value)}
                  placeholder="Leave blank to reuse the first rating"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <MediaUploadFields
            label={hasSecondReviewer ? reviewer : undefined}
            thumbnailKey={thumbnailKey}
            thumbnailPreviewUrl={thumbnailPreviewUrl}
            thumbnailProgress={thumbnailProgress}
            onThumbnailPicked={handleThumbnailPicked}
            videoKey={videoKey}
            videoFile={videoFile}
            videoProgress={videoProgress}
            onVideoPicked={(file) => setVideoFile(file ?? null)}
          />
        </div>

        {hasSecondReviewer && (
          <div>
            <p className="mb-2 text-xs text-foreground/50">
              Optional — only add {secondReviewer || "the second reviewer"}&apos;s
              video/thumbnail below if they filmed a separate reaction. Viewers will get a
              switch between the two on the video page.
            </p>
            <MediaUploadFields
              label={secondReviewer || "Second reviewer"}
              thumbnailKey={secondReviewerThumbnailKey}
              thumbnailPreviewUrl={secondReviewerThumbnailPreviewUrl}
              thumbnailProgress={secondReviewerThumbnailProgress}
              onThumbnailPicked={handleSecondReviewerThumbnailPicked}
              videoKey={secondReviewerVideoKey}
              videoFile={secondReviewerVideoFile}
              videoProgress={secondReviewerVideoProgress}
              onVideoPicked={(file) => setSecondReviewerVideoFile(file ?? null)}
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Visibility
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatus("published")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                status === "published"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              Published (public)
            </button>
            <button
              type="button"
              onClick={() => setStatus("draft")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                status === "draft"
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              Private / Draft
            </button>
            <button
              type="button"
              onClick={() => setStatus("locked")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                status === "locked"
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              Locked (passcode)
            </button>
            <button
              type="button"
              onClick={() => setStatus("vault")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                status === "vault"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              Vault (double passcode)
            </button>
          </div>
          {status === "locked" && (
            <p className="mt-2 text-xs text-foreground/50">
              Visible under the site&apos;s &quot;Locked&quot; menu, only to visitors who enter the passcode.
            </p>
          )}
          {status === "vault" && (
            <p className="mt-2 text-xs text-foreground/50">
              Visible only inside the Vault, one tier deeper than Locked — visitors need the Locked
              passcode AND the Vault passcode.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-primary">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting
            ? thumbnailProgress !== null
              ? `Uploading thumbnail... ${thumbnailProgress}%`
              : videoProgress !== null
              ? `Uploading video... ${videoProgress}%`
              : "Saving..."
            : mode === "create"
            ? "Create Review"
            : "Save Changes"}
        </button>
      </form>
    </>
  );
}
