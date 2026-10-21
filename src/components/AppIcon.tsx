import Image from "next/image";
import type { AppRecord } from "@/data/types";

export function AppIcon({ app, size = 48, eager = false }: { app: AppRecord; size?: number; eager?: boolean }) {
  if (!app.image) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-400"
        style={{ width: size, height: size }}
        title="Icon not available"
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" aria-hidden="true" focusable="false">
          <path
            d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        <span className="sr-only">No icon available</span>
      </span>
    );
  }
  return (
    <Image
      src={app.image.src}
      alt={app.image.alt}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      className="shrink-0 rounded-xl border border-gray-200 bg-gray-50"
    />
  );
}
