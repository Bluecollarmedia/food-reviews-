"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, cities, reviewers, prices, type Review } from "@/lib/data";

type Props = {
  mode: "create" | "edit";
  initial?: Review;
};

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
  const [status, setStatus] = useState<"published" | "draft">(
    initial?.status ?? "draft"
  );
  const [videoKey, setVideoKey] = useState<string | undefined>(initial?.videoKey);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function uploadVideo(file: File): Promise<string> {
    const res = await fetch("/api/admin/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!res.ok) throw new Error("Could not get upload URL");
    const { uploadUrl, key } = await res.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });

    return key;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      setError("Pick at least one category.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      let finalVideoKey = videoKey;
      if (videoFile) {
        setUploadProgress(0);
        finalVideoKey = await uploadVideo(videoFile);
        setUploadProgress(null);
      }

      const payload = {
        title: title.trim(),
        store: store.trim(),
        city,
        categories: selectedCategories,
        rating: parseFloat(rating),
        price: price || undefined,
        description: description.trim(),
        reviewer,
        status,
        videoKey: finalVideoKey,
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
      setUploadProgress(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
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
            City
          </label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            Rating (1-10, we never give a 10)
          </label>
          <input
            type="number"
            min={1}
            max={9.5}
            step={0.5}
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
          <select value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass}>
            <option value="">Not set</option>
            {prices.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
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
              onClick={() => setReviewer(r)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                reviewer === r
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
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
        <label className="mb-1 block text-sm font-semibold text-foreground">
          Video file
        </label>
        {videoKey && !videoFile && (
          <p className="mb-2 text-xs text-foreground/60">
            A video is already uploaded. Choose a new file only if you want to replace it.
          </p>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {uploadProgress !== null && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

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
        </div>
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {submitting
          ? uploadProgress !== null
            ? `Uploading video... ${uploadProgress}%`
            : "Saving..."
          : mode === "create"
          ? "Create Review"
          : "Save Changes"}
      </button>
    </form>
  );
}
