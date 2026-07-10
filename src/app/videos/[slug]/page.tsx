import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublishedReview,
  listPublishedReviews,
} from "@/lib/reviews-store";
import { getRelatedReviews } from "@/lib/data";
import { getPublicFileUrl } from "@/lib/media-url";
import ScoreBadge from "@/components/ScoreBadge";
import CommentSection from "@/components/CommentSection";
import RelatedVideosRow from "@/components/RelatedVideosRow";
import ReactionBar from "@/components/ReactionBar";
import VideoPlayer from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getPublishedReview(slug);
  if (!review) return {};

  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);
  const description = `${review.store} · ${review.city} · ${review.rating}/10 — ${review.description}`;

  return {
    title: `${review.title} | D&S Food Reviews`,
    description,
    openGraph: {
      title: review.title,
      description,
      type: "article",
      images: thumbnailUrl ? [{ url: thumbnailUrl, width: 1280, height: 720 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: review.title,
      description,
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
    },
  };
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getPublishedReview(slug);
  if (!review) notFound();

  const allPublished = await listPublishedReviews();
  const related = getRelatedReviews(review, allPublished);
  const videoUrl = getPublicFileUrl(review.videoKey);
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to all reviews
      </Link>

      {videoUrl ? (
        <div className="mt-4">
          <VideoPlayer key={videoUrl} src={videoUrl} poster={thumbnailUrl} />
        </div>
      ) : (
        <div
          className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg bg-cover bg-center"
          style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
        >
          {!thumbnailUrl && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.2),transparent_60%)]" />
          )}
          {thumbnailUrl && <div className="absolute inset-0 bg-black/30" />}
          <div className="relative flex flex-col items-center gap-3 text-white">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="rounded-full bg-black/50 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide">
              Video Coming Soon
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {review.categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-primary-dark"
              >
                {c}
              </span>
            ))}
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-wide text-foreground">
            {review.title}
          </h1>
          <p className="mt-1 text-foreground/60">
            {review.store} &middot; {review.city}
            {review.price ? ` · ${review.price}` : ""} &middot; Reviewed by {review.reviewer}
          </p>
        </div>
        <ScoreBadge rating={review.rating} size="lg" />
      </div>

      <p className="mt-6 max-w-2xl text-foreground/80 leading-relaxed">
        {review.description}
      </p>

      <div className="mt-6">
        <ReactionBar slug={review.slug} title={review.title} />
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <CommentSection slug={review.slug} />
      </div>

      {related.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            You Might Also Like
          </h2>
          <RelatedVideosRow related={related} />
        </div>
      )}
    </div>
  );
}
