import type { RatingSummary } from "@/lib/ratings-store";

/** Read-only visitor rating: average stars and count, or "Not rated yet". */
export function RatingBadge({
  rating,
  size = "sm",
  tone = "light",
}: {
  rating: RatingSummary | null | undefined;
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const text = size === "md" ? "text-sm" : "text-xs";
  const muted = tone === "dark" ? "text-gray-300" : "text-gray-500";
  if (!rating || !rating.count || rating.average === null) {
    return (
      <span className={`inline-flex items-center gap-1 ${text} ${muted}`}>
        <span aria-hidden="true" className={tone === "dark" ? "text-gray-400" : "text-gray-300"}>
          ★
        </span>
        Not rated yet
      </span>
    );
  }
  const rounded = Math.round(rating.average);
  const strong = tone === "dark" ? "text-white" : "text-gray-900";
  return (
    <span className={`inline-flex items-center gap-1 ${text}`}>
      <span aria-hidden="true" className="tracking-tight text-amber-400">
        {"★".repeat(rounded)}
        <span className={tone === "dark" ? "text-gray-500" : "text-gray-300"}>{"★".repeat(5 - rounded)}</span>
      </span>
      <span className={`font-semibold ${strong}`}>{rating.average.toFixed(1)}</span>
      <span className="sr-only"> out of 5,</span>
      <span className={muted}>
        ({rating.count}
        <span className={size === "md" ? undefined : "sr-only"}>{rating.count === 1 ? " rating" : " ratings"}</span>)
      </span>
    </span>
  );
}
