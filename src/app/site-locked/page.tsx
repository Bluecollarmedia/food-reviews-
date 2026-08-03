import { redirect } from "next/navigation";
import Image from "next/image";
import { getSiteLockMode } from "@/lib/site-settings";
import SiteLockForm from "@/components/SiteLockForm";

export const dynamic = "force-dynamic";

export default async function SiteLockedPage() {
  const mode = await getSiteLockMode();

  // Not locked — nothing to show here, send them home.
  if (mode === "off") redirect("/");

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

      {mode === "full" ? (
        <p className="mt-4 max-w-sm text-foreground/70">
          We&apos;re briefly closed for a quick behind-the-scenes update. Check back soon —
          we&apos;ll be right back.
        </p>
      ) : (
        <>
          <p className="mt-4 max-w-sm text-foreground/70">
            The site is members-only right now. Enter the passcode to come in.
          </p>
          <div className="mt-6 w-full max-w-xs">
            <SiteLockForm />
          </div>
        </>
      )}
    </div>
  );
}
