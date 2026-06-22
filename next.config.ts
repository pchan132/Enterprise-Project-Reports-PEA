import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer is ESM-only — transpile it for the client bundle.
  // Do NOT also add it to serverExternalPackages (Turbopack conflict).
  transpilePackages: ["@react-pdf/renderer"],

  // ─── Security Headers (backup — also set via middleware) ───
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  // ─── Disable X-Powered-By header (information leakage) ───
  poweredByHeader: false,
};

export default nextConfig;
