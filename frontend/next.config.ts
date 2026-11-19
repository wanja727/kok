import type { NextConfig } from "next";

/** 백엔드(Spring) 주소. /api 요청을 여기로 보낸다. 같은 도메인으로 보이게 해서 세션 쿠키를 단순하게 둔다 (ADR-010) */
const apiOrigin = process.env.RETRIEVO_API_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // "나" 화면의 버전. pnpm 스크립트로 실행하면 package.json의 version이 들어온다
  env: { NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "" },
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
    // 카카오 로그인도 백엔드가 처리한다. 브라우저에는 이 도메인 하나로 보여서 세션 쿠키가 단순하다
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/oauth2/:path*", destination: `${apiOrigin}/oauth2/:path*` },
      { source: "/login/oauth2/:path*", destination: `${apiOrigin}/login/oauth2/:path*` },
    ];
  },
};

export default nextConfig;
