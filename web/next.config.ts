import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    watchOptions: {
      poll: 500,
    },
  },
};

export default nextConfig;
