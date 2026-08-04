"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { relativeTime } from "@/lib/time";
import type { VisitorRecord, VisitorLocation } from "@/lib/visitors";

function fullTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function placeLabel(loc: VisitorLocation | undefined): string {
  if (!loc?.geo) return loc?.ip || "unknown";
  const { geo } = loc;
  const place = [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
  return `${geo.flag ? geo.flag + " " : ""}${place || loc.ip}`;
}

function LocationLine({ loc }: { loc: VisitorLocation }) {
  const provider = loc.geo?.isp || loc.geo?.org;
  const hasCoords = typeof loc.geo?.lat === "number" && typeof loc.geo?.lon === "number";
  return (
    <div className="text-xs">
      <p className="font-medium text-foreground/80">{placeLabel(loc)}</p>
      <p className="flex flex-wrap items-center gap-x-2 text-foreground/50">
        <span className="font-mono">{loc.ip}</span>
        {provider && <span>&middot; {provider}</span>}
        {hasCoords && (
          <>
            <span>&middot;</span>
            <a
              href={`https://www.google.com/maps?q=${loc.geo!.lat},${loc.geo!.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              map
            </a>
          </>
        )}
      </p>
    </div>
  );
}

function VisitorRow({
  visitor,
  isMe,
  hidden,
  banned,
  onAction,
  busy,
}: {
  visitor: VisitorRecord;
  isMe: boolean;
  hidden: boolean;
  banned: boolean;
  onAction: (action: string, opts: { id?: string; ip?: string; label?: string }) => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(visitor.label ?? "");

  const locations = visitor.locations ?? [];
  const primary = locations[0];
  const topIp = primary?.ip;

  return (
    <div
      className={`rounded-2xl border bg-surface p-4 shadow-sm ${
        hidden ? "border-dashed border-border opacity-60" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {visitor.label || (isMe ? "This device" : "Visitor")}
            </span>
            {isMe && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                This is you
              </span>
            )}
            {banned && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Banned
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-foreground/60">
            {visitor.count} {visitor.count === 1 ? "visit" : "visits"} &middot; last{" "}
            {relativeTime(visitor.lastSeen)} ago &middot; first seen {fullTime(visitor.firstSeen)}
          </p>
          {primary && (
            <div className="mt-1.5">
              <LocationLine loc={primary} />
              {locations.length > 1 && (
                <p className="mt-0.5 text-[11px] text-foreground/40">
                  Seen from {locations.length} different IPs/places (cellular usually
                  means one phone hopping IPs).
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setEditingLabel((v) => !v)}
            className="text-foreground/60 hover:text-primary"
          >
            {visitor.label ? "Rename" : "Name it"}
          </button>
          {hidden ? (
            <button
              onClick={() => onAction("unhide", { id: visitor.id })}
              disabled={busy}
              className="text-foreground/60 hover:text-accent disabled:opacity-50"
            >
              Unhide
            </button>
          ) : (
            <button
              onClick={() => onAction("hide", { id: visitor.id })}
              disabled={busy}
              className="text-foreground/60 hover:text-accent disabled:opacity-50"
            >
              Hide
            </button>
          )}
          {topIp &&
            (banned ? (
              <button
                onClick={() => onAction("unban", { ip: topIp })}
                disabled={busy}
                className="text-foreground/60 hover:text-emerald-600 disabled:opacity-50"
              >
                Unban
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm(`Ban ${topIp}? They'll see your ban message. Note: on cellular they can dodge it by getting a new IP.`))
                    onAction("ban", { ip: topIp });
                }}
                disabled={busy}
                className="text-primary hover:underline disabled:opacity-50"
              >
                Ban
              </button>
            ))}
          <button
            onClick={() => {
              if (confirm("Delete this device's history?")) onAction("clear", { id: visitor.id });
            }}
            disabled={busy}
            className="text-foreground/60 hover:text-primary disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {editingLabel && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="e.g. Me, Shmuel, Mom..."
            className="w-48 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              onAction("label", { id: visitor.id, label: labelInput });
              setEditingLabel(false);
            }}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setLabelInput(visitor.label ?? "");
              setEditingLabel(false);
            }}
            className="text-xs font-semibold text-foreground/50 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-xs font-semibold text-primary hover:underline"
      >
        {expanded ? "Hide details" : "Show visits & IPs"}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-3 border-t border-border pt-2">
          {locations.length > 1 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
                IPs / places used
              </p>
              <div className="flex flex-col gap-1.5">
                {locations.map((loc) => (
                  <LocationLine key={loc.ip} loc={loc} />
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
              Recent visits
            </p>
            <ul className="flex flex-col gap-1">
              {visitor.hits.map((hit, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 text-xs text-foreground/70"
                >
                  <span>{fullTime(hit.t)}</span>
                  <span className="truncate font-mono text-foreground/50">{hit.p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVisitors({
  visitors,
  hidden,
  bannedIps,
  banMessage,
}: {
  visitors: VisitorRecord[];
  hidden: string[];
  bannedIps: string[];
  banMessage: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [messageInput, setMessageInput] = useState(banMessage);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    try {
      setMyId(localStorage.getItem("dsfr_vid") ?? "");
    } catch {
      // ignore
    }
  }, []);

  async function onAction(action: string, opts: { id?: string; ip?: string; label?: string }) {
    setBusy(true);
    await fetch("/api/admin/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...opts }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  async function saveBanMessage() {
    setBusy(true);
    await fetch("/api/admin/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ban-message", message: messageInput }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  async function clearAll() {
    if (!confirm("Clear the entire visitor log? This can't be undone.")) return;
    setBusy(true);
    await fetch("/api/admin/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear-all" }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  const hiddenSet = new Set(hidden);
  const bannedSet = new Set(bannedIps);
  const isBanned = (v: VisitorRecord) => (v.locations ?? []).some((l) => bannedSet.has(l.ip));
  const visible = visitors.filter((v) => !hiddenSet.has(v.id));
  const hiddenVisitors = visitors.filter((v) => hiddenSet.has(v.id));

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <label className="text-sm font-semibold text-foreground">
          Message shown to banned visitors
        </label>
        <p className="mt-0.5 text-xs text-foreground/50">
          Anyone you ban (by IP) is blocked from the whole site and sees this on a branded page.
        </p>
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          rows={3}
          placeholder="e.g. You've been blocked from D&S Food Reviews."
          className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={saveBanMessage}
          disabled={busy || messageInput === banMessage}
          className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          Save message
        </button>
      </div>

      {visitors.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/50">
            {visitors.length} {visitors.length === 1 ? "device" : "devices"} logged
          </p>
          <button
            onClick={clearAll}
            disabled={busy}
            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          >
            Clear all history
          </button>
        </div>
      )}

      {visible.length === 0 && (
        <p className="text-center text-foreground/60">
          No visitors logged yet. As people browse the site, their devices show up here.
        </p>
      )}

      {visible.map((v) => (
        <VisitorRow
          key={v.id}
          visitor={v}
          isMe={!!myId && v.id === myId}
          hidden={false}
          banned={isBanned(v)}
          onAction={onAction}
          busy={busy}
        />
      ))}

      {hiddenVisitors.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowHidden((v) => !v)}
            className="text-sm font-semibold text-foreground/60 hover:text-primary"
          >
            {showHidden ? "Hide" : "Show"} hidden devices ({hiddenVisitors.length})
          </button>
          {showHidden && (
            <div className="mt-3 flex flex-col gap-4">
              {hiddenVisitors.map((v) => (
                <VisitorRow
                  key={v.id}
                  visitor={v}
                  isMe={!!myId && v.id === myId}
                  hidden={true}
                  banned={isBanned(v)}
                  onAction={onAction}
                  busy={busy}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
