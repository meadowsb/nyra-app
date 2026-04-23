import type { NextConfig } from "next";

/**
 * Next.js shows a small floating route indicator (e.g. bottom-left) in `next dev`.
 * It is hidden by default so demos and normal dev UX stay clean.
 * Set `NYRA_NEXT_DEV_INDICATOR=1` when starting the dev server to bring it back.
 */
const showNextDevIndicator = process.env.NYRA_NEXT_DEV_INDICATOR === "1";

const nextConfig: NextConfig = {
  devIndicators: showNextDevIndicator ? { position: "bottom-left" } : false,
};

export default nextConfig;
