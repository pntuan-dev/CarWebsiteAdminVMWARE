import type { NextConfig } from "next";

const minioHost = process.env.MINIO_ENDPOINT || "192.168.247.130";
const minioPort = process.env.MINIO_PORT || "9000";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: minioHost,
        port: minioPort,
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
