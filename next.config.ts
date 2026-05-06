import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./data/**/*"],
  },
  async redirects() {
    return [
      { source: "/brief", destination: "/cycles", permanent: true },
      { source: "/signals", destination: "/cycles/signals", permanent: true },
      { source: "/compete", destination: "/cycles/compete", permanent: true },
    ]
  },
};

export default nextConfig;
