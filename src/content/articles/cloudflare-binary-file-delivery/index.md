---
title: Delivering Binary Files with Cloudflare
date: 2026-09-06
description: "How to host, cache, and deliver large binary files – installers, game clients, firmware, SDKs – with Cloudflare, for both public and authenticated (gated) downloads."
tags: ["cloudflare", "performance", "cdn", "developers", "resources"]
type: "article"
---

Plenty of companies ship software rather than web pages: an MSI or EXE installer, a macOS DMG/PKG, a Linux DEB/RPM, a multi-gigabyte game client or patch, firmware images, SDK archives, ML model weights, or nightly build artifacts. The delivery problem looks nothing like optimizing a landing page – there is no Largest Contentful Paint (LCP) to chase, no third-party script to offload. There is one very large response, and the questions are: **does it come from cache, how fast does the last byte arrive, and who is allowed to download it?**

This guide covers the options for that with Cloudflare, in two flavours:

- **Public downloads** – anyone with the URL can fetch the file (open-source releases, drivers, demo clients, public patches).
- **Protected downloads** – the file is gated behind a login, a licence, a purchase, or a partner agreement.

> This is a companion to [General Application Performance Recommendations](/articles/cloudflare-l7-performance-recommendations/), which covers the browser-facing/web page side of performance.

## What Actually Matters for Binaries

Different workload, different metrics. Optimizing for Core Web Vitals here is mostly wasted effort.

