import type { NextConfig } from "next";

/**
 * TRI-MODE BUILD (satu codebase, tiga target):
 *
 * 1. Lokal / VPS (default)      → output "standalone" + API routes Node.
 * 2. Vercel (VERCEL=1)          → tanpa "standalone": Vercel menangani
 *    packaging serverless-nya sendiri. Prisma client + file SQLite
 *    tetap ter-bundle via outputFileTracingIncludes.
 * 3. Shared hosting tanpa Node  → BUILD_STATIC=1 → output "export" murni
 *    (HTML/JS/CSS statis). API digantikan backend PHP (lihat shared-hosting/),
 *    dipaketkan oleh scripts/build-shared-hosting.mjs.
 */
const isStatic = process.env.BUILD_STATIC === "1";
const isVercel = process.env.VERCEL === "1";

const buildOutput = isStatic
  ? { output: "export" as const, images: { unoptimized: true } }
  : isVercel
    ? {}
    : { output: "standalone" as const };

const nextConfig: NextConfig = {
  ...buildOutput,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Ramah shared hosting: tanpa header "X-Powered-By", respons di-gzip.
  poweredByHeader: false,
  compress: true,
  // Prisma v8 (Rust-free): native modul adapter SQLite tidak boleh di-bundle.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Wajib untuk shared hosting & Vercel: client v8 ter-generate (src/generated,
  // tanpa binary engine) dan file database SQLite ikut ter-bundle, sehingga
  // folder node_modules maupun .env tidak dibutuhkan pada saat runtime.
  outputFileTracingIncludes: isStatic
    ? undefined
    : {
        "/**": ["./src/generated/prisma/**", "./db/custom.db"],
      },
};

export default nextConfig;
