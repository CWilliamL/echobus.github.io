import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/echobus",
  output: "export",  // <=== enables static exports
  reactStrictMode: true,
};

export default nextConfig;
