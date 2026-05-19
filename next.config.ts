import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["tldraw", "@tldraw/sync"],
};

export default nextConfig;
