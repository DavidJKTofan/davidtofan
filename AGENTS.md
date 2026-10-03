# AGENTS.md

Personal website: Astro 7 + TypeScript + Tailwind CSS 4, deployed to Cloudflare Workers (Static Assets). [README.md](README.md) is the source of truth for architecture, flags and conventions; read the relevant section before changing anything it covers.

## Cloudflare accuracy

- Verify any Cloudflare claim (Workers, Static Assets, `_headers`/`_redirects`, AI Search, Image Transformations, Web Analytics, billing, compatibility flags) against the **`cloudflare-docs` MCP server** before writing it into code, config or content. Don't rely on memory.
- Follow [Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/index.md). The ones that matter here:
  - Run `wrangler types` (done by `npm run build`) rather than hand-writing `Env` types.
  - Never commit secrets; use `wrangler secret put`.
  - No module-level mutable state in Worker code; pass state through arguments.
  - No floating promises: `await`, return, or `ctx.waitUntil()`.
  - Use bindings, not REST calls; stream large bodies; log structured JSON.
  - Use `crypto.randomUUID()` / `getRandomValues()`, never `Math.random()`, for anything security-relevant.
- Bump `compatibility_date` deliberately, not automatically (see README "Compatibility date"). Keep `global_fetch_strictly_public`.

## Project rules

- **Assets-only by default.** `GEO_PERSONALIZATION` ships `"FALSE"`; every route is prerendered and free. Don't add Worker code, on-demand routes or `run_worker_first` without being asked. If the flag is touched, `wrangler.jsonc` flag and `run_worker_first` must change together.
- **Trailing slashes.** Internal links and redirect targets end in `/`.
- **`public/_headers`**: every matching rule applies and duplicate headers are comma-joined. Use `/:file.ext` for root-level files, not `/*.ext`. Check overlaps with `curl -sI` against `wrangler dev`. Headers set in `_headers` must be mirrored in `src/pages/index.astro`.
- **Content**: never change `date` on published content; set `modified` as a bare `YYYY-MM-DD` (no inline comment) only for substantive edits. Code fences use a supported Shiki language (`text` for ASCII diagrams).
- **Legal/privacy**: editing a legal page means bumping its `lastModified` in `src/lib/contentMetadata.js`. A new cookie, storage key, third-party script or request signal needs a line in `src/pages/imprint.astro`.
- **i18n**: five locales (en, es, de, it, zh). UI strings live in `src/i18n/ui.ts`; adding/removing a language touches the files listed in the README. Article and project bodies stay English.
- **Dependencies**: use `npm run deps:check` / `deps:update`; don't hand-edit `package-lock.json`. Don't edit `.wrangler/` or `dist/`.

## Verify before finishing

```bash
npm run build && npx wrangler deploy --dry-run
```

Never run `npm run deploy` or any other git/Cloudflare write action unless explicitly asked. If a change touches `src/pages/index.astro`, `astro.config.mjs` or `wrangler.jsonc`, also dry-run with `GEO_PERSONALIZATION=TRUE`.
