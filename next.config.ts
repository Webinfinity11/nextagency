import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["100.71.189.109"],
  // The KAI STUDIO deck is a self-contained HTML file (own fonts, styles and script), served as is.
  async rewrites() {
    return [{ source: "/presentation", destination: "/presentation.html" }];
  },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default nextConfig;
