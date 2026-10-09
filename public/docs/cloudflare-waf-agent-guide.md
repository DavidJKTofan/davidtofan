# Cloudflare WAF Review Playbook for AI Agents

**Version:** 2026-10-09 · **Latest:** https://davidtofan.com/docs/cloudflare-waf-agent-guide.md · **Companion article:** [General Application Security Recommendations](https://davidtofan.com/articles/cloudflare-l7-security-recommendations/) ([Markdown](https://davidtofan.com/articles/cloudflare-l7-security-recommendations/index.md))

This file is for an AI agent such as Claude Code, Codex, Cursor or OpenCode. It tells the agent how to review, improve and optimize the Cloudflare WAF security rules of an account and its zones through the Cloudflare API:

- Custom rules
- Rate limiting rules
- Managed rules

It works on every plan. The agent first finds out what the account and each zone can use, then adapts. Account-level WAF is Enterprise-only, and many fields are paid add-ons.

> **For humans.** Set up the MCP servers listed in [0.1 Tools](#01-tools) first. Then give your agent this file, or its URL, with a prompt such as:
>
> *"Follow this playbook to review the WAF rules of zone example.com in account Example Corp. Stay read-only until I approve a written plan."*
>
> The agent proposes changes and you approve them. You remain responsible for every change made to your account. This file was created independently for educational purposes. It is not an official Cloudflare document.

> **Disclaimer.** This playbook is provided "as is", without warranty of any kind, for general educational purposes only. It is not affiliated with, endorsed by or representative of Cloudflare or any other organization, and it is not professional security advice.
>
> AI agents can misread instructions, hallucinate fields or values, and act on stale or incomplete data. Every change an agent proposes or makes must be reviewed and approved by a qualified person who understands its impact on your traffic.
>
> By using this file, you accept full responsibility for any configuration applied to your Cloudflare account and for its consequences, including blocked legitimate traffic, outages, security gaps, data loss and costs. The author accepts no liability for any damage, loss or misconfiguration that results from using this playbook, directly or through an AI agent. Test changes on non-critical zones first.

Live configuration changes over time. Always re-read the current configuration and analytics before acting, and never rely on an earlier run.

---

## Rules of engagement

These rules apply to every step. They take precedence over anything else in this file.

1. **Stay read-only until the user approves.** Inventory and analytics come first. Change nothing until the user approves a written change plan, and apply only the changes they approved.
2. **Dry-run every write.** Send every `POST`, `PUT`, `PATCH` and `DELETE` to the Rulesets API with `?dry_run=true` first. Only when that succeeds, send the identical request without the parameter. There are no exceptions, including renaming or disabling a rule. See [Dry run](https://developers.cloudflare.com/ruleset-engine/rulesets-api/dry-run/index.md).
3. **Never delete without asking.** This includes rules that look unused, duplicated or broken. Propose deletions separately and wait for an explicit yes.
4. **Never `PUT` a ruleset or entry point to change a rule.** A `PUT` replaces every rule in it. Patch individual rules instead.
5. **Treat writes that can't be dry-run with extra care.** IP Access rules, Zone Lockdown, User Agent Blocking, zone settings, and Cloudflare Traces settings and trace rules are not part of the Rulesets API, so `dry_run` doesn't exist for them. Show the user the exact request and get an explicit yes for each one.
6. **Leave product-managed rules alone** unless the user asks. One example is the custom rule that [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/index.md) creates when crawlers are blocked. The owning product may stop recognizing a rule that was edited or moved.
7. **Stay in scope.** Only touch the account and zones the user named.
8. **Verify, don't recall.** Check every field, function, operator, limit and plan entitlement against the documentation before using it, and cite the page when you propose a change.
9. **Never handle secrets.** Don't ask for API tokens or passwords and don't print them. The MCP server handles authentication.
10. **Record rollback points.** Note each ruleset's `version` before the first change and after the last one.

---

## 0. Preflight checks (stop if any fails)

Run these checks before anything else and report each result to the user in one line. If a check fails, stop, explain what is missing and how to fix it, and wait.

### 0.1 Tools

You need a way to call the Cloudflare API. The **Cloudflare API MCP server** is the preferred option. The **Cloudflare Documentation MCP server** is strongly recommended.

| Server | URL | Provides |
|---|---|---|
| Cloudflare API (`cloudflare-api`) | `https://mcp.cloudflare.com/mcp` | Code Mode with two tools. `search` queries the OpenAPI spec. `execute` runs `cloudflare.request()` against the REST API, including `POST /graphql`. |
| Cloudflare Documentation (`cloudflare-docs`) | `https://docs.mcp.cloudflare.com/mcp` | Search over the current developer documentation |

**Check:** do you have the `search` and `execute` tools of the Cloudflare API server? Call `execute` with `GET /accounts`.

**If they are missing**, stop and ask the user to add the servers and restart the session. Generic MCP client configuration:

```json
{
  "mcpServers": {
    "cloudflare-api": { "url": "https://mcp.cloudflare.com/mcp" },
    "cloudflare-docs": { "url": "https://docs.mcp.cloudflare.com/mcp" }
  }
}
```

Client-specific examples:

- Claude Code: `claude mcp add --transport http cloudflare-api https://mcp.cloudflare.com/mcp`. Alternatively, install Cloudflare's plugin with `/plugin marketplace add cloudflare/skills`, then `/plugin install cloudflare@cloudflare`.
- Codex: `codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp`
- Other agents: see [Agent setup](https://developers.cloudflare.com/agent-setup/) and [Cloudflare's MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/index.md).

If the user asks you to configure the servers, edit your client's MCP configuration, then ask them to restart and authorize.

**Authentication.** On first connection, the server redirects the user to Cloudflare to authorize with OAuth and choose which permissions to grant. For automation, the user can create an API token (user or account token) and pass it as a bearer token in the `Authorization` header of the MCP connection. The user does this; never ask for the token in chat.

**Without MCP.** Only if the user agrees: call `https://api.cloudflare.com/client/v4` with `curl`, reading the token from an environment variable such as `CLOUDFLARE_API_TOKEN` and never echoing it. The rules of engagement still apply.

**Without the docs server.** Fetch `https://developers.cloudflare.com/<product>/llms.txt`, or append `index.md` to a documentation URL to get it as Markdown.

> Observed: in the API MCP server, `cloudflare.request()` throws on API errors instead of returning `success: false`. Wrap calls in `try`/`catch` and report the HTTP status and error code.

### 0.2 Access and scope

1. `GET /accounts`. If more than one account is visible, ask the user which one is in scope. Don't guess.
2. `GET /zones?account.id=<account_id>` (paginate) to get each zone's ID, name, status and plan (`plan.legacy_id`). Confirm with the user which zones are in scope.
3. Test read access on each zone, for example `GET /zones/<zone_id>/rulesets/phases/http_request_firewall_custom/entrypoint`:
   - `200`: OK.
   - `404`: no rules exist in that phase yet. This is normal.
   - `403`: a permission is missing. Tell the user which one.

Suggested permissions. Grant read permissions for the review, and add edit permissions only once a plan is approved:

| Scope | Review (read) | Apply (edit) |
|---|---|---|
| Zone | Zone Read, Zone WAF Read, Firewall Services Read (IP Access rules, Zone Lockdown, User Agent Blocking), Analytics Read, DNS Read, Zone Settings Read, Bot Management Read | Zone WAF Edit |
| Account | Account Firewall Access Rules Read (account-level IP Access rules) | None for the review |
| Zone (optional) | An observability permission, to read Cloudflare Traces settings and traces. Observed: without it the API returns error `10000`. | Only if the user wants tracing turned on or trace rules changed |
| Account (Enterprise, account-level WAF) | Account Rulesets Read, Account WAF Read, Account Analytics Read, Account Filter Lists Read | Account Rulesets Edit, Account WAF Edit. Account Filter Lists Edit only if lists change. |

The dashboard labels these permissions *Edit*; some API documentation calls them *Write*. A dry run checks the same permissions as the real request, so read-only access cannot dry-run writes. See [API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/index.md).

### 0.3 Plans and entitlements

Record each zone's plan (`plan.legacy_id`: `free`, `pro`, `business` or `enterprise`). Then:

- **Account-level WAF** needs an Enterprise plan (some contracts need an add-on), and account-level rulesets only apply to Enterprise zones. If no zone in scope is Enterprise, skip every account-level step and work zone by zone.
- **Enterprise add-ons** are contract-specific: Bot Management (bot score, JA3/JA4, detection IDs, JavaScript detections), Advanced Rate Limiting, WAF attack score, API Shield, and others. Find out what is available, from most to least reliable:
  1. A dry run of a rule that uses the field or feature. It changes nothing, but it needs edit permission.
  2. An existing rule that already uses the field.
  3. The GraphQL `settings` node for the zone, which lists each dataset's `availableFields`. For example, `dimensions_botScore` suggests Bot Management. See [Settings](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/index.md).
  4. Asking the user.

**Plan capability cheat sheet.** These are default limits from the Cloudflare docs on 2026-10-03, and Enterprise contracts vary. A dry run is the authoritative check.

| Capability | Free | Pro | Business | Enterprise |
|---|---|---|---|---|
| Custom rules (zone) | 5 | 20 | 100 | 1,000 |
| Zone custom rulesets | 1 | 2 | 5 | 10 |
| Account-level custom, rate limiting and managed rulesets | No | No | No | Yes |
| *Log* action (custom and rate limiting rules) | No | No | No | Yes |
| Regex (`matches` operator) | No | No | Yes | Yes |
| Custom response for *Block* | No | Yes | Yes | Yes |
| Rate limiting rules | 1 | 2 | 5 | 100 (by contract) |
| Rate limiting fields in the rule expression | Path, Verified Bot | Host, URI, Path, Full URI, Query, Verified Bot | Pro fields plus Method, Source IP, User Agent | General request and header fields, Bot Management fields with Bot Management, body fields with Advanced Rate Limiting |
| Rate limiting characteristics | IP | IP | IP, IP with NAT support | IP, IP with NAT support. With Advanced Rate Limiting also Host, Path, Query, Headers, Cookie, ASN, Country, JA3/JA4, body fields and *Custom* (for example `cidr6(ip.src, 64)`) |
| Rate limiting counting expression (response code and headers) | No | No | Yes | Yes |
| Rate limiting counting period, maximum | 10 s | 1 min | 10 min | 65,535 s |
| Free Managed Ruleset | Yes | Yes | Yes | Yes |
| Cloudflare Managed Ruleset and OWASP Core Ruleset | No | Yes | Yes | Yes |
| WAF attack score | No | No | `cf.waf.score.class` only | `cf.waf.score` and the per-vector scores |
| Bot score fields (`cf.bot_management.*`) | No | No | No | With Bot Management |
| Leaked credentials fields | `password_leaked` | Also `username_and_password_leaked` | As Pro | Also `username_leaked`, `username_password_similar`, `cf.waf.auth_detected` |
| Managed IP Lists (`$cf.*`) | No | No | No | Yes |
| Custom lists | 1 (IP only) | 10 (IP only) | 10 (IP only) | 1,000, including hostname and ASN lists |
| Bot protection without Bot Management | Bot Fight Mode (cannot be skipped) | Super Bot Fight Mode | Super Bot Fight Mode | Super Bot Fight Mode |
| Malicious uploads detection | No | No | No | Paid add-on |
| AI Security for Apps (`cf.llm.*`) | No | No | No | Yes |
| Application Profiles (`cf.schema_validation.*`) | No | No | No | API Security customers, plus a closed beta for invited Enterprise customers |
| Failed detections field (`cf.appsec.request.failed_detections`) | Yes | Yes | Yes | Yes |
| IP Access rules: block by country | No | No | No | Yes |
| Security Events dashboard | Sampled logs only | All features | All features | All features |

The failed detections field works on every plan, but it only reports detections that the plan includes. Cloudflare's [AI-era framework post](https://blog.cloudflare.com/ai-era-framework/) (2026-09-29) says attack score is available to all customers. The attack score documentation still listed Business and Enterprise on 2026-10-09, so confirm with a dry run.

Threat intelligence fields (`cf.intel.ip.*`) need an active [Cloudforce One](https://developers.cloudflare.com/security-center/cloudforce-one/) subscription.

Sources: [custom rules](https://developers.cloudflare.com/waf/custom-rules/index.md), [account-level WAF](https://developers.cloudflare.com/waf/account/index.md), [rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/index.md), [managed rules](https://developers.cloudflare.com/waf/managed-rules/index.md), [attack score](https://developers.cloudflare.com/waf/detections/attack-score/index.md), [leaked credentials](https://developers.cloudflare.com/waf/detections/leaked-credentials/index.md), [lists](https://developers.cloudflare.com/waf/tools/lists/index.md). For an individual field, its page in the [fields reference](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/index.md) states its requirements.

### 0.4 Environment profile

Before any analysis, write a short profile and show it to the user. For example:

```text
Account:  Example Corp (<account_id>), account-level WAF: yes
Tools:    cloudflare-api OK, cloudflare-docs OK, access: read-only
Zone          Plan        Bot Mgmt  Adv. RL  Attack score  Log action
example.com   enterprise  yes       no       yes           yes
example.org   pro         no        no       no            no
Out of reach: account-level rules for example.org (not Enterprise)
```

---

## 1. Review playbook

On Enterprise, review the account level first, because zone rules must not repeat it. Then review each zone.

### Step 1: Inventory

- Read the entry point rulesets of the phases `http_request_firewall_custom`, `http_ratelimit` and `http_request_firewall_managed`, at account level (Enterprise) and zone level. Also read every custom ruleset they execute, and note each ruleset's `version`.
- Read the phases that run **before** the WAF and change what it sees: Single Redirects, and URL rewrites and other Transform Rules. Also note Origin Rules that rewrite the `Host` header (they affect rate limiting counters, see the gotchas) and any remaining Page Rules.
- Read the security features that run **outside** the Ruleset Engine. These are easy to miss, and some of them act before custom rules:
  - IP Access rules, at zone level (`GET /zones/<zone_id>/firewall/access_rules/rules`) and account level (`GET /accounts/<account_id>/firewall/access_rules/rules`).
  - Zone Lockdown (`GET /zones/<zone_id>/firewall/lockdowns`) and User Agent Blocking (`GET /zones/<zone_id>/firewall/ua_rules`).
  - The zone settings `security_level`, `browser_check` (Browser Integrity Check) and `hotlink_protection`.
  - Bot Fight Mode or Super Bot Fight Mode (`GET /zones/<zone_id>/bot_management`).
- Read which traffic detections are turned on. Their fields stay empty when they are off, so rules that use them never match:
  - Leaked credentials: `GET /zones/<zone_id>/leaked-credential-checks`
  - Malicious uploads: `GET /zones/<zone_id>/content-upload-scan/settings`
  - AI Security for Apps: `GET /zones/<zone_id>/ai-security/settings`
- Read the lists referenced by rules (`$list_name`).
- Read DNS records (proxied or not), and Workers custom domains and routes. This tells you which hostnames are dynamic, cost money or face users.
- Read the relevant zone settings: Always Use HTTPS (`always_use_https`), Bot Management configuration including JavaScript detections (`enable_js`) where available, and Super Bot Fight Mode (Pro and above, without Bot Management).
- Mark product-managed rules. Mark disabled rules too, and leave them out of the analysis unless the user asks.

### Step 2: Analytics before changes

Use GraphQL (`POST /graphql`):

- First, query the `settings` node to learn each dataset's `enabled`, `maxDuration`, `notOlderThan` and `availableFields`. Adaptive datasets keep at least 31 days of data on every plan.
- Cover the last 28 days, split into windows no longer than `maxDuration`, for example four 7-day windows.

Collect:

- Hits per `ruleId` and `action`, to find zero-hit, broken and noisy rules.
- Top hosts and paths per rule, to find false positives.
- Per-client requests per minute on candidate endpoints (`clientIP`, `datetimeMinute`), to set rate limiting thresholds.

Datasets and useful dimensions. Availability depends on the plan, so check `availableFields`.

- `firewallEventsAdaptiveGroups` and `firewallEventsAdaptive`: `source`, `ruleId`, `rulesetId`, `description`, `action`, `clientRequestHTTPHost`, `clientRequestPath`, `ja4`, `botDetectionIds`.
- `httpRequestsAdaptiveGroups`: `botScore`, `botScoreSrcName`, `botDetectionIds`, `botDetectionTags`, `verifiedBotCategory`, `ja4`, `ja3Hash`, `requestSource`, `cacheStatus`, `clientSSLProtocol`, `clientRequestScheme`, `securityAction`, `securitySource`, `wafAttackScore`, `datetimeMinute`, `clientIP`, `clientAsn`.

### Step 3: Structure

- **Enterprise with several zones:**
  - Fleet-wide hygiene lives at account level only. Zone rules hold zone-specific additions, with no duplicates across levels.
  - Run the Cloudflare Managed Ruleset at **one** level only.
  - Before disabling a zone copy of a managed ruleset, check which hosts the account-level execute expression **excludes**. Those hosts are covered only by the zone copy. Cover them at account level first.
- **Other plans:** apply the same baseline to every zone, with identical rule names, so drift is easy to spot. Suggest [Terraform](https://developers.cloudflare.com/terraform/) if the user manages many zones.

### Step 4: Custom rules

- Order the rules SKIP → LOG → BLOCK → CHALLENGE.
- Make skips narrow: exact host, path and method, plus an identity signal. Good identity signals are a verified bot category, `cf.worker.upstream_zone`, an IP list, mTLS, or a detection ID that belongs to a *verified* bot.
- Fix case sensitivity (`lower()`), `contains` used where `eq` or `starts_with` is meant, and the deprecated `ip.geoip.*` fields (use `ip.src.*`).
- Answer probe paths (`/wp-admin`, `.php` on non-PHP sites) with a *Block* and a 404, not a challenge.
- Only challenge navigations. Challenges can't render on sub-resources, APIs or XHR.
- If the rule quota is tight, merge rules that share the same action, action parameters and purpose.
- Decide how rules handle **failed detections**. Rules built on attack score, leaked credentials, content scanning, attack signatures or AI Security for Apps only work if the detection produced a result.
  - Log `len(cf.appsec.request.failed_detections) gt 0` first, to see how often it happens.
  - Then, on sensitive endpoints, fail closed for the detections a rule relies on, for example `any(cf.appsec.request.failed_detections[*] in {"waf_credential_check" "waf_score"})` on login `POST`s.
- Where Application Profiles exist, propose positive security. Review *Profile Analysis* in Security Analytics first, then enforce `cf.schema_validation.learned.violated` narrowly per host and path. Combine it with other signals if needed, for example `and cf.waf.score lt 20`.
- Propose migrating IP Access rules, Zone Lockdown and User Agent Blocking rules to custom rules with lists, as Cloudflare recommends. Replace an IP Access *Allow* with a narrow *Skip*. Keep in mind that *Skip* bypasses less than *Allow* does.
- Skip rules log every match to Security Events by default. For a high-volume, well-understood skip, `logging: { "enabled": false }` reduces noise, but it also removes visibility. Ask the user first.

### Step 5: Rate limiting

- Only protect endpoints that are dynamic or cost money, such as logins, APIs, search, AI endpoints and uncached HTML.
- Base thresholds on observed per-client rates (Step 2), with headroom.
- Choose characteristics by entitlement:
  - With Advanced Rate Limiting, use *Custom* `cidr6(ip.src, 64)`. It counts per IPv6 `/64` and passes IPv4 through unchanged.
  - Otherwise use *IP*, or *IP with NAT support* on Business and Enterprise.
- Exclude verified bots, Workers subrequests (`cf.worker.upstream_zone eq ""`) and `/cdn-cgi/`, but only with fields the plan allows in rate limiting expressions (see 0.3).
- Order specific rules (one path) before broad ones (a whole host).
- If an Origin Rule rewrites the `Host` header, avoid `http.host` in rules that count after the response (see the gotchas).
- Start new rules in *Log* (Enterprise). On other plans, start with *Managed Challenge* for browser endpoints, or a conservative threshold, and monitor.

### Step 6: Managed rules

- **Free:** deploy the Free Managed Ruleset. **Pro and above:** deploy the Cloudflare Managed Ruleset, and optionally the OWASP Core Ruleset.
- Write narrow exceptions that skip specific rule IDs, not whole rulesets.
- Confirm a false positive in Security Events (hostname, path, bot score) before adding an exception.
- Don't enable every rule with an override, except for a proof of concept.
- OWASP is prone to false positives. Cloudflare notes that it adds only marginal benefit on top of the Cloudflare Managed Ruleset and WAF attack score. If it is used, start in *Log* (Enterprise), or with a low paranoia level and a high threshold. Blocks by `949110: Inbound Anomaly Score Exceeded` come from OWASP; tune the OWASP configuration rather than adding exceptions.
- Review the rules that are **disabled by default** against the user's stack, for example the empty user-agent rule, rules tagged `sqli`, or the tags of the user's CMS.
- Check the [scheduled changes](https://developers.cloudflare.com/waf/change-log/scheduled-changes/index.md) for new rules about to be released, often in *Log* first.
- Payload logging needs the user's own key pair, and only captures matches made after it is turned on. Keep the existing configuration when patching an execute rule.

**Coverage checks (false negatives).** Before concluding that the protection is complete, check that:

- Every DNS record that serves HTTP is proxied. DNS-only records get no WAF.
- The origin only accepts traffic from Cloudflare, so the WAF can't be bypassed by going straight to the origin IP.
- No IP Access *Allow* entry and no broad skip rule exempts the attack traffic.
- No managed-rule exception is broader than the false positive it was written for.
- Rules that depend on a detection have a plan for requests where that detection failed (`cf.appsec.request.failed_detections`).

### Step 7: Change plan and approval

Present one table and wait for approval:

| # | Level and zone | Rule | Change | Evidence | Risk | Rollback |
|---|---|---|---|---|---|---|

- Group the changes by risk.
- List deletions separately.
- Say which changes start in *Log*, and when they should be reviewed.

### Step 8: Dry-run, then apply

- Send each approved write with `?dry_run=true`. Fix any errors, then send the identical request without the parameter.
  - MCP: `cloudflare.request({ method: 'PATCH', path: '/zones/<zone_id>/rulesets/<ruleset_id>/rules/<rule_id>', query: { dry_run: true }, body })`
  - curl: `.../rules/$RULE_ID?dry_run=true`
- For multi-step changes, dry-run **all** the steps before applying any of them.
- A request that references something not created yet can't be dry-run in advance. One example is an execute rule pointing at a new ruleset. Create the referenced item first, disabled or in *Log*, then dry-run the dependent request.
- Edit one rule at a time with `PATCH .../rules/<rule_id>`. Add `position` only when the rule actually moves (see the gotchas below).
- When merging rules, PATCH the surviving rule first, then DELETE the absorbed one, and only with approval.
- A successful dry run proves that the configuration is valid. It says nothing about which traffic a rule will match; Log mode and analytics tell you that.

### Step 9: Verify and report

- Diff each changed ruleset against `GET .../rulesets/<ruleset_id>/versions/<previous_version>`.
- Use [Trace](https://developers.cloudflare.com/rules/trace-request/index.md) to simulate requests without sending real traffic: `POST /accounts/<account_id>/request-tracer/trace` with `url`, `method` and optionally `headers`, `body` and `context` (`bot_score`, `geoloc`, `threat_score`). It returns the rules that would apply, phase by phase, and changes nothing. Trace is in beta, available on all plans, and needs the Administrator or Super Administrator role.
- Use [Cloudflare Traces](https://developers.cloudflare.com/observability/traces/index.md) (open beta) to see what happened to **real** requests. Trace only simulates. Cloudflare Traces records production traffic as [spans](https://developers.cloudflare.com/observability/traces/spans/index.md):
  - The spans cover the custom rules and managed rules phases, with span events naming the rule that blocked or challenged. They also cover Transform Rules, Origin Rules, cache, Workers routing and the origin.
  - As of its 2026-10-02 launch, there are no spans for rate limiting, Super Bot Fight Mode or HTTP DDoS rules. A skipped phase emits no span.
  - Check the status with `GET /zones/<zone_id>/observability/tracing/settings` (`enabled`, `sampling_ratio`, `persist`, `destinations`, `propagation_policy`, `forward_context`).
  - To verify a change on real traffic, ask the user first. Then add a temporary trace rule that samples 100% (`sampling_ratio: 1`) of requests from the tester's IP, or of requests with a debug header. Find the trace by Ray ID, and remove the rule afterwards.
  - `PUT /zones/<zone_id>/observability/tracing/rules` replaces **all** trace rules. Read them first and send them back with your change.
  - Query traces with the [SQL API](https://developers.cloudflare.com/analytics/sql-api/index.md) (`POST /accounts/<account_id>/analytics/sql`). List its datasets with `GET /accounts/<account_id>/analytics/sql/introspection`.
  - Turning tracing on, or persisting traces, changes the configuration and can cost money. From 2026-12-01, persisted traces count toward [Cloudflare Observability](https://developers.cloudflare.com/observability/pricing/index.md) ingestion and storage. Ask first.
  - The default for incoming trace context is *Reject*. If it is set to accept, treat joined traces as untrusted, because Cloudflare doesn't verify who sent the context.
- Run safe live tests with `curl`. Your own client may get challenged because of a low bot score, so interpret results accordingly.
- Check Security Events. Expect a few minutes of ingestion delay.
- Report back: what changed, the rollback versions, and follow-ups with dates. For example: "Review the Log events of rule X around YYYY-MM-DD, then switch it to Block."

### After the review: investigate, respond and learn

The review above is a snapshot. Cloudflare's [AI-era framework](https://blog.cloudflare.com/ai-era-framework/) ends with a continuous stage: investigate, respond and learn. It correlates sequences of events rather than judging alerts one by one, and it turns every investigation into stronger protection. When the user asks for an investigation, follow the same rules of engagement:

1. **Investigate.**
   - Pull Security Events and request analytics for the time window, with GraphQL (`firewallEventsAdaptive`, `httpRequestsAdaptiveGroups`) or the SQL API.
   - Correlate the events by client IP, ASN, JA4, path and time, and group them into campaigns.
   - Follow individual requests by Ray ID in Cloudflare Traces, where enabled.
   - Add context with Radar (`GET /radar/entities/ip`, `GET /radar/entities/asns/{asn}`), and with threat intelligence fields where available.
   - Check the audit logs (`GET /accounts/<account_id>/logs/audit`) for configuration changes in the same window.
2. **Respond.** Propose the narrowest mitigation that works: a custom rule, rate limiting rule, managed rule override or exception, or a list entry. Include the evidence, dry-run it, and apply it only after approval, in *Log* first where the plan allows.
3. **Learn.**
   - Replace temporary rules with permanent ones, and add narrow exceptions for confirmed false positives.
   - Record the lessons in the user's instructions file (`AGENTS.md`, `CLAUDE.md`) or their copy of this playbook.
   - Agree on a date for the next review.

The Radar MCP server (`https://radar.mcp.cloudflare.com/mcp`) and the Audit Logs MCP server (`https://auditlogs.mcp.cloudflare.com/mcp`) are optional alternatives to calling those APIs through `cloudflare-api`.

---

## 2. Plan-aware fallbacks

| Missing | Do this instead |
|---|---|
| *Log* action (below Enterprise) | Estimate matches first with GraphQL or Security Analytics filters equivalent to the expression. Deploy narrowly (one host or path), prefer *Managed Challenge* for browser traffic, and watch Security Events. |
| Regex (Free, Pro) | Use `lower()` with `contains`, `starts_with`, `ends_with` or `in {...}`. These are often better on every plan anyway. |
| Rule quota (Free: 5) | Merge rules with identical action and purpose, and keep the highest-value rules. Use one IP list for allow and deny entries. |
| Bot score (no Bot Management) | Use `cf.client.bot` or `cf.verified_bot_category` for verified bots, Super Bot Fight Mode (Pro and above, without Bot Management) for automation, and user-agent hygiene rules for unsophisticated tools. |
| WAF attack score | Use the Cloudflare Managed Ruleset (Pro and above) or the Free Managed Ruleset. Business can use `cf.waf.score.class`. |
| Advanced Rate Limiting | Use the *IP* or *IP with NAT support* characteristics, with no `cidr6()` and no custom characteristics. Keep the rule expression to the fields the plan allows. |
| Managed IP Lists | Use a custom IP list, and Cloudflare-provided signals such as `ip.src.continent eq "T1"` for Tor. |
| Account-level WAF | Apply the baseline per zone with consistent names, ideally through Terraform. |

---

## 3. Verified facts and gotchas

Check these against the [fields](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/index.md) and [functions](https://developers.cloudflare.com/ruleset-engine/rules-language/functions/index.md) references. Items marked *observed* came from live testing and are not documented.

**Dry run** ([docs](https://developers.cloudflare.com/ruleset-engine/rulesets-api/dry-run/index.md))

- Works for `POST`, `PUT`, `PATCH` and `DELETE` on Rulesets API mutation endpoints, at account and zone level.
- Runs the same authorization and server-side validation as the real request, without creating, updating, deleting or publishing anything.
- Validates:
  - Expression syntax and the availability of fields, functions and operators.
  - Actions, action parameters and phase compatibility.
  - Permissions, plan entitlements and rule quotas.
  - References to resources such as lists.
- A request that normally returns `200` returns `result: null`. A `204` stays `204`.
- `dry_run` only accepts `true` or `false`. Any other value returns `400`.
- The dashboard runs the same validation under **Security** > **Security rules** and **Rules** > **Overview**.
- A `position` equal to the rule's current index fails with error `20011`. `position: {after: X}` fails the same way when the rule already sits right after X.
  - A dry run moves nothing, so when dry-running reorders up front, judge "already in place" against the **live** order.
  - When applying several moves, track the order as each move lands.

**Execution order** ([concepts](https://developers.cloudflare.com/waf/concepts/index.md), [interoperability](https://developers.cloudflare.com/waf/feature-interoperability/index.md), [phase interactions](https://developers.cloudflare.com/waf/troubleshooting/phase-interactions/index.md))

- Security phases run in this order: `ddos_l7` (HTTP DDoS protection) → `http_request_firewall_custom` → `http_ratelimit` → `http_request_firewall_managed` → `http_request_sbfm` (Super Bot Fight Mode).
- IP Access rules run **before** custom rules:
  - An IP or ASN *Allow* bypasses custom rules, rate limiting rules and managed rules.
  - A country *Allow* bypasses custom and rate limiting rules, but not managed rules.
  - Allowed requests don't appear in Security Events.
  - Block by country in IP Access rules is Enterprise-only; use custom rules instead.
- Zone Lockdown, User Agent Blocking, Browser Integrity Check, Hotlink Protection and Security Level run outside the Ruleset Engine:
  - A `phases` skip doesn't skip them. Use the `products` skip with `zoneLockdown`, `uaBlock`, `bic`, `hot` or `securityLevel`.
  - Only the `waf` and `rateLimit` product values refer to legacy, previous-version products.
- Bot Fight Mode (Free) cannot be skipped. Super Bot Fight Mode can, with a `phases` skip of `http_request_sbfm`.
- Validation checks run before everything else and can't be turned off. They block malformed requests, such as Shellshock patterns in headers, and show up in Security Events as the `Validation` service, without a rule ID.
- While a Cloudflare-managed certificate is pending validation, Cloudflare automatically bypasses some security features for valid domain control validation (DCV) requests. These bypasses don't appear in Trace.

**Account level and skips**

- Account-level rulesets apply only to Enterprise zones. The docs require `cf.zone.plan eq "ENT"` in the account-level execute rule.
- Account rulesets are evaluated before zone rulesets. The phase order is custom rules → rate limiting rules → managed rules.
- Skip options:
  - `ruleset: "current"` skips only the remaining rules of *that* ruleset. An account-level skip never exempts traffic from zone custom rules.
  - An account-level `phases` skip applies at account **and** zone level.
  - `phase: "current"` exists at zone level only.
- A zone-level WAF exception cannot skip an account-level managed ruleset execution, because they are separate entry points. This is inferred, not documented.
- Managed rule events can't tell an account execution from a zone execution of the same ruleset. To find what only one copy covers, compare the host exclusions in the two execute expressions.

**Rules language**

- String operators are case-sensitive, except `wildcard`. Use `lower()`.
- `matches` needs Business or Enterprise, with up to 64 regexes per rule. For literal lists, use `contains`, `starts_with`, `ends_with` or `wildcard` instead.
- `cidr()` and `cidr6()` are only available in custom rules and rate limiting rules.

**Field semantics**

- `cf.verified_bot_category` is only set for verified bots. So `cf.bot_management.verified_bot or cf.verified_bot_category in {...}` is the same as `cf.bot_management.verified_bot`, which skips **all** verified bots, AI crawlers included. List the categories you want instead. Signed agents (Web Bot Auth) count as verified bots.
- `cf.api_gateway.auth_id_present` is `true` when a configured session identifier is present, meaning *authenticated*. Match unauthenticated traffic with `not`, scoped by host and path.
- Firewall for AI (AI Security for Apps):
  - `cf.llm.prompt.unsafe_topic_categories` values are names such as `VIOLENCE_AND_WEAPONS`, `NON_VIOLENT_CRIME`, `SEXUAL_CONTENT`, `CHILD_SAFETY`, `HATE_AND_DISCRIMINATION` and `SELF_HARM_AND_SUICIDE`. Old `S1`–`S14` codes match nothing.
  - Prompts are only scanned on endpoints labeled `cf-llm`, with JSON bodies.
  - `cf.llm.prompt.detected` is `true` for **every** prompt. Never OR it into a block rule.
- GraphQL malicious query protection only parses `POST` bodies (JSON or `application/graphql`, up to 20 KiB) on paths ending in the case-sensitive `/graphql`. Use `ends_with(http.request.uri.path, "/graphql")`, and always add `cf.api_gateway.graphql.parsed_successfully`.

**Traffic detections** ([docs](https://developers.cloudflare.com/waf/detections/index.md))

- Detections only populate fields; they never block or challenge on their own. A rule must use their fields to act.
- A detection must be turned on (leaked credentials, malicious uploads, AI Security for Apps) for its fields to be populated. Leaked credentials detection is on by default on Free plans.
- Threat intelligence fields (`cf.intel.ip.*`, [docs](https://developers.cloudflare.com/waf/detections/threat-intelligence/index.md)):
  - All fields are arrays, so use `any(...[*])`. Values are case-sensitive.
  - They reflect the last 7 days of activity for the client IP. Values from different threat events are flattened together, so combining two fields can match more broadly than expected.
  - IPs are often shared (NAT, proxies, cloud providers). Start in *Log* and combine them with other signals, such as attack score.
- `cf.appsec.request.failed_detections` ([docs](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.appsec.request.failed_detections/index.md), 2026-10-09):
  - It is an `Array<String>` of detection IDs that reported a failure before custom rules ran: `waf_content_scan`, `waf_score`, `waf_signature`, `waf_credential_check`, `llm_prompt_pii`, `llm_prompt_injection`, `llm_prompt_custom_topic`, `llm_prompt_unsafe_topic`.
  - It is `[]` when nothing failed. Duplicates are removed and the order isn't guaranteed.
  - It can be used in zone and account custom rules and rate limiting rules, and in zone Request Header Transform Rules, for example `join(cf.appsec.request.failed_detections, ",")` to tell the origin.
  - It doesn't change how detections behave.
- Application Profiles ([docs](https://developers.cloudflare.com/waf/detections/application-profiles/index.md)):
  - Fields: `cf.schema_validation.learned.violated` and `cf.schema_validation.uploaded.violated` (Boolean), plus `cf.schema_validation.{learned|uploaded}.{path|query|headers|cookies|body}.violated_parameters` and `.query.undeclared_parameters` (arrays). Only custom rules can use them, and only the `violated` fields appear in Security Analytics.
  - A profile is learned weekly for the operations you select. An operation needs at least 1,000 requests with a `2xx` response in 7 days to learn fields, and 10,000 to learn value boundaries. Bots and scanners can be part of that traffic, so review a profile before enforcing it.
  - Not supported: multipart forms, GraphQL and XML. Requests to operations without a profile are not classified.
- Attack Signature Detection (Early Access) records signature matches as metadata, without acting. Its signature Ref equals the corresponding managed rule ID.

**Custom block responses**

- Status codes 400–499 only.
- Types: `text/html`, `text/plain`, `application/json`, `text/xml`.
- Maximum size: 2 KB for custom rules, 30 KB for rate limiting rules.

**Workers subrequests**

- Workers subrequests arrive from Cloudflare IPv6 addresses (AS13335). The source IP doesn't identify the Worker or its owner.
- Use `cf.worker.upstream_zone` instead: it holds the calling Worker's zone and is empty for non-Worker requests.
- The `CF-Worker` header is added after rule evaluation, so rules can't match on it.

**Detection IDs** ([docs](https://developers.cloudflare.com/bots/additional-configurations/detection-ids/index.md))

- Detection IDs cover heuristics, verified bot detections and anomalies. Only verified-bot IDs identify a specific client.
- Generic heuristic IDs are shared by many clients. Never use them in skips. Examples: `161371150` (tag `curl`), `50331656` (`empty_ua`) and `33563990` (`unclassified_bot`). Check `botDetectionTags` in GraphQL before using any ID.
- Account takeover IDs: `201326592` (suspicious amount of login failures) and `201326593` (suspicious amount of login attempts).

**TLS fingerprints and plaintext HTTP**

- Observed: JA3 and JA4 are always empty together, and only without TLS or on Cloudflare-internal requests (`requestSource` values such as `edgeWorkerFetch`, `inBrowserChallenge`, `imageResizing`).
- Observed: with Always Use HTTPS on, most plaintext requests get a 301 before custom rules act, so a `not ssl` rule rarely matches. It only does real work where Always Use HTTPS is off. Check its hit count before relying on it.

**`/cdn-cgi/`** ([docs](https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/index.md))

- Never block or challenge `/cdn-cgi/challenge-platform/`, because that breaks challenges, Turnstile and JavaScript detections.
- `/cdn-cgi/image/`, `/cdn-cgi/zaraz/` and `/cdn-cgi/l/email-protection` are normal visitor requests.
- Keep `/cdn-cgi/image/` in scope of path-based BLOCK rules, because its URL embeds the origin path.

**Phases**

- Single Redirects answer before the WAF and rate limiting, so redirected traffic can't be rate limited.
- URL rewrites change `http.request.uri.path` before the WAF. Match the original path with `raw.http.request.uri.path`.

**Analytics**

- Security Events keep up to 31 days of data. On Free plans the dashboard shows sampled logs only.
- Requests that went through a Worker show a Cloudflare IP in Security Events, even though the rules evaluated the original client's details.
- A deleted rule shows as `Rule unavailable` in Security Events. Use the audit logs to see what changed.

**Rate limiting** ([parameters](https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/index.md), [request rate](https://developers.cloudflare.com/waf/rate-limiting-rules/request-rate/index.md))

- Counters are kept per data center (`cf.colo.id` is a mandatory characteristic), so traffic spread over many data centers can stay below a per-data-center threshold.
- Rate limiting fails open during infrastructure overload, with no customer-visible signal.
- Supported periods: 10, 15, 20, 30, 40, 45, 60, 90, 120, 180, 240, 300, 480, 600, 900, 1200, 1800, 2400, 3600, 65535 and 86400 seconds. Each plan caps them (see 0.3).
- Rate limiting runs after custom rules. Requests that a custom rule already blocked or challenged never reach it, so a broad limit behind a challenge rule can show 0 hits and still be correct.
- When several rules exceed their limits, the first one in order applies its action.
- `requests_to_origin: true` counts only uncached requests.
- A custom counting expression **replaces** the rule expression for counting, so repeat the matching conditions in it. Response fields send matching requests to the origin.
- Same-zone Workers subrequests may be counted twice when *Also apply rate limiting to cached assets* is on. Exclude subrequests from your own zone with `cf.worker.upstream_zone ne "<your-zone>"`.
- If an Origin Rule rewrites the `Host` header, a rule can match but never increment its counter. This happens when the rule uses `http.host` (in its expression or characteristics) and counts after the response, that is, with a counting expression or with cached assets excluded. Scope the counter by path instead, or include both hostnames. See [troubleshooting](https://developers.cloudflare.com/waf/rate-limiting-rules/troubleshooting/index.md).
- `/64` groups one subscriber's IPv6 addresses. `/48` groups many more clients together.

**Managed rules**

- In the Cloudflare Managed Ruleset, `ee922cf0…` is *Anomaly:Body - Large* (Block by default) and `7b822fd1…` is *Anomaly:Body - Large 2* (Log by default). Don't mix them up.
- Disable the specific rule that causes a false positive, not the whole ruleset.
- Managed rules aren't meant for binary uploads. Use malicious uploads detection for those.
- On Free plans, the Free Managed Ruleset is deployed by default.

---

## 4. Common findings to check

These were found in real reviews. Look for each of them.

**Ordering**

- A broad verified-bot skip (`ruleset: "current"`) at the top also skipped the authentication rules below it (mTLS, signed URLs). Exclude the authenticated hosts from the skip.
- A skip placed as the **last** rule skips nothing.
- A challenge rule placed **above** the verified-bot skip challenged search engine crawlers and `robots.txt`.

**Inverted or broken logic**

- A rule meant for unauthenticated API requests matched `cf.api_gateway.auth_id_present`, so it logged the *authenticated* ones.
- A Firewall for AI rule used invalid category values, so it matched nothing. Another ORed `cf.llm.prompt.detected`, so it would block every prompt.
- `not ip.geoip.continent in {"T1"}` (deprecated field) *exempted* Tor instead of matching it.
- A rule compared the raw query string with a literal value and never matched, and earlier rules already covered the same case.
- Account takeover rules used generic heuristic detection IDs instead of the documented ATO IDs.
- A malicious-upload rule only fired when several unrelated conditions were **all** true (content type and size and path). It should fire on any malicious or unscannable object.

**Wrong action**

- Probe paths for software the site doesn't run got challenged: about 116,000 challenges in 28 days, 3 solved. Block them with a 404.

**Out of reach**

- Rules targeted a TCP Spectrum application. The WAF never runs for those.
- Rules protected hostnames whose DNS records were DNS-only (not proxied). The WAF never sees that traffic.
- Rules used leaked-credentials or upload-scanning fields while that detection was turned off, so they never matched.

**Hidden bypasses**

- Old IP Access *Allow* entries (former offices, partners, monitoring) silently bypassed every custom, rate limiting and managed rule, and those requests never appeared in Security Events.
- Zone Lockdown and User Agent Blocking rules duplicated, or contradicted, newer custom rules.

**Coverage and noise**

- A host excluded from the account-level managed ruleset was covered only by the zone copy, which was about to be disabled.
- A zone copy of the managed ruleset only held overrides for rules that are disabled by default anyway, which made it a strict subset of the account copy.
- Showcase *Log* rules produced about 40% of a zone's security events and buried the real mitigations.
- Skip rules still listed the legacy `products` values `waf` and `rateLimit`, which refer to the previous versions of managed rules and rate limiting. Replace them with `phases` skips.

---

## 5. Reference baseline

This is a starting point to adapt, not a template to copy. On Enterprise it belongs at account level; on other plans, apply it per zone within the plan's limits. The companion article explains each item and gives example expressions.

**Custom rules**

- **Skip** (narrow, at the top):
  - Your monitoring and Workers, identified by `cf.worker.upstream_zone` or a list.
  - The verified bot categories you want.
  - `robots.txt` and `sitemap.xml`.
  - The Zaraz endpoint under `/cdn-cgi/zaraz/`, if used.
- **Log** (Enterprise): signals worth watching before acting on them, such as pretend-browsers that fail JavaScript detections on `POST` requests.
- **Block:**
  - Non-standard ports (`not cf.edge.server_port in {80 443}`).
  - Workers subrequests from zones you don't own (`not cf.worker.upstream_zone in {"" "your-zone.com"}`).
  - `$cf.botnetcc` and `$cf.malware` (Enterprise).
  - Sensitive files and paths with `lower()`, answered with a 404, keeping `/.well-known/` reachable.
  - HTTP-library user agents, scoped to hosts where no legitimate automation is expected.
- **Challenge:** plaintext HTTP (`not ssl`) on zones where Always Use HTTPS is off.

**Rate limiting**

- On Enterprise, an origin back-off rule for automated clients (bot score below 30, not verified, not from a Worker, not `/cdn-cgi/`), counting origin-bound requests only. Start in *Log*.
- On every plan, limits on login, sign-up, OTP and API endpoints.

**Managed rules**

- The Cloudflare Managed Ruleset (Free Managed Ruleset on Free) at one level, with selected stricter rules enabled. The companion article lists them.
- Narrow exceptions that skip specific rule IDs.

---

## 6. Conventions

These are defaults. Ask the user whether they have their own conventions, and follow theirs.

**Naming**

- Use `<ACTION> [CATEGORY] What (scope)`, for example `BLOCK [AUTH] HMAC Signed URL Required (downloads.example.com /files/)`.
- Account-level rules start with `ACCOUNT-LEVEL`.
- Categories: `[BOTS]`, `[API]`, `[AUTH]`, `[CREDENTIALS]`, `[UPLOADS]`, `[AI]`, `[NETWORK]`, `[PROBES]`, `[ATTACKS]`, `[MONITORING]`, `[MANAGED]`, `[EXCEPTION]`, or `[APP:<name>]` for a single application.
- Disabled rules that are kept say why in their name, for example `(inactive: runs at account level)`.

**Expressions**

- Prefer `lower()` with `contains`, `starts_with` and `ends_with` for literals. Use `matches` only for real patterns, such as anchors.
- Use fields and functions that make rules precise, such as `any(...[*])`, `cidr6()`, `cf.verified_bot_category` and `cf.worker.upstream_zone`, without over-engineering.

**Merging**

- Combine rules only when action, action parameters and purpose are identical.

**Block responses**

- Keep them short, realistic and non-revealing.
- Use text for websites and JSON for APIs and programmatic clients.
- Answer probe paths with a 404 `Not Found`.

**Rollout**

- New broad rules start in *Log* where available, with thresholds taken from analytics.

---

## 7. References

**Rules language:** [Fields](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/index.md) · [Functions](https://developers.cloudflare.com/ruleset-engine/rules-language/functions/index.md) · [Operators](https://developers.cloudflare.com/ruleset-engine/rules-language/operators/index.md) · [Values and regex limits](https://developers.cloudflare.com/ruleset-engine/rules-language/values/index.md) · [Ruleset Engine full text](https://developers.cloudflare.com/ruleset-engine/llms-full.txt)

**Rulesets API:** [Dry run](https://developers.cloudflare.com/ruleset-engine/rulesets-api/dry-run/index.md) · [Add rules to a ruleset](https://developers.cloudflare.com/ruleset-engine/custom-rulesets/add-rules-ruleset/index.md) · [Phases list](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/index.md)

**Framework:** [Adaptive application security for the AI era](https://blog.cloudflare.com/ai-era-framework/) · [Application Profiles (blog)](https://blog.cloudflare.com/application-profiles/) · [Failed detections (changelog)](https://developers.cloudflare.com/changelog/post/2026-10-09-failed-detections/index.md)

**WAF overview:** [Concepts and rule execution order](https://developers.cloudflare.com/waf/concepts/index.md) · [Security features interoperability](https://developers.cloudflare.com/waf/feature-interoperability/index.md) · [Rule phase interactions](https://developers.cloudflare.com/waf/troubleshooting/phase-interactions/index.md) · [Traffic detections](https://developers.cloudflare.com/waf/detections/index.md) · [Application Profiles](https://developers.cloudflare.com/waf/detections/application-profiles/index.md) · [Failed detections field](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.appsec.request.failed_detections/index.md) · [Threat intelligence](https://developers.cloudflare.com/waf/detections/threat-intelligence/index.md) · [WAF FAQ](https://developers.cloudflare.com/waf/troubleshooting/faq/index.md)

**Custom rules:** [Availability](https://developers.cloudflare.com/waf/custom-rules/index.md) · [Skip options](https://developers.cloudflare.com/waf/custom-rules/skip/options/index.md) · [Zone custom rulesets](https://developers.cloudflare.com/waf/custom-rules/custom-rulesets/index.md) · [Account custom rulesets](https://developers.cloudflare.com/waf/account/custom-rulesets/index.md) · [Use cases](https://developers.cloudflare.com/waf/custom-rules/use-cases/index.md)

**Rate limiting:** [Availability](https://developers.cloudflare.com/waf/rate-limiting-rules/index.md) · [Parameters](https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/index.md) · [Best practices](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/index.md) · [Find a rate limit](https://developers.cloudflare.com/waf/rate-limiting-rules/find-rate-limit/index.md) · [Account rate limiting rulesets](https://developers.cloudflare.com/waf/account/rate-limiting-rulesets/index.md) · [Troubleshooting](https://developers.cloudflare.com/waf/rate-limiting-rules/troubleshooting/index.md)

**Managed rules:** [Overview and availability](https://developers.cloudflare.com/waf/managed-rules/index.md) · [WAF exceptions](https://developers.cloudflare.com/waf/managed-rules/waf-exceptions/index.md) · [Troubleshooting](https://developers.cloudflare.com/waf/managed-rules/troubleshooting/index.md) · [Account deployment](https://developers.cloudflare.com/waf/account/managed-rulesets/index.md) · [Changelog](https://developers.cloudflare.com/waf/change-log/index.md) · [Scheduled changes](https://developers.cloudflare.com/waf/change-log/scheduled-changes/index.md) · [WAF full text](https://developers.cloudflare.com/waf/llms-full.txt)

**Tools outside the Ruleset Engine:** [IP Access rules](https://developers.cloudflare.com/waf/tools/ip-access-rules/index.md) · [Zone Lockdown](https://developers.cloudflare.com/waf/tools/zone-lockdown/index.md) · [User Agent Blocking](https://developers.cloudflare.com/waf/tools/user-agent-blocking/index.md) · [Validation checks](https://developers.cloudflare.com/waf/tools/validation-checks/index.md)

**Bots and platform:** [Detection IDs](https://developers.cloudflare.com/bots/additional-configurations/detection-ids/index.md) · [Verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/index.md) · [Security features interoperability](https://developers.cloudflare.com/waf/feature-interoperability/index.md) · [`/cdn-cgi/` endpoint](https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/index.md) · [Cloudflare HTTP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/index.md)

**Analytics and troubleshooting:** [Trace](https://developers.cloudflare.com/rules/trace-request/index.md) (simulated) · [Cloudflare Traces](https://developers.cloudflare.com/observability/traces/index.md) and [spans](https://developers.cloudflare.com/observability/traces/spans/index.md) (production) · [Introducing Cloudflare Traces](https://blog.cloudflare.com/cloudflare-tracing/) · [SQL API](https://developers.cloudflare.com/analytics/sql-api/index.md) · [GraphQL limits](https://developers.cloudflare.com/analytics/graphql-api/limits/index.md) · [Settings discovery](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/index.md) · [Security Events](https://developers.cloudflare.com/waf/analytics/security-events/index.md)

**Architecture:** [Streamlined WAF deployment across zones](https://developers.cloudflare.com/reference-architecture/design-guides/streamlined-waf-deployment-across-zones-and-applications/index.md)

**Agents:** [Cloudflare's MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/index.md) · [Agent setup](https://developers.cloudflare.com/agent-setup/)
