"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { relativeTime } from "@/lib/time";

export type AdminUserRow = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
};

export default function AdminUsersList({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmingId(null);
    router.refresh();
  }

  if (users.length === 0) {
    return <p className="mt-8 text-center text-foreground/60">No accounts yet.</p>;
  }

  return (
    <div className="mt-6 flex flex-col divide-y divide-border">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 py-4">
          {u.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.avatarUrl} alt={u.displayName} loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-white">
              {u.displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{u.displayName}</span>
              {u.isAdmin && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Admin
                </span>
              )}
            </div>
            <p className="truncate text-xs text-foreground/50">{u.email}</p>
            <p className="text-[11px] text-foreground/40">Joined {relativeTime(u.createdAt)}</p>
          </div>

          {confirmingId === u.id ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => handleDelete(u.id)}
                disabled={busyId === u.id}
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {busyId === u.id ? "Deleting..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmingId(null)}
                disabled={busyId === u.id}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingId(u.id)}
              className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
