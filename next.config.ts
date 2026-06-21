import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer is ESM-only — transpile it for the client bundle.
  // Do NOT also add it to serverExternalPackages (Turbopack conflict).
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