| **METRIC** | **WHY IT MATTERS FOR BINARIES** | **WHERE TO FIND IT** |
| --- | --- | --- |
| **Time to Last Byte (TTLB)** | The user waits for the *whole* file. TTFB is nearly irrelevant when the response is 4 GB. | Client-side timing, synthetic monitors, `curl -w '%{time_total}'` |
| **Cache Hit Ratio** | Every MISS is an origin read plus (usually) cloud egress cost. For a release-day spike, this is the single most important number. | [Cache Analytics](https://developers.cloudflare.com/cache/performance-review/cache-analytics/) |
| **Origin egress (GB)** | Directly translates into a bill from your cloud provider. | Origin/cloud billing, Cache Analytics "Served by origin" |
| **Throughput / resumability** | Long downloads on mobile or flaky networks fail and restart unless range requests work. | `accept-ranges` header, HTTP 206 responses |
| **Error rate on large responses** | Timeouts and connection resets show up as 520/524 rather than as slow downloads. | [Origin Analytics](https://developers.cloudflare.com/speed/origin-analytics/) / [Logpush](https://developers.cloudflare.com/logs/logpush/) / [Log Explorer](https://developers.cloudflare.com/log-explorer/) |

Binaries are, on the other hand, the *ideal* CDN workload: they are immutable, they are requested by many users, and they are usually versioned. A build artifact that never changes can be cached essentially forever.

## Step 0: Decide Where the File Lives

Before configuring caching, decide what the CDN is pulling from.

| **PATTERN** | **WHEN IT FITS** | **NOTES** |
| --- | --- | --- |
| **Existing origin behind a [proxied](https://developers.cloudflare.com/dns/proxy-status/) Zone** | You already have a release server, artifact repository, or object store, and just want it fronted. | Simplest. Cloudflare caches in front of it; origin egress still happens on every MISS. |
| **[R2 Object Storage](https://developers.cloudflare.com/r2/)** | You want to stop paying egress fees and remove the origin from the hot path. | [S3-compatible API](https://developers.cloudflare.com/r2/api/), no egress charges. |
| **[R2 Custom Domain](https://developers.cloudflare.com/r2/buckets/public-buckets/) + [Workers](https://developers.cloudflare.com/workers/)** | Downloads need authorization, licence checks, per-user logic, or entitlement lookups. | The Worker validates, then streams the object from an R2 binding. |
| **Hybrid / multi-cloud** | You are [migrating](https://developers.cloudflare.com/r2/data-migration/) away from S3/GCS but cannot cut over at once. | See [On-demand object storage migration](https://developers.cloudflare.com/reference-architecture/diagrams/storage/on-demand-object-storage-migration/) (Sippy incremental migration) and [egress-free multi-cloud storage](https://developers.cloudflare.com/reference-architecture/diagrams/storage/egress-free-storage-multi-cloud/). |

Cloudflare's own [distributed web performance architecture](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/distributed-web-performance-architecture/) is blunt about which of these wins: the "originless" model built on Workers and R2 is called *the* optimal design for high-performance file distribution, precisely because it removes the traditional backend infrastructure from the path of large downloads.

If you cannot move the bytes yet, three options shorten the path from Cloudflare to wherever they are:

- **[Cloud Connector](https://developers.cloudflare.com/rules/cloud-connector/)** – route matching requests straight to S3, Azure Blob, or GCS buckets without standing up your own proxy in front of them.
- **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) or [Workers VPC](https://developers.cloudflare.com/workers-vpc/)** – reach a private artifact repository (Artifactory, Nexus, an internal build server) without exposing it to the Internet.
- **[Bandwidth Alliance](https://www.cloudflare.com/bandwidth-alliance/)** – participating providers reduce or waive egress fees for traffic leaving to Cloudflare, which takes some of the sting out of a slow migration.

> Do **not** use the managed `r2.dev` subdomain for production – it is rate limited, and it supports neither caching, WAF, nor Bot Management. Connect a [Custom Domain](https://developers.cloudflare.com/r2/buckets/public-buckets/) instead, which is what puts the bucket behind Cloudflare's cache and unlocks WAF, Access, and Cache Rules on it.

> **Two different size limits get confused constantly.** The **maximum upload size** caps request bodies travelling *through* the proxy toward your origin. The **maximum cacheable file size** caps responses Cloudflare is willing to *store*. Publishing a 3 GB installer is an upload problem; serving it is a cacheable-size problem. Both are covered in [Size Limits: Two Different Numbers](#size-limits-two-different-numbers) below, and both are documented under [customization options and limits](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/#customization-options-and-limits).

> **A name collision worth clearing up.** Cloudflare [Artifacts](https://blog.cloudflare.com/artifacts-git-for-agents-beta/) is a versioned filesystem that speaks Git, built on Durable Objects for agents, sandboxes, and per-session state. Despite the name, it is not where your build artifacts get *distributed* from – repositories there are chunked into a SQLite-backed store and billed per Git operation, and its own `ArtifactFS` driver deliberately **deprioritizes binary blobs** when hydrating a checkout. Git-shaped storage is for the source and the history; R2 plus the CDN is for the 4 GB installer.

---

## Part 1 – Public (Non-Authenticated) Downloads

### The Default Behavior ~~Trap~~ Opportunity

The defaults are less of a trap than an *opportunity* – but only once you know where they stop. [Cloudflare's default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/) caches a fixed list of **file extensions** – and, importantly, *only* by extension, never by MIME type. Serving an installer as `application/octet-stream` does nothing on its own. It is worth reading that list carefully, because the coverage for installers is uneven:

- **Cached by default**: `EXE`, `APK`, `DMG`, `ISO`, `BIN`, `ZIP`, `7Z`, `GZ`, `BZ2`, `ZST`, `TAR`, `RAR`, `JAR`, `PDF`, and the usual media/web assets.
- **Not cached by default**: `MSI`, `PKG`, `DEB`, `RPM`, `MSIX`, `APPX`, extensionless URLs, and anything served from a path like `/download?build=1234`.

So a Windows vendor shipping `.exe` gets caching automatically, while the same vendor's `.msi` returns [`CF-Cache-Status: DYNAMIC`](https://developers.cloudflare.com/cache/concepts/cache-responses/#dynamic) and hits the origin on every single request.

The other important aspect is TTL. When the origin sends no `Cache-Control` or `Expires` header, Cloudflare falls back to a [default Edge TTL by status code](https://developers.cloudflare.com/cache/how-to/configure-cache-status-code/#edge-ttl):

| **HTTP STATUS** | **DEFAULT EDGE TTL** |
| --- | --- |
| 200, 206, 301 | 120 minutes |
| 302, 303 | 20 minutes |
| 404, 410 | 3 minutes |

Two hours is nothing for an immutable 2 GB artifact. Even the extensions that *are* cached by default fall out of cache and re-pull from your origin several times a day unless you say otherwise.

**The fix is easy: do not rely on the default extension list.** Create an explicit [Cache Rule](https://developers.cloudflare.com/cache/how-to/cache-rules/) that marks your download paths as eligible for cache. For example:

```txt
# Cache Rule expression
(http.request.uri.path wildcard "/downloads/*")
or (http.request.uri.path.extension in {"msi" "exe" "pkg" "deb" "rpm" "dmg" "zip" "appx"})
```

With [settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/):

- **Cache eligibility** → `Eligible for cache`
- **Edge TTL** → `Ignore cache-control header and use this TTL` → a long value (e.g. 30 days) for immutable, versioned artifacts
- **Browser TTL** → `Override origin and use this TTL` → long for versioned URLs, short/`Respect origin TTL` for "latest" path aliases
- **Cache Key** → see [Cache Keys](#cache-keys-what-actually-identifies-your-file) below; this is the setting that decides whether all your users share one cached copy or each get their own
- **Respect Strong ETags** → `On`, so Cloudflare enforces byte-for-byte equivalency with the origin instead of [weakening the ETag](https://developers.cloudflare.com/cache/reference/etag-headers/). For an installer, "probably the same file" is not good enough
- **[Serve stale content while revalidating](https://developers.cloudflare.com/cache/concepts/revalidation/)** → leave enabled, so a revalidation against a slow origin does not stall a 4 GB download

### Cache Rules Stack, and the Last Match Wins

Creating the rule above is only half the story. [Cache Rules are **stackable**](https://developers.cloudflare.com/cache/how-to/cache-rules/order/): when several rules match the same request, their settings are all applied, in order. And when two matching rules set the *same* setting to different values, **the last matching rule wins**.

That single sentence explains most "my Cache Rule isn't working" tickets. Cloudflare's own example:

```txt
Rule #1  (http.request.uri.path wildcard "/images/*")  →  Eligible for cache
Rule #2  (http.host eq "example.com")                  →  Bypass cache
```

Rule #2 is broader *and* later, so cache is bypassed on `/images/*` too. Rule #1 is essentially dead.

For a downloads site this is the failure mode to look for first. Teams usually have a legacy catch-all somewhere – "bypass cache when a session cookie is present", "bypass on `/api/*`", a leftover rule from a WordPress install – and if it sits **below** your downloads rule in the list, your carefully tuned 30-day Edge TTL never takes effect. The symptom is a stubborn `BYPASS` or `DYNAMIC` on a rule you are certain is correct.

Three more precedence facts worth holding onto:

- **Cache Rules override the zone-wide Caching configuration.** A Browser Cache TTL of 4 hours set for the whole zone loses to a Cache Rule that matches the request.
- **Cache Rules take precedence over Page Rules**, by design. If you are mid-migration from Page Rules, the Cache Rule is what is actually running.
- **Across products, order is fixed**: [Single Redirects → URL Rewrites → Configuration Rules → Origin Rules → Bulk Redirects → Managed Transforms → Request Header Transforms → Cache Rules → Snippets → Cloud Connector](https://developers.cloudflare.com/cache/how-to/cache-rules/order/#execution-order-of-rules-products). This is why the `latest` redirect in [Versioning Beats Purging](#versioning-beats-purging) never reaches cache, and why a WAF check can gate a request before cache is consulted.
- **[Cache Response Rules](https://developers.cloudflare.com/cache/how-to/cache-response-rules/) stack the same way, and beat Cache Rules.** They run later, on the origin *response*, so when the two disagree the Cache Response Rule wins – see [Fixing an Uncooperative Origin](#fixing-an-uncooperative-origin-with-cache-response-rules).

Order your rules narrowest-last, and confirm the result with [Cloudflare Trace](https://developers.cloudflare.com/rules/trace-request/) rather than by reading the list.

### Cache Keys: What Actually Identifies Your File

A [cache key](https://developers.cloudflare.com/cache/how-to/cache-keys/) is the identifier Cloudflare stores your object under. Two requests that produce the same key share one cached copy; two requests that produce different keys are two separate multi-gigabyte objects in cache, each with its own MISS, its own origin pull, and (usually also) its own egress bill.

The **default cache key** is built from:

1. The full URL – scheme, host, and **URI including the query string**.
2. The `Origin` request header (for CORS correctness).
3. `x-http-method-override`, `x-http-method`, `x-method-override`.
4. `x-forwarded-host`, `x-host`, `x-forwarded-scheme`, `x-original-url`, `x-rewrite-url`, `forwarded`.

For binaries, item 1 is where the money leaks. Download links are exactly the kind of URL people decorate:

```txt
/downloads/2.4.1/app-setup.exe?utm_source=newsletter    →  one cache entry
/downloads/2.4.1/app-setup.exe?utm_source=docs          →  a second copy of the same file
/downloads/2.4.1/app-setup.exe?mirror=eu&t=1772649600   →  a third
```

Same bytes, three cache entries, three origin fills. On a release announcement with campaign-tagged links, this quietly turns a 95% hit ratio into something far worse.

**Adding a Cache Key setting to your Cache Rule** is how you fix it. In the dashboard: **Cache Rules** → your rule → **Cache eligibility: Eligible for cache** → add the **Cache Key** setting.

| **CACHE KEY OPTION** | **WHAT IT DOES** | 
| --- | --- | 
| **Ignore query string** | Drops the query string from the key entirely – every variant of the URL collapses onto one object. The right default for versioned artifacts. | 
| **Sort query string** | Normalizes parameter order, so `?a=1&b=2` and `?b=2&a=1` are one entry. Use when parameters genuinely select content. | 
| **[Cache deception armor](https://developers.cloudflare.com/cache/cache-security/cache-deception-armor/)** | Rejects requests where the extension does not match the `Content-Type`, blocking a class of cache-poisoning attacks. |
| **Query string include/exclude** | Keep only the parameters that select content (`?arch=arm64`), drop the rest. |
| **Headers / Cookie / Host / User features** | Add specific headers, cookies, the resolved host, or device type / country / language to the key. | 

Things worth knowing before you customize the key:

- **Custom keys shard the cache by design.** Every component you add multiplies the number of stored copies. For binaries, the goal is almost always *fewer* components, not more.
- **Custom cache keys change how single-file purge works.** Purge by tag, host, prefix, and purge everything are unaffected, but a purge *by URL* must also carry the headers and query strings that are part of your custom key – which the dashboard's single-file purge cannot express, so do it through the [API](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-cache-key/).
- **[Prefetch URLs](https://developers.cloudflare.com/speed/optimization/content/prefetch-urls/) is incompatible with custom cache keys** – Prefetch always uses the default key, so the two never match. Relevant if you were planning to use Prefetch to warm a release.
- **A maximum of 100 query string parameters** can go into a custom key, and headers you include count toward Cloudflare's [request size limits](https://developers.cloudflare.com/fundamentals/reference/connection-limits/#request-limits).
- **If you use [URL normalization](https://developers.cloudflare.com/rules/normalization/), also enable "Normalize URLs to origin".** Mismatched normalization between the key and the origin request is a cache-poisoning vector.
- **Changing your [SSL/TLS encryption mode](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/) busts the default key.** With the default key, `$scheme` is the *origin* scheme, so moving from Flexible to Full (or Off to Full) changes every key in the Zone and forces a complete re-fill.

To see which key was actually applied to a request, use [Cloudflare Trace](https://developers.cloudflare.com/rules/trace-request/) and expand **Cache Parameters → View parameter detail**.

A clean, stable cache key is also the precondition for the strategy in [Versioning Beats Purging](#versioning-beats-purging): if the artifact URL is immutable and the key ignores everything decorative, the cached object never needs to be invalidated at all.

### Size Limits: Two Different Numbers

Large files run into plan limits before they run into anything else, and the [two limits](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/#customization-options-and-limits) below are frequently mistaken for each other.

| | **FREE** | **PRO** | **BUSINESS** | **ENTERPRISE** |
| --- | --- | --- | --- | --- |
| **Max upload size** (request body *to* your origin) | 100 MB | 100 MB | 200 MB | Up to 5 GB (self-serve) |
| **Max cacheable file size** (response *stored* in cache) | 512 MB | 512 MB | 512 MB | 5 GB (default) |

**Uploads.** The **Maximum Upload Size** is adjustable from the zone's **Network** page; Enterprise customers can self-serve any value up to 5 GB, and anything beyond that needs your account team. Note that a very large upload can also fail on the [connection or read timeout](https://developers.cloudflare.com/fundamentals/reference/connection-limits/) *before* it reaches the size limit, which looks like an unrelated error. For publishing artifacts, prefer the [R2 S3 API](https://developers.cloudflare.com/r2/api/) with multipart uploads, or push through a DNS-only ([unproxied](https://developers.cloudflare.com/dns/proxy-status/#dns-only-records)) hostname (which essentially bypasses Cloudflare's application services completely).

**Downloads.** A file above the cacheable limit is not an error – it is served correctly, but it returns `CF-Cache-Status: BYPASS` and reads from the origin every time. If your game client is 8 GB and you have not requested an increase, **you have no CDN**, only a proxy.

> Where possible, **chunk large artifacts** into parts under the cacheable limit (many launchers and package managers already do this) and let the client reassemble. This caches far better than one monolithic object and makes failed downloads cheap to retry.

### Range Requests and Resumable Downloads

Resumability is what separates a tolerable 5 GB download from an infuriating one. Cloudflare supports HTTP range requests ([`206 Partial Content`](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/2xx-success/#206-partial-content)) **when the origin includes a `Content-Length` header** on the response. If your origin streams with `Transfer-Encoding: chunked` and no length, the full object is returned with a `200` instead, and interrupted downloads restart from zero.

This is not a hypothetical failure mode. Cloudflare's own [TCP connection guidance](https://developers.cloudflare.com/fundamentals/reference/tcp-connections/) is explicit that a connection is never guaranteed to survive: the default idle timeout toward clients is **400 seconds**, after which keep-alive probes are sent every 75 seconds and nine unanswered probes end the connection with an RST – and beyond idleness, "capacity balancing, data center maintenance or node restarts" could drop a connection at any time. A 40-minute download on a mobile network *could* eventually meet one of these. Applications, installers, and launchers should be built to reconnect and resume rather than restart.

Check for `accept-ranges: bytes` on your download URL. If it is missing, fix the origin before tuning anything else.

### Raising the Cache Hit Ratio

Once the file is eligible for cache, the goal is keeping it *in* cache.

| **FEATURE** | **WHAT IT DOES FOR BINARIES** |
| --- | --- |
| **[Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/)** | Adds upper-tier data centers between the edge and your origin, so a global release does not produce hundreds of independent origin pulls of the same 2 GB file. It also concentrates origin connections into a handful of locations. |
| **[Cache Reserve](https://developers.cloudflare.com/cache/advanced-configuration/cache-reserve/)** | A persistent store (built on R2) sitting above the edge cache. Regular edge cache evicts on a [Least Recently Used (LRU)](https://developers.cloudflare.com/cache/concepts/retention-vs-freshness/) basis – meaning a long-tail installer for an older version silently falls out. Cache Reserve gives it a 30-day retention window that resets on every request. |
| **[Argo Smart Routing](https://developers.cloudflare.com/argo-smart-routing/)** | Routes cache MISSes to origin over optimized paths. Matters most when your origin is far from where your users are. |
| **[Connection Reuse](https://developers.cloudflare.com/smart-shield/concepts/connection-reuse/)** | Keeps origin connections warm, avoiding a fresh TCP+TLS handshake per fill. |

These are now bundled under [Smart Shield](https://developers.cloudflare.com/smart-shield/): the base package includes Smart Tiered Cache and Connection Reuse, **Smart Shield + Argo** adds Argo Smart Routing, and **Smart Shield Advanced** adds Regional Tiered Cache and Cache Reserve.

**Picking a Tiered Cache topology.** Tiered Cache is off by default. Which topology you choose is a real trade-off for a globally distributed download, and the [CDN Reference Architecture](https://developers.cloudflare.com/reference-architecture/architectures/cdn/) spells it out:

| **TOPOLOGY** | **TRADE-OFF** |
| --- | --- |
| **[Smart Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/#smart-tiered-cache)** | One upper tier per origin, chosen by Argo routing data. Highest hit ratio and lowest origin load – but that single upper tier may sit a continent away from the lower tier asking for the file, adding latency to a MISS. |
| **[Generic Global](https://developers.cloudflare.com/cache/how-to/tiered-cache/#generic-global-tiered-cache)** | All large data centers act as upper tiers. Much closer to lower tiers, so faster fills – at the cost of more origin pulls, since each upper tier populates independently. |
| **[Regional Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/#regional-tiered-cache)** | Adds a regional hub between lower and upper tier. Keeps Smart Tiered Cache's single origin funnel while cutting the distance a MISS travels. Recommended alongside Smart or Custom – pointless with Generic Global. | 

For a worldwide launch of one large file, Smart Tiered Cache plus Regional Tiered Cache is usually the combination you want: one origin funnel, but a regional hub absorbing the long-haul latency.

**Two more Tiered Cache notes for this workload:**

- If your origin is on **AWS, GCP, Azure, or Oracle Cloud**, set a [cloud region hint](https://developers.cloudflare.com/cache/how-to/tiered-cache/#set-a-cloud-region-hint). Those providers front origins with anycast or regional unicast, which defeats the latency probing Smart Tiered Cache normally uses to pick an upper tier. This is exactly the shape of most artifact-hosting setups.
- **Changing origin IPs or DNS records reassigns upper tiers**, which produces a MISS spike while the new tiers refill. Do not do it the morning of a launch.

**Cache Reserve caveats worth knowing before you enable it**, since they bite binary workloads specifically:

- **Turn on Tiered Cache first.** Cache Reserve works without it, but Tiered Cache funnels (and often reduces) reads against Cache Reserve, cutting redundant read operations and duplicate storage. Since Cache Reserve is billed per operation, this is a direct cost difference, not a nicety – the dashboard warns you if you enable one without the other.
- Assets need a **freshness TTL of at least 10 hours** – so pair it with an Edge TTL override.
- Assets must have a **`Content-Length` response header**.
- **Origin range requests are not supported** from Cache Reserve.
- **Requests to an R2 public bucket linked to your zone's domain do not use Cache Reserve at all.** If your artifacts live in R2 behind a Custom Domain, Cache Reserve is not the tool – R2 is already the durable store, and [Tiered Cache](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/) is what you want in front of it. Cache Reserve earns its keep when the origin is somewhere you *pay egress to leave*.
- **Assets above the plan's cacheable file size never enter the standard edge cache**, so they hit Cache Reserve on every request and accumulate operations charges far faster than smaller objects. Assets over 1 GB also incur operations proportional to their size.
- Cache Reserve fetches **uncompressed** content from origin (it does not send `Accept-Encoding: gzip`), which is a non-issue for already-compressed binaries.

**One geography that is its own problem:** if a meaningful share of your users are in mainland China, none of the above changes the fact that they are downloading across a congested border. [China Network](https://developers.cloudflare.com/china-network/) provides in-China caching regardless of where the origin sits, and [Global Acceleration](https://developers.cloudflare.com/china-network/concepts/global-acceleration/) improves the origin-to-China leg.

Because Cache Reserve is priced per operation and per GB-month, scope it rather than enabling it for the whole Zone. The Cache Rule setting **Cache Reserve eligibility** takes a `minimum_file_size`, which lets you persist only the large artifacts that actually benefit:

```json
"action_parameters": {
  "cache": true,
  "cache_reserve": {
    "eligible": true,
    "minimum_file_size": 104857600  // 100 MB
  }
}
```

### Reading the Response

The response headers tell you everything. Here is an annotated example of a healthy binary download:

```http
HTTP/2 200
content-type: application/octet-stream          # generic binary stream
content-length: 140368659                       # 134 MB – required for ranges and Cache Reserve
content-disposition: attachment; filename="app-setup.exe"
accept-ranges: bytes                            # resumable downloads work
cache-control: public, max-age=2592000, immutable
etag: "85ddb13-1972fa6c2e9"
cf-cache-status: HIT                            # served from Cloudflare's cache
age: 40712                                      # seconds since it was cached at this edge
server: cloudflare
cf-ray: 94b8aa5b492f9156-FRA                    # FRA = Frankfurt; useful for support tickets and troubleshooting
```

Verify quickly:

```bash
curl -sIL https://<HOSTNAME>/downloads/2.4.1/app-setup.exe | grep -iE '^HTTP/|^content-(type|length):|^accept-ranges:|^cf-cache-status:|^age:'
```

Repeat the request from a second location. A `MISS` followed by a `HIT` is expected; two or more `MISS`es in a row, or a `DYNAMIC`/`BYPASS`, means a rule or a size/header problem. The full list of statuses and the exact conditions that produce a [`BYPASS` or `DYNAMIC`](https://developers.cloudflare.com/cache/concepts/cache-responses/) is documented, and [Investigate uncached responses](https://developers.cloudflare.com/cache/troubleshooting/investigating-uncached-responses/) walks through the diagnosis.

> One header discrepancy that confuses people reading logs: [`CacheResponseBytes`](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/zone/http_requests/#cacheresponsebytes) is the *uncompressed* size from cache or origin, while [`EdgeResponseBytes`](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/zone/http_requests/#edgeresponsebytes) is the *compressed* size sent to the client. For already-compressed binaries the two are usually close; for anything Cloudflare [compresses](https://developers.cloudflare.com/rules/compression-rules/) on the way out, they will not match. Refer to [edgeResponseBytes and cacheResponseBytes discrepancy](https://developers.cloudflare.com/cache/troubleshooting/edge-vs-cache-response-bytes/).

> While you are looking at [Compression Rules](https://developers.cloudflare.com/rules/compression-rules/): a ZIP, DMG, or ZST artifact is already compressed, so running it through Brotli or Gzip burns CPU on both ends for roughly zero saving. If you compress selectively by path or content type, exclude your download paths rather than leaving it to chance.

### Versioning Beats Purging

The cheapest cache invalidation is the one you never perform. Serve immutable, version-addressed paths for the artifacts themselves, and keep the mutable part in a redirect that never touches cache at all:

```txt
/downloads/2.4.1/app-setup.exe   →  the real object; cache-control: public, max-age=31536000, immutable
/downloads/latest/app-setup.exe  →  a Redirect Rule pointing at the current version
```

**How the `latest` pointer actually works.** It is not a cached file, and it should not be one. Make it a [Single Redirect](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/) (a Redirect Rule). Two properties make this the right tool:

1. **Redirect Rules run before Cache Rules.** In the [Rules execution order](https://developers.cloudflare.com/rules/url-forwarding/#execution-order), Single Redirects are evaluated first, and *Redirect* is a [terminating action](https://developers.cloudflare.com/ruleset-engine/rules-language/actions/) – evaluation stops there. The request never reaches cache, never reaches your origin, and never occupies a cache entry.
2. **Releasing is a rule edit, not a purge.** Point the rule at `2.4.2`, deploy, and every client worldwide follows the new target on its next request. There is nothing to invalidate, so there is no thundering herd against your origin and no purge rate limit to respect.

In the dashboard, use the wildcard interface:

- **Request URL**: `https://downloads.example.com/latest/*`
- **Target URL**: `https://downloads.example.com/2.4.1/${1}` (`${1}` is [wildcard replacement](https://developers.cloudflare.com/ruleset-engine/rules-language/functions/#wildcard_replace) for whatever the `*` matched)
- **Status code**: `302 Found`

> **Use 302 or 307, never 301 or 308, for a moving pointer.** A permanent redirect is cached indefinitely by browsers and by many package managers and CI runners, and you cannot purge someone else's browser cache. Users would keep downloading `2.4.1` long after you shipped `2.4.2`. (Cloudflare's own default Edge TTL reflects the same asymmetry: 120 minutes for a `301`, 20 minutes for a `302`.)

If you maintain many products, platforms, and channels, [Bulk Redirects](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/) can hold several thousands and even millions of static redirects at the account level instead.

**When you genuinely do need to purge**, [purge selectively](https://developers.cloudflare.com/cache/how-to/purge-cache/) – by URL, by prefix, by hostname, or by [cache tag](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-tags/). Set a `Cache-Tag` response header such as `product:installer,release:2.4.1` (no spaces; the aggregate header is capped at 16 KB, roughly 1,000 tags; Cloudflare strips it before the response reaches visitors or Workers), then drop the whole release with one call:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "prefixes": ["downloads.example.com/latest/"],
    "tags": ["release:2.4.0"]
  }'
```

Purges themselves are fast – Cloudflare's [decentralized purge architecture](https://blog.cloudflare.com/instant-purge-for-all/) propagates globally in roughly 150 ms – so the cost of a purge is almost never the purge, it is the re-fill that follows. Which is exactly why you should avoid "Purge Everything": it forces every asset in the Zone to be pulled from origin again, at whatever moment you happened to click it.

> Purge requests are [rate limited](https://developers.cloudflare.com/cache/how-to/purge-cache/#token-bucket-rate-limiting) per account (5 requests/minute on Free up to 50/second on Enterprise), and a single request accepts up to 100 operations for tag/prefix/host purges – 500 URLs per request for single-file purge on Enterprise. Batch accordingly rather than looping one call per file.
>
> If you use Cache Reserve, note the asymmetry: **purge by URL** clears it instantly, while purge by tag, prefix, host, or everything only forces a revalidation on the next request, and the object keeps accruing storage cost until its retention TTL expires.

### Release-Day Surges

A launch is a thundering herd against a cold cache. Several things help:

- **Request collapsing is already on your side.** When many requests for the same uncached object hit one data center simultaneously, Cloudflare takes a [cache lock](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/#request-collapsing): only the first request goes to origin, and the response is streamed to everyone waiting. You get this for free, but it operates *per data center* – which is precisely why Tiered Cache matters, since it collapses those N data centers down to one upper tier. Watch [`CacheLockWaitedMs`](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/zone/http_requests/#cachelockwaitedms) in Logpush/Log Explorer to see how long clients are queuing behind a fill.
- **Pre-warm the cache** by requesting the new artifacts from several regions before you flip the `latest` redirect. A useful quirk: once Cloudflare has started fetching from origin, it will finish and cache the object **even if the client disconnects midway**. You do not have to download 4 GB to warm an edge – you only have to start, and let it run. (If the visitor disconnects *before* the origin responds at all, nothing is cached.)
- **[Waiting Room](https://developers.cloudflare.com/waiting-room/)** in front of the download or licensing endpoint, to queue users instead of collapsing the origin.
- **Do not change origin DNS or SSL/TLS encryption mode near a launch** – both invalidate work you have already done, by reassigning Tiered Cache upper tiers and by changing every cache key respectively.

---

## Part 2 – Protected (Authenticated) Downloads

### Why the Default Answer Is "Not Cached"

Cloudflare deliberately refuses to cache things that look user-specific (often also referred to as dynamic). A response is treated as non-cacheable when the origin sends `Cache-Control: private`, `no-store`, `no-cache`, or `max-age=0`; when it sets a [`Set-Cookie` header](https://developers.cloudflare.com/cache/concepts/cache-behavior/#interaction-of-set-cookie-response-header-with-cache); when the method is anything other than `GET`; or – with [Origin Cache Control](https://developers.cloudflare.com/cache/concepts/cache-control/) enabled – when the request carries an `Authorization` header and the response is not explicitly marked `public`/`s-maxage`/`must-revalidate`.

That is the correct default. The catch is that a licensed 4 GB game client is *exactly the same bytes for every entitled user* – so serving it uncached because the request happened to carry a session cookie means paying full origin egress for content that is identical across your whole customer base.

The goal for gated downloads is therefore: **authorize at the edge, cache the shared bytes.**

The shape that makes this work is a pipeline, because WAF custom rules run *before* Cache Rules in the [request pipeline (phases)](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/):

```txt
User request  →  WAF (is this request entitled?)  →  Cache (have we got these bytes?)  →  R2 / origin
```

Invalid requests are rejected before they consume cache or origin resources, and valid requests all converge on one cached object. Cloudflare documents this pattern directly in [Control cache access with WAF and Snippets](https://developers.cloudflare.com/cache/interaction-cloudflare-products/waf-snippets/).

### The Options at a Glance

| **APPROACH** | **HOW IT WORKS** | **BEST FOR** |
| --- | --- | --- |
| **[WAF Token Authentication (HMAC)](https://developers.cloudflare.com/waf/custom-rules/use-cases/configure-token-authentication/)** | Your app signs a time-limited token into the URL; a WAF Custom Rule validates it at the edge with `is_timed_hmac_valid_v0()`. No origin round trip. | One-time purchasers, licence-key downloads, time-limited share links. |
| **[R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)** | Your backend issues a short-lived, AWS SigV4-signed URL for a private R2 object. | Private objects, per-customer artifacts, "download expires in 15 minutes" flows. |
| **[Workers](https://developers.cloudflare.com/workers/) / [Snippets](https://developers.cloudflare.com/rules/snippets/)** | Validate anything (JWT, session, entitlement API, Basic Auth) in code, then serve from R2 or [`fetch()`](https://developers.cloudflare.com/workers/runtime-apis/fetch/), with [Workers Cache](https://developers.cloudflare.com/workers/cache/) in front. | Logged-in users, entitlement checks, per-tier content. The most flexible and customizable option. |
| **[API Shield JWT Validation](https://developers.cloudflare.com/api-shield/security/jwt-validation/)** | Cloudflare cryptographically verifies JWTs at the edge and exposes claims to rules via `is_jwt_valid()`. | Mobile apps and SPAs that already present JWTs. Tokens must be in headers or cookies. |
| **[Access (ZTNA)](https://developers.cloudflare.com/cloudflare-one/access-controls/)** | Identity-, device-, or service-based policies in front of the download host. | Employees, partners, and machine-to-machine via [service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) or mTLS. |

### Option 1: HMAC Tokens (No Origin Round Trip)

Your application generates a signed, expiring URL; the edge validates it before anything reaches your origin or bucket:

```txt
# WAF Custom Rule – action: Block
(http.host eq "downloads.example.com"
 and starts_with(http.request.uri.path, "/protected/")
 and not is_timed_hmac_valid_v0("<SECRET>", http.request.uri, 10800, http.request.timestamp.sec, 8))
```

Cloudflare's recommended split is to **sign in [Snippets](https://developers.cloudflare.com/rules/snippets/examples/signing-requests/) or Workers and validate in a WAF custom rule** – the two implementations are compatible, and validation in the WAF keeps the check ahead of cache.

Three things to get right:

1. **Scope the rule to cover every path you mean to protect.** A narrowly scoped expression is a bypass waiting to happen – if it only matches one directory or one parameter shape, requests that miss the pattern sail straight through.
2. **The token must be the last query string parameter**, and its Base64 `mac` must be URL-encoded unless you pass the `'s'` flag for the URL-safe character set.
3. **Combine this with a Cache Rule whose cache key ignores the token parameter (within the `query_string`)** – otherwise every user's unique token creates a separate cache entry and your hit ratio collapses to zero. See [Keeping Authorization Out of the Cache Key](#keeping-authorization-out-of-the-cache-key).

### Option 2: R2 Presigned URLs

Best when the artifact lives in a private R2 bucket and your backend already knows who is entitled to it:

```js
import { AwsClient } from "aws4fetch";

const r2 = new AwsClient({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
});

const url = new URL(
  `https://${bucket}.${accountId}.r2.cloudflarestorage.com/releases/2.4.1/app-setup.msi`
);
url.searchParams.set("X-Amz-Expires", "900"); // 15 minutes

const signed = await r2.sign(new Request(url, { method: "GET" }), {
  aws: { signQuery: true },
});
// signed.url → hand this to the entitled client
```

Practical notes:

- Expiry ranges from **1 second to 7 days**; `GET`, `HEAD`, `PUT`, and `DELETE` are supported (HTML form `POST` is not).
- **Presigned URLs work against the S3 API endpoint and cannot be used with R2 Custom Domains** – which also means they are not served through your Zone's cache or WAF. If you need both edge caching *and* signed access, use the HMAC or Workers approach against a Custom Domain instead.
- **Treat a presigned URL as a bearer token.** Anyone holding it can use it until it expires. Keep lifetimes short and scope them to a single object.

### Option 3: Workers – Authorize Once, Cache the Bytes

The most flexible pattern, and the one that solves the "identical bytes, different users" problem. A gateway entrypoint authenticates every request, then delegates to a cached inner entrypoint. The critical detail: **strip the `Authorization` header before the internal call**, otherwise Cloudflare's standard [bypass conditions](https://developers.cloudflare.com/cache/concepts/cache-responses/#bypass) turn every inner request into a `BYPASS` and nothing is ever stored. (`Set-Cookie` on the response does the same thing, which is why the gateway drops the cookie too.)

**This pattern depends on [Workers Cache](https://developers.cloudflare.com/workers/cache/), and it is off unless you turn it on.** Add a `cache` block to your Wrangler configuration (Wrangler 4.69.0+):

```jsonc
{
  "name": "downloads-gateway",
  "main": "src/index.js",
  "compatibility_date": "2026-09-06",
  "cache": {
    "enabled": true,
    "cross_version_cache": true
  }
}
```

Then the gateway:

```js
import { WorkerEntrypoint } from "cloudflare:workers";

export default {
  async fetch(request, env, ctx) {
    // 1. Authorize – JWT, session lookup, entitlement API, licence check...
    if (!(await isEntitled(request, env))) {
      return new Response("Forbidden", { status: 403 });
    }

    // 2. Normalize: the cached artifact is identical for every entitled user
    const forwarded = new Request(request);
    forwarded.headers.delete("Authorization");
    forwarded.headers.delete("Cookie");

    return ctx.exports.CachedArtifact.fetch(forwarded);
  },
};

export class CachedArtifact extends WorkerEntrypoint {
  async fetch(request) {
    const key = new URL(request.url).pathname.slice(1);
    const object = await this.env.RELEASES.get(key, {
      range: request.headers, // preserve range requests for resumability
    });
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=2592000, immutable");
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");

    return new Response(object.body, {
      status: object.range ? 206 : 200,
      headers,
    });
  }
}
```

Because the Worker streams the R2 object body rather than buffering it, this works for very large files, and it keeps the authorization decision entirely at the edge.

Four things about [Workers Cache](https://developers.cloudflare.com/workers/cache/) that change how you should read the rest of this article (and see [Three Caches, Not One](#three-caches-not-one) below for how it differs from the Cache API):

- **No zone cache configuration applies.** Cache Rules, Cache Response Rules, Page Rules, cache levels, the default extension list – none of them touch a Worker's cache. Everything from [Part 1](#part-1--public-non-authenticated-downloads) about configuring cache behavior through rules stops at the Worker boundary. Your `Cache-Control` headers and `ctx.props` *are* the configuration surface.
- **Tiering and request collapsing are automatic.** Workers Cache is tiered by default with no setting to enable, and it collapses concurrent requests for the same key – including *streaming* responses, where waiting clients are joined to the in-flight body rather than waiting for it to complete. For a release-day spike on a 4 GB file, that is exactly the behavior you want.
- **The Worker version is part of the cache key by default**, so every deployment starts from an empty cache. On a library of multi-gigabyte artifacts that is an expensive way to ship a one-line change, which is why [`cross_version_cache: true`](https://developers.cloudflare.com/workers/cache/configuration/#cross-version-caching) (Wrangler 4.107.0+) is in the config above. The trade-off is that a deploy no longer invalidates anything – you purge with [`ctx.cache.purge()`](https://developers.cloudflare.com/workers/cache/purge/) or a `Cache-Tag` instead.
- **The host is not in the cache key** – only the path, query string, target entrypoint, and `ctx.props`. The placeholder hostname on an internal `fetch()` is irrelevant, but a token left in the query string still shards the cache, so normalize the URL in the gateway before dispatching.

> Only `fetch()` invocations are cached. Custom RPC methods (`ctx.exports.Backend.getObject(key)`) always run the callee – which is why the inner entrypoint above exposes a `fetch` handler rather than a method.

> [Snippets](https://developers.cloudflare.com/rules/snippets/when-to-use/) can handle the lighter version of this – header manipulation, redirects, JWT checks – on Pro and above (not Free), within tighter limits: 5 ms execution, 2 MB memory, and a 32 KB package.

### Three Caches, Not One

Once a Worker is in the path, "the cache" stops being a single thing. There are three, they are independent, and they are routinely confused.

| | **WHERE IT SITS** | **HOW YOU CONFIGURE IT** | **TIERED?** | **COLLAPSES REQUESTS?** |
| --- | --- | --- | --- | --- |
| **Zone cache** ([Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)) | In front of your **origin** | Cache Rules, Cache Response Rules, zone settings | Yes, if you enable [Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/) | Yes |
| **[Workers Cache](https://developers.cloudflare.com/workers/cache/)** | In front of your **Worker** | `cache.enabled` in Wrangler + the `Cache-Control` your Worker returns | Yes, automatically | Yes, including streaming bodies |
| **[Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)** (`caches.default`) | **Inside** your Worker, called by hand | `cache.match()` / `cache.put()` / `cache.delete()` in code | **No** | **No** |

All of Part 1 is about the first one. It is also the cache a Worker's *outbound* `fetch()` passes through – so a Worker that proxies to a traditional origin still benefits from your Cache Rules and Tiered Cache on that leg.

**Workers Cache and the Cache API are not the same feature**, despite both living under Workers and both talking about "cache":

- **Workers Cache is read-through.** On a hit, your Worker never runs. You declare intent with `Cache-Control` and Cloudflare does the rest.
- **The Cache API is a manual key-value store.** Your Worker runs on *every* request, and nothing is stored unless you explicitly call `put()`. Operations on one have no effect on the other.

For large binaries, three Cache API limitations matter enough to settle the choice:

1. **`cache.put()` throws on a `206 Partial Content` response.** You cannot store a range response, which is most of the traffic on a resumable multi-gigabyte download.
2. **It is local to one data center.** A `put()` in Frankfurt is invisible in São Paulo, and it does not participate in Tiered Cache at all. Every data center pays its own origin fill.
3. **It does not collapse concurrent requests**, so a release-day burst on a cold URL invokes your Worker once per request rather than once.

`cache.put()` also returns a `413` when the response is too large, and `stale-while-revalidate` / `stale-if-error` are ignored by both `put()` and `match()`.

So: **prefer Workers Cache for new Workers.** Reach for the Cache API only when you need to cache something you generated rather than fetched, and can live with a per-data-center store.

> A purge gotcha specific to this section: when a Worker caches an asset through an outbound `fetch()`, the cached object is keyed by the URL **in the fetch request**, not the URL the end user typed. If your Worker on `downloads.example.com/app.exe` fetches `origin.internal/app.exe`, single-file purge has to target `origin.internal/app.exe`. Workers Cache entries are purged separately again, with [`ctx.cache.purge()`](https://developers.cloudflare.com/workers/cache/purge/).

### Fixing an Uncooperative Origin with Cache Response Rules

Sometimes the origin insists on sending `Set-Cookie` or `Cache-Control: no-cache` on a download response that is perfectly shareable. [Cache Response Rules](https://developers.cloudflare.com/cache/how-to/cache-response-rules/) ([announcement](https://blog.cloudflare.com/introducing-cache-response-rules/)) let you rewrite that at the edge, before the response reaches cache – strip `Set-Cookie`, `ETag`, or `Last-Modified`, modify `Cache-Control` directives, or send a different `Cache-Control` downstream to browsers than the one Cloudflare uses internally. Available on all plans (10 rules on Free, up to 300 on Enterprise).

They run in the `http_response_cache_settings` phase, *after* the origin responds, and they **take precedence over Cache Rules** when the two disagree. They also apply to responses that are not cacheable at all, which is what makes them the right tool for stripping a `Set-Cookie` your origin insists on sending.

> Strip `Set-Cookie` only when you are certain the cookie is not user-specific. Caching a response that carries someone's session cookie and serving it to the next visitor is a textbook cache-poisoning incident.

### Keeping Authorization Out of the Cache Key

For gated downloads, the [cache key](https://developers.cloudflare.com/cache/how-to/cache-keys/) is where hit ratios go to die. Everything from [Cache Keys: What Actually Identifies Your File](#cache-keys-what-actually-identifies-your-file) applies here, with one addition that dominates: anything per-user in the key – a token, a session cookie, a signature parameter – shards the cache into one entry per user. With HMAC or presigned links, *every single request* carries a unique parameter, so the default key gives you a 0% hit ratio on a multi-gigabyte object.

**Rule of thumb: authorization determines *whether* the request is served; it must not be part of *what* is cached.**

In practice that means one Cache Rule matching your protected paths, with the Cache Key set to exclude the authorization parameters:

```json
"action_parameters": {
  "cache": true,
  "edge_ttl": { "mode": "override_origin", "default": 2592000 },
  "cache_key": {
    "custom_key": {
      "query_string": { "exclude": ["token", "verify", "expires"] }
    }
  }
}
```

Two constraints to plan around:

- Query-string include/exclude and the header/cookie/host/user components are **Enterprise** capabilities. On lower plans, the practical equivalent is **Ignore query string** (all plans) combined with putting the token somewhere that is not part of the key – or doing the normalization in a Worker, as in Option 3.
- `exclude` takes literal parameter names; the only wildcard it understands is `"*"`, meaning *all* parameters. There is no `X-Amz-*` style prefix match – and presigned-URL parameters never reach your zone's cache anyway, since presigned URLs only work against the S3 endpoint.
- Purge by tag, host, or prefix is unaffected by a custom key. Purge *by URL* has to repeat the query strings and headers that make up the key, so drive it from the API rather than the dashboard.

---

## Observability

You cannot tune what you cannot see.

- **[Cache Analytics](https://developers.cloudflare.com/cache/performance-review/cache-analytics/)** – break down requests by cache status, then by Content-Type and URI path to find which artifacts are missing.
- **[Origin Analytics](https://developers.cloudflare.com/speed/origin-analytics/)** – the other half of Cache Analytics: what your origin did with the MISSes. Agentless, derived from edge logs, and built around three things you want here. **Origin response time** at P50/P95/P99 is drawn against your zone's configured origin timeout, so you can watch a slow release server approach a `524` instead of discovering it during a launch. **Origin status codes** show `originResponseStatus` next to `edgeResponseStatus`, which is how you tell a genuine origin `503` from a `520` caused by an origin that closed the connection mid-response – the characteristic failure when streaming a multi-gigabyte body (an origin that never answered shows as `0`). **Top endpoints** ranks paths by P95, error rate, volume, or TCP failure rate, which is usually enough to find the one artifact that is dragging.
- **[Logpush](https://developers.cloudflare.com/logs/logpush/) / [Log Explorer](https://developers.cloudflare.com/log-explorer/)** – the [HTTP requests dataset](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/zone/http_requests/) carries the fields that matter here: `CacheCacheStatus`, `CacheTieredFill`, `CacheReserveUsed`, `CacheLockWaitedMs`, `EdgeTimeToFirstByteMs`, `CacheResponseBytes`, `OriginResponseDurationMs`. Add [Custom Log Fields](https://developers.cloudflare.com/logs/logpush/logpush-job/custom-fields/) if you need specific request or response headers alongside them.
- **The two numbers to derive from those logs** are **Download Success Rate** and **Download Throughput** – the metrics Cloudflare's own performance architecture names for large files. Neither exists as a dashboard tile; both fall out of Logpush once you have the fields above. A hit ratio of 98% means little if a third of those downloads never finished. This is also the gap Origin Analytics cannot close on its own: its clock stops when Cloudflare receives the origin's **response headers**, not the last byte of the body – so a 4 GB transfer that stalls at 80% still looks like a fast origin.
- **[Network Error Logging (NEL)](https://developers.cloudflare.com/network-error-logging/)** – captures client-side connectivity failures the server never sees. For a workload where the characteristic failure is *an aborted 40-minute transfer*, this is the one signal that would otherwise be invisible.
- **[Instant Logs](https://developers.cloudflare.com/logs/instant-logs/)** – live tail while you test a new Cache Rule.
- **[Cloudflare Trace](https://developers.cloudflare.com/rules/trace-request/)** – replay a single URL through the rules pipeline to see which Redirect Rule, Cache Rule, and cache key actually applied. The fastest way to settle "why is this a MISS?", and the only practical way to reason about [stacked Cache Rules](#cache-rules-stack-and-the-last-match-wins).
- **[GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)** – for scripted reporting on `httpRequestsAdaptiveGroups`; the [Cloudflare Prometheus Exporter](https://github.com/cloudflare/cloudflare-prometheus-exporter) scrapes it into Grafana if you want hit ratio tracked next to your own infrastructure metrics.
- **[R2 event notifications](https://developers.cloudflare.com/reference-architecture/diagrams/storage/event-notifications-for-storage/)** – trigger a Worker (virus scan, checksum, index update, cache pre-warm) whenever a new artifact lands in the bucket.

> Use an [Agent Setup](https://developers.cloudflare.com/agent-setup/) and leverage Cloudflare's MCP Server to help with troubleshooting and more.

One more operational detail: the [proxy read timeout](https://developers.cloudflare.com/fundamentals/reference/connection-limits/) between Cloudflare and your origin is 125 seconds by default. A slow origin streaming a very large file can hit it and return a `524` – which is exactly the line Origin Analytics draws on its response-time chart. Enterprise customers can raise it per-path with the **Proxy Read Timeout** Cache Rule setting ([`read_timeout`](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/#proxy-read-timeout-enterprise-only)), but the better answer is usually to serve artifacts from R2 rather than a busy application server.

## Quick-Start Checklist

1. **Confirm what is actually cached.** `curl -sI` your top download URLs and look at `cf-cache-status`. Anything other than `HIT` on a second or third request needs investigation.
2. **Create an explicit Cache Rule** for your download paths – never rely on the default extension list, especially for `.msi`, `.pkg`, `.deb`, `.rpm`. Set a long Edge TTL; the default for an uncontrolled `200` is only two hours.
3. **Audit every other Cache Rule that matches those paths.** Rules stack and the last match wins – one broad legacy "bypass" rule sitting below yours silently cancels it. Verify with Cloudflare Trace, not by reading the list.
4. **Set the Cache Key deliberately.** Ignore query strings on versioned artifacts so campaign and mirror parameters do not shard one object into many.
5. **Check the file sizes against your plan's cacheable limit** – and do not confuse it with the maximum upload size. Chunk, or request an increase, if you are above it.
6. **Verify `Content-Length` and `accept-ranges: bytes`** are present so downloads are resumable and Cache Reserve is possible.
7. **Enable Tiered Cache** (set a cloud region hint if your origin is on a public cloud), then evaluate Cache Reserve for long-tail artifacts on non-R2 origins.
8. **Move to versioned, immutable URLs**, and make `latest` a 302 Redirect Rule rather than a cached file.
9. **For gated files, authorize at the edge** (HMAC, JWT, Workers, or Access) and keep the authorization material *out of the cache key*. If you serve them from a Worker, remember zone Cache Rules do not apply – enable Workers Cache in your Wrangler config instead.
10. **Wire purging into CI/CD** with batched, prefix- or tag-based calls.
11. **Instrument it** – Cache Analytics for the ratio, Logpush for Download Success Rate and Throughput, NEL for the failures clients never report, Cloudflare Trace for the one-off mystery, and alerts on regressions.

## Further Reading

- [Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/) and [cache responses / status values](https://developers.cloudflare.com/cache/concepts/cache-responses/)
- [Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/) – the full list of what a Cache Rule can change, and [Order and priority](https://developers.cloudflare.com/cache/how-to/cache-rules/order/) – how stacked rules resolve
- [Workers Cache](https://developers.cloudflare.com/workers/cache/) – the read-through cache in front of a Worker, which zone cache settings do not reach – and the [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/), the separate, manual, per-data-center store
- [How the cache works](https://developers.cloudflare.com/workers/reference/how-the-cache-works/) – how `fetch()`, the Cache API, and the zone cache interact from inside a Worker
- [Enable cache in an R2 bucket](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/) and [Control cache access with WAF and Snippets](https://developers.cloudflare.com/cache/interaction-cloudflare-products/waf-snippets/)
- [Investigate uncached responses](https://developers.cloudflare.com/cache/troubleshooting/investigating-uncached-responses/) – a troubleshooting path for unexpected MISS/BYPASS/DYNAMIC
- [TCP connections](https://developers.cloudflare.com/fundamentals/reference/tcp-connections/) – keep-alives, idle timeouts, and why long transfers need to resume
- [China Network](https://developers.cloudflare.com/china-network/) – in-China caching, if that is where your users are
- [Storing user-generated content](https://developers.cloudflare.com/reference-architecture/diagrams/storage/storing-user-generated-content/) – reference architecture
- [Designing a distributed web performance architecture](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/distributed-web-performance-architecture/)
- [Content delivery network reference architecture](https://developers.cloudflare.com/reference-architecture/architectures/cdn/)
- [Developer Platform storage options](https://developers.cloudflare.com/workers/platform/storage-options/) – R2 vs. KV vs. D1 vs. Durable Objects, or [Artifacts](https://blog.cloudflare.com/artifacts-git-for-agents-beta/)
- [Cloudflare Stream](https://developers.cloudflare.com/stream/) – if what you are actually delivering is video, use Stream rather than treating it as a binary blob
- [Cloudflare Images](https://developers.cloudflare.com/images/) – likewise for images

## Security Matters Too!

For application security recommendations, see: [General Application Security Recommendations](/articles/cloudflare-l7-security-recommendations/).

---

## Disclaimer

Educational purposes only.

This blog post is independently created and is not affiliated with, endorsed by, or necessarily representative of the views or opinions of any organizations or services mentioned herein.

Limits, plan availability, and pricing referenced in this article reflect Cloudflare's public documentation at the time of writing and change over time – always verify against the [Cloudflare Developer Documentation](https://developers.cloudflare.com/) before relying on a specific number.

The guidelines provided in this post are intended for general educational purposes. They should be customized to fit your specific use cases and tech stack. You are responsible for configuring settings according to your unique requirements, and it is important to understand their potential impact. The code examples are illustrative and are not production-ready as written.

The author of this post is not responsible for any misconfigurations, errors, or unintended consequences that may arise from implementing the guidelines or recommendations discussed herein. You assume full responsibility for any actions taken based on this content and for ensuring that configurations are appropriate for your specific environment.
