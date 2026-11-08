import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React <ViewTransition> for page changes and shared elements (components/Motion).
  experimental: { viewTransition: true },
  async redirects() {
    return [
      // The classic practice path moved to /practice; the heatmap became /browse.
      { source: "/learn", destination: "/practice", permanent: false },
      { source: "/heatmap", destination: "/browse", permanent: false },
    ];
  },
};

export default nextConfig;
