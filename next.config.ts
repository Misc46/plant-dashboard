import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicit root so Turbopack ignores stray package-lock.json files in parent
  // directories (e.g. the one accidentally created in the user home folder).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
