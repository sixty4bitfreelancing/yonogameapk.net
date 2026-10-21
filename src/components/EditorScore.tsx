/** The site's own score for an app, shown as "★ 4.2/5". The "Editor Score" label is kept in the tooltip and for screen readers. */
export function EditorScore({ score, tone = "light", size = "sm" }: { score: number; tone?: "light" | "dark"; size?: "sm" | "md" }) {
  const dark = tone === "dark";
  return (
    <span
      className={`inline-flex items-center gap-1 ${size === "md" ? "text-sm" : "text-xs"}`}
      title={`Editor Score: ${score.toFixed(1)} out of 5`}
    >
      <span aria-hidden="true" className="text-amber-400">
        ★
      </span>
      <span className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{score.toFixed(1)}</span>
      <span className={dark ? "text-gray-300" : "text-gray-500"}>/5</span>
      <span className="sr-only">Editor Score</span>
    </span>
  );
}
