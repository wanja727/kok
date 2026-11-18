import type { NextConfig } from "next";

/** 백엔드(Spring) 주소. /api 요청을 여기로 보낸다. 같은 도메인으로 보이게 해서 세션 쿠키를 단순하게 둔다 (ADR-010) */
const apiOrigin = process.env.RETRIEVO_API_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
