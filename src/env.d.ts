/// <reference types="astro/client" />

/**
 * Build-time literal injected by the `define` block in astro.config.mjs from
 * the GEO_PERSONALIZATION Workers variable in wrangler.jsonc.
 */
declare const __GEO_PERSONALIZATION__: boolean;

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    /**
     * Accent profile resolved from `request.cf.country` on the on-demand
     * homepage, so <html data-region> is correct in the very first byte of
     * HTML rather than being corrected by the inline script afterwards.
     * Undefined on prerendered pages, where the inline script resolves it.
     */
    detectedRegion?: import("./i18n/regions").RegionCode | null;
  }
}
