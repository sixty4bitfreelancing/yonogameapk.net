"use client";

import { useEffect, useState } from "react";

interface Summary {
  average: number | null;
  count: number;
}

const VOTER_KEY = "yga-voter-id";

function voterId(): string {
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-6 w-6" aria-hidden="true" focusable="false">
      <path
        d="M10 1.8l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L10 14.4l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"
        fill={filled ? "#f59e0b" : "none"}
        stroke={filled ? "#f59e0b" : "#9ca3af"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Visitor star rating: one vote per browser per app, changeable, no account needed. */
export function RatingWidget({ slug, name, initial }: { slug: string; name: string; initial: Summary | null }) {
  const [summary, setSummary] = useState<Summary | null>(initial);
  const [mine, setMine] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const storageKey = `yga-rating:${slug}`;

  useEffect(() => {
    let active = true;
    const saved = Number(localStorage.getItem(storageKey));
    fetch(`/api/ratings/${slug}/`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Summary | null) => {
        if (!active) return;
        if (data) setSummary(data);
        if (saved >= 1 && saved <= 5) setMine(saved);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [slug, storageKey]);

  async function rate(stars: number) {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch(`/api/ratings/${slug}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, voterId: voterId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Your rating couldn't be saved.");
      localStorage.setItem(storageKey, String(stars));
      setMine(stars);
      setSummary(data);
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Your rating couldn't be saved.");
    }
  }

  const shown = hover ?? mine ?? 0;

  return (
    <div>
      <p className="text-sm text-gray-700">
        {summary && summary.count > 0 ? (
          <>
            <span className="font-semibold text-gray-900">{summary.average?.toFixed(1)}</span> out of 5 from{" "}
            {summary.count} visitor {summary.count === 1 ? "rating" : "ratings"}
          </>
        ) : (
          "No visitor ratings yet"
        )}
      </p>
      <div
        role="radiogroup"
        aria-label={`Rate ${name}`}
        className="-ml-2 mt-1 flex flex-wrap items-center"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mine === value}
            aria-label={`${value} out of 5 stars`}
            disabled={status === "saving"}
            onMouseEnter={() => setHover(value)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(null)}
            onClick={() => rate(value)}
            className="rounded p-2 disabled:opacity-60 sm:p-1.5"
          >
            <Star filled={value <= shown} />
          </button>
        ))}
        <span role="status" aria-live="polite" className="ml-2 text-xs text-gray-600">
          {status === "saving"
            ? "Saving…"
            : status === "error"
              ? message
              : mine
                ? `You rated ${mine}/5. Tap a star to change it.`
                : "Tap a star to rate"}
        </span>
      </div>
      <noscript>
        <p className="text-xs text-gray-500">Rating needs JavaScript.</p>
      </noscript>
    </div>
  );
}
