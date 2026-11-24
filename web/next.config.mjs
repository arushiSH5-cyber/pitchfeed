/** @type {import('next').NextConfig} */
// GITHUB_PAGES=1 builds a static demo (no API routes, no keys) served under /pitchfeed.
const pages = process.env.GITHUB_PAGES === "1";
const nextConfig = {
  reactStrictMode: false,
  env: { NEXT_PUBLIC_BASE_PATH: pages ? "/pitchfeed" : "" },
  ...(pages ? { output: "export", basePath: "/pitchfeed", images: { unoptimized: true }, trailingSlash: true } : {}),
};
export default nextConfig;
