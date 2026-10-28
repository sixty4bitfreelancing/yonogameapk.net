import type { NextConfig } from "next";
import { isProductionDeployment } from "./src/lib/env";
import { site } from "./src/lib/site";

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
    // No banner is wider than 768 CSS px, so variants above 1536px are never useful.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1536],
    // App images have content-hashed filenames, so optimised copies never go stale.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    const rules = [
      {
        source: `/${site.indexNowKey}.txt`,
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/downloads/:file*",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: "attachment" },
          { key: "X-Robots-Tag", value: "noindex" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
    if (!isProductionDeployment) {
      rules.push({ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] });
    }
    return rules;
  },
};

export default nextConfig;
