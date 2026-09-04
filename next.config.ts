import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.247.130",
        port: "9000",
        pathname: "/websitecar/**",
      },
    ],
  },
};

export default nextConfig;
