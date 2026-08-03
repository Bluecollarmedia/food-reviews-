import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getPublishedReview,
  getReview,
  listPublishedReviews,
} from "@/lib/reviews-store";
import { getRelatedReviews } from "@/lib/data";
import { getPublicFileUrl } from "@/lib/media-url";
import { incrementViews } from "@/lib/views";
import { formatViewsFull } from "@/lib/view-counts";
import { LOCKED_SESSION_COOKIE, VAULT_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getLockedPasscode, getVaultPasscode } from "@/lib/locked-passcode";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ScoreBadge from "@/components/ScoreBadge";
import CommentSection from "@/components/CommentSection";
import RelatedVideosRow from "@/components/RelatedVideosRow";
import ReactionBar from "@/components/ReactionBar";
import VideoPlayer from "@/components/VideoPlayer";
import SplitReviewHeader from "@/components/SplitReviewHeader";

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
  const review = await getReview(slug);
  if (!review || review.status === "draft") notFound();

  if (review.status === "locked") {
    const cookieStore = await cookies();
    const token = cookieStore.get(LOCKED_SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token, await getLockedPasscode());
    if (!valid) redirect(`/locked/login?redirect=/videos/${slug}`);
  }

  if (review.status === "vault") {
    const cookieStore = await cookies();
    const lockedToken = cookieStore.get(LOCKED_SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(lockedToken, await getLockedPasscode()))) {
      redirect(`/locked/login?redirect=/videos/${slug}`);
    }
    const vaultToken = cookieStore.get(VAULT_SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(vaultToken, await getVaultPasscode()))) {
      redirect(`/locked/vault/login?redirect=/videos/${slug}`);
    }
  }

  await incrementViews(slug).catch(() => {});

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      await supabase
        .from("watch_history")
        .upsert(
          { user_id: user.id, slug, watched_at: new Date().toISOString() },
          { onConflict: "user_id,slug" }
        );
    } catch {
      // non-critical, ignore
    }
  }

  const allPublished = await listPublishedReviews();
  const related = getRelatedReviews(review, allPublished);
  const videoUrl = getPublicFileUrl(review.videoKey);
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);
  const secondReviewerVideoUrl = getPublicFileUrl(review.secondReviewerVideoKey);
  const secondReviewerThumbnailUrl = getPublicFileUrl(review.secondReviewerThumbnailKey);
  const hasSplitReviews = !!review.secondReviewer && !!secondReviewerVideoUrl;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <Link href="/reviews" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to all reviews
      </Link>

      {hasSplitReviews ? (
        <SplitReviewHeader
          slug={review.slug}
          categories={review.categories}
          title={review.title}
          store={review.store}
          city={review.city}
          price={review.price}
          firstReviewerName={review.reviewer}
          firstVideoUrl={videoUrl}
          firstThumbnailUrl={thumbnailUrl}
          firstRating={review.rating}
          secondReviewerName={review.secondReviewer ?? ""}
          secondVideoUrl={secondReviewerVideoUrl}
          secondThumbnailUrl={secondReviewerThumbnailUrl}
          secondRating={review.secondReviewerRating}
        />
      ) : (
        <>
          {videoUrl ? (
            <div className="mt-4">
              <VideoPlayer key={videoUrl} src={videoUrl} poster={thumbnailUrl} slug={review.slug} />
            </div>
          ) : (
            <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
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
                {review.secondReviewer ? ` & ${review.secondReviewer}` : ""}
              </p>
              {typeof review.displayViews === "number" && (
                <p className="mt-1 text-sm font-medium text-foreground/50">
                  {formatViewsFull(review.displayViews)} views
                </p>
              )}
            </div>
            <ScoreBadge rating={review.rating} size="lg" />
          </div>
        </>
      )}

      <p className="mt-6 max-w-2xl text-foreground/80 leading-relaxed">
        {review.description}
      </p>

      <div className="mt-6">
        <ReactionBar slug={review.slug} title={review.title} videoUrl={videoUrl} />
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
