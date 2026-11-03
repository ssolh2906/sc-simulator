import type { NextConfig } from "next";

// GitHub project Pages serve the site under /<repo>/. Derive the repo name in CI
// so the config keeps working if the repository is renamed. Locally we serve at "/".
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isProjectPages =
  process.env.GITHUB_ACTIONS === "true" && repo !== "" && !repo.endsWith(".github.io");
const basePath = isProjectPages ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
