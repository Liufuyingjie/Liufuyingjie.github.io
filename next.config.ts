import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
};
export default nextConfig;
