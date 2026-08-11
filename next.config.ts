import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/get-started",
        destination: "https://web-form-blush.vercel.app/get-started",
      },
      {
        source: "/get-started/:path*",
        destination:
          "https://web-form-blush.vercel.app/get-started/:path*",
      },
    ];
  },
};

export default nextConfig;