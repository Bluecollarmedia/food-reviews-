"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { relativeTime } from "@/lib/time";
import type { VisitorRecord, VisitorGeo } from "@/lib/visitors";

function fullTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function GeoInfo({ geo }: { geo: VisitorGeo }) {
  const place = [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
  const provider = geo.isp || geo.org;
  const hasCoords = typeof geo.lat === "number" && typeof geo.lon === "number";

  return (
    <div className="mt-1.5 flex flex-col gap-0.5 text-xs">
      {place && (
        <p className="font-medium text-foreground/80">
          {geo.flag ? `${geo.flag} ` : "📍 "}
          {place}
        </p>
      )}
      <p className="flex flex-wrap items-center gap-x-2 text-foreground/50">
        {provider && <span>{provider}</span>}
        {geo.timezone && <span>&middot; {geo.timezone}</span>}
        {hasCoords && (
          <>
            <span>&middot;</span>
            <a
              href={`https://www.google.com/maps?q=${geo.lat},${geo.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              View on map
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
  onAction,
  busy,
}: {
  visitor: VisitorRecord;
  isMe: boolean;
  hidden: boolean;
  onAction: (action: string, ip: string, label?: string) => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(visitor.label ?? "");

  return (
    <div
      className={`rounded-2xl border bg-surface p-4 shadow-sm ${
        hidden ? "border-dashed border-border opacity-60" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {visitor.ip || "unknown"}
            </span>
            {isMe && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                This is you
              </span>
            )}
            {visitor.label && !editingLabel && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                {visitor.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-foreground/60">
            {visitor.count} {visitor.count === 1 ? "visit" : "visits"} &middot; last{" "}
            {relativeTime(visitor.lastSeen)} ago &middot; first seen {fullTime(visitor.firstSeen)}
          </p>
          {visitor.geo && <GeoInfo geo={visitor.geo} />}
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
              onClick={() => onAction("unhide", visitor.ip)}
              disabled={busy}
              className="text-foreground/60 hover:text-accent disabled:opacity-50"
            >
              Unhide
            </button>
          ) : (
            <button
              onClick={() => onAction("hide", visitor.ip)}
              disabled={busy}
              className="text-foreground/60 hover:text-accent disabled:opacity-50"
            >
              Hide
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete all visit history for ${visitor.ip}?`))
                onAction("clear", visitor.ip);
            }}
            disabled={busy}
            className="text-primary hover:underline disabled:opacity-50"
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
              onAction("label", visitor.ip, labelInput);
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
        {expanded ? "Hide visit times" : `Show ${visitor.count === 1 ? "visit" : "all visits"}`}
      </button>

      {expanded && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
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
      )}
    </div>
  );
}

export default function AdminVisitors({
  visitors,
  hidden,
  myIp,
}: {
  visitors: VisitorRecord[];
  hidden: string[];
  myIp: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  async function onAction(action: string, ip: string, label?: string) {
    setBusy(true);
    await fetch("/api/admin/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ip, label }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  const hiddenSet = new Set(hidden);
  const visible = visitors.filter((v) => !hiddenSet.has(v.ip));
  const hiddenVisitors = visitors.filter((v) => hiddenSet.has(v.ip));

  return (
    <div className="mt-8 flex flex-col gap-4">
      {visible.length === 0 && (
        <p className="text-center text-foreground/60">
          No visitors logged yet. As people browse the site, their IPs will show up here.
        </p>
      )}

      {visible.map((v) => (
        <VisitorRow
          key={v.ip}
          visitor={v}
          isMe={!!myIp && v.ip === myIp}
          hidden={false}
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
            {showHidden ? "Hide" : "Show"} hidden IPs ({hiddenVisitors.length})
          </button>
          {showHidden && (
            <div className="mt-3 flex flex-col gap-4">
              {hiddenVisitors.map((v) => (
                <VisitorRow
                  key={v.ip}
                  visitor={v}
                  isMe={!!myIp && v.ip === myIp}
                  hidden={true}
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
