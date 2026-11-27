/** Baseline security headers for every response. A strict Content-Security-Policy is
 * left for later: the UI still loads images from Unsplash/Google and fonts from Google. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker / own server: `NEXT_OUTPUT=standalone next build` makes a self-contained server
  // (.next/standalone/server.js). Vercel builds without it.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Make sure the Prisma query engine is copied into the standalone server (Docker image).
  outputFileTracingIncludes: { "/**/*": ["./node_modules/.prisma/client/**/*"] },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
