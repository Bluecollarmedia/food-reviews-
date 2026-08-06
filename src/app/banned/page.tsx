import Image from "next/image";
import { getBanMessage } from "@/lib/bans";
import BannedActions from "@/components/BannedActions";

export const dynamic = "force-dynamic";

export default async function BannedPage() {
  const message = await getBanMessage();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <Image
        src="/images/brand/logo.webp"
        alt="D&S Food Reviews"
        width={72}
        height={72}
        className="h-18 w-18 rounded-full"
        priority
      />
      <h1 className="mt-5 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        D&amp;S Food Reviews
      </h1>
      <p className="mt-4 max-w-sm whitespace-pre-line text-foreground/70">
        {message?.trim() || "You no longer have access to this site."}
      </p>

      <BannedActions />
    </div>
  );
}
