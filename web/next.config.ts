import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(isDev && {
    watchOptions: {
      pollIntervalMs: 500,
    },
  }),
};

export default nextConfig;
