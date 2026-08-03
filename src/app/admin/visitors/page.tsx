import { headers } from "next/headers";
import { listVisitors, getHiddenIps } from "@/lib/visitors";
import { getBans } from "@/lib/bans";
import AdminVisitors from "@/components/admin/AdminVisitors";

export const dynamic = "force-dynamic";

export default async function AdminVisitorsPage() {
  const [visitors, hidden, bans, headerList] = await Promise.all([
    listVisitors(),
    getHiddenIps(),
    getBans(),
    headers(),
  ]);

  const myIp =
    headerList.get("x-nf-client-connection-ip") ||
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground">
        Admin &middot; Visitors
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Every IP that visited the site, grouped, with the times they came. Give an
        IP a name so you know who it is, or hide one (like your own) so it stops
        cluttering the list.
      </p>

      <AdminVisitors
        visitors={visitors}
        hidden={hidden}
        bannedIps={bans.ips}
        banMessage={bans.message}
        myIp={myIp}
      />
    </div>
  );
}
