import { listFiles } from "@/lib/r2";
import { listAllReviews } from "@/lib/reviews-store";
import AdminStorageList from "@/components/admin/AdminStorageList";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default async function AdminStoragePage() {
  const [videos, thumbnails, reviews] = await Promise.all([
    listFiles("videos/"),
    listFiles("thumbnails/"),
    listAllReviews(),
  ]);

  const inUseKeys = new Set<string>();
  for (const review of reviews) {
    if (review.videoKey) inUseKeys.add(review.videoKey);
    if (review.thumbnailKey) inUseKeys.add(review.thumbnailKey);
    if (review.secondReviewerVideoKey) inUseKeys.add(review.secondReviewerVideoKey);
    if (review.secondReviewerThumbnailKey) inUseKeys.add(review.secondReviewerThumbnailKey);
  }

  const allFiles = [...videos, ...thumbnails];
  const orphaned = allFiles
    .filter((f) => !inUseKeys.has(f.key))
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified));

  const orphanedBytes = orphaned.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground">Storage</h1>
      <p className="mt-1 text-foreground/60">
        {allFiles.length} files in the bucket &middot; {orphaned.length} not linked to any
        review, using {formatBytes(orphanedBytes)}.
      </p>

      {orphaned.length === 0 ? (
        <p className="mt-8 text-center text-foreground/60">
          Nothing unused — every file in the bucket is linked to a review.
        </p>
      ) : (
        <div className="mt-6">
          <AdminStorageList files={orphaned} />
        </div>
      )}
    </div>
  );
}
