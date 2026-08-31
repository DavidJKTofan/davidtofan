---
title: "Securing Every AI and MCP Interaction with Cloudflare"
date: 2026-08-31
description: "How to gain visibility into and control every AI interaction – workforce browsers and IDEs, agents and MCP clients, public AI apps, and SaaS AI providers – using Cloudflare One and the Developer Platform."
tags:
  [
    "cybersecurity",
    "cloudflare",
    "artificial intelligence",
    "agents",
    "mcp",
    "zero trust",
    "developers",
  ]
type: "article"
---

> _Third in a series. [Cybersecurity and Artificial Intelligence (2023)](https://davidtofan.com/articles/ai-cybersecurity/) introduced the Zero Trust approach to AI; [The CISO's Guide to Securing AI (2025)](https://davidtofan.com/articles/ciso-guide-securing-ai-cloudflare/) mapped ten common threats to Cloudflare controls. This one organizes by **who or what is interacting with AI**, because each actor reaches AI over a different path, and each path has a different inspection point._

Most organizations already have an AI usage policy. Very few can tell you whether it is being followed.

That is a visibility problem, not a policy problem. An employee pasting customer data into a chatbot, a coding agent calling an LLM API from an IDE, an MCP client invoking a tool against production, and a customer-facing chatbot answering a prompt injection are four different traffic flows. They share no protocol, no identity model, and no logging surface – so a control that catches one silently misses the other three. Here are all four, the Cloudflare inspection point that governs each, and how to build agents that stay inside them.

---

## The Four Surfaces

<figure style="margin: 2rem 0; overflow-x: auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 470" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:900px;height:auto;font-family:system-ui,sans-serif;display:block;margin:0 auto;" role="img" aria-label="Flow diagram: employees, agents and MCP clients, and public clients reach AI models, MCP servers, SaaS providers, and applications through Cloudflare inspection points – Access, Secure Web Gateway, AI Gateway, MCP Server Portal, AI Security for Apps, DLP, and out-of-band CASB.">
<title>How each kind of AI interaction reaches Cloudflare</title>
<style>.box-stroke{stroke:currentColor;stroke-width:1.5;fill:none}.cf-box{stroke:#f6821f;stroke-width:2;fill:#f6821f;fill-opacity:0.06}.cf-inner{stroke:#f6821f;stroke-width:1.5;fill:#f6821f;fill-opacity:0.05}.label{fill:currentColor;font-size:13px;font-weight:500}.label-sm{fill:currentColor;font-size:11px;opacity:0.7}.sub{fill:currentColor;font-size:9.5px;opacity:0.6}.edge-label{fill:currentColor;font-size:10px;opacity:0.6}.cf-label{fill:#f6821f;font-size:15px;font-weight:700}.cf-box-label{fill:#f6821f;font-size:12px;font-weight:600}.cf-sub{fill:currentColor;font-size:9.5px;opacity:0.65}.arrow{stroke:currentColor;stroke-width:1.5;fill:none;marker-end:url(#arrowhead)}.arrow-cf{stroke:#f6821f;stroke-width:1.5;fill:none;marker-end:url(#arrowhead-cf)}.arrow-oob{stroke:#f6821f;stroke-width:1.5;fill:none;stroke-dasharray:4 3;marker-end:url(#arrowhead-cf);marker-start:url(#arrowstart-cf)}</style>
<defs>
  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="currentColor"/></marker>
  <marker id="arrowhead-cf" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#f6821f"/></marker>
  <marker id="arrowstart-cf" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto"><path d="M8,0 L0,3 L8,6" fill="#f6821f"/></marker>
</defs>
<!-- Left column: who interacts -->
<rect x="6" y="64" width="150" height="52" rx="6" class="box-stroke"/>
<text x="81" y="88" text-anchor="middle" class="label">Users / Employees</text>
<text x="81" y="104" text-anchor="middle" class="sub">browsers, IDEs</text>
<rect x="6" y="176" width="150" height="52" rx="6" class="box-stroke"/>
<text x="81" y="200" text-anchor="middle" class="label">Agents / MCP Clients</text>
<text x="81" y="216" text-anchor="middle" class="sub">IDEs, CI, automations</text>
<rect x="6" y="316" width="150" height="52" rx="6" class="box-stroke"/>
<text x="81" y="340" text-anchor="middle" class="label">Public Clients</text>
<text x="81" y="356" text-anchor="middle" class="sub">customers, crawlers</text>
<!-- Arrows in -->
<line x1="158" y1="96" x2="244" y2="96" class="arrow"/>
<text x="201" y="86" text-anchor="middle" class="edge-label">on-ramp required</text>
<line x1="158" y1="192" x2="244" y2="150" class="arrow"/>
<line x1="158" y1="212" x2="244" y2="230" class="arrow"/>
<text x="201" y="196" text-anchor="middle" class="edge-label">HTTPS</text>
<line x1="158" y1="342" x2="304" y2="326" class="arrow"/>
<text x="228" y="356" text-anchor="middle" class="edge-label">HTTPS (inbound)</text>
<!-- Cloudflare panel -->
<rect x="236" y="16" width="430" height="410" rx="10" class="cf-box"/>
<text x="451" y="42" text-anchor="middle" class="cf-label">Cloudflare</text>
<line x1="250" y1="54" x2="652" y2="54" stroke="#f6821f" stroke-width="1" opacity="0.4"/>
<!-- Access band -->
<rect x="248" y="66" width="46" height="196" rx="6" class="cf-inner"/>
<text x="271" y="168" text-anchor="middle" class="cf-box-label" transform="rotate(-90 271 168)">Access (ZTNA)</text>
<line x1="296" y1="94" x2="304" y2="94" class="arrow-cf"/>
<line x1="296" y1="164" x2="304" y2="164" class="arrow-cf"/>
<line x1="296" y1="234" x2="304" y2="234" class="arrow-cf"/>
<!-- Inspection points -->
<rect x="308" y="66" width="176" height="56" rx="6" class="cf-inner"/>
<text x="396" y="90" text-anchor="middle" class="cf-box-label">Secure Web Gateway</text>
<text x="396" y="106" text-anchor="middle" class="cf-sub">needs TLS decryption</text>
<rect x="308" y="136" width="176" height="56" rx="6" class="cf-inner"/>
<text x="396" y="160" text-anchor="middle" class="cf-box-label">AI Gateway</text>
<text x="396" y="176" text-anchor="middle" class="cf-sub">per-user identity, spend</text>
<rect x="308" y="206" width="176" height="56" rx="6" class="cf-inner"/>
<text x="396" y="230" text-anchor="middle" class="cf-box-label">MCP Server Portal</text>
<text x="396" y="246" text-anchor="middle" class="cf-sub">curated tools, per-user auth</text>
<rect x="308" y="290" width="176" height="56" rx="6" class="cf-inner"/>
<text x="396" y="314" text-anchor="middle" class="cf-box-label">AI Security for Apps</text>
<text x="396" y="330" text-anchor="middle" class="cf-sub">injection, PII, unsafe topics</text>
<!-- Workers -->
<rect x="248" y="362" width="404" height="48" rx="6" class="cf-inner"/>
<text x="450" y="384" text-anchor="middle" class="cf-box-label">Workers · Sandbox · Containers</text>
<text x="450" y="400" text-anchor="middle" class="cf-sub">isolated execution; Worker egress flows through Gateway</text>
<!-- CASB + DLP -->
<rect x="502" y="42" width="150" height="56" rx="6" class="cf-inner"/>
<text x="577" y="66" text-anchor="middle" class="cf-box-label">CASB</text>
<text x="577" y="84" text-anchor="middle" class="cf-sub">posture, data at rest · API</text>
<rect x="502" y="120" width="150" height="104" rx="6" class="cf-inner"/>
<text x="577" y="152" text-anchor="middle" class="cf-box-label">DLP</text>
<text x="577" y="172" text-anchor="middle" class="cf-sub">prompts, files, tool calls,</text>
<text x="577" y="186" text-anchor="middle" class="cf-sub">responses – flag or block</text>
<line x1="577" y1="100" x2="577" y2="118" class="arrow-oob"/>
<text x="620" y="112" text-anchor="middle" class="edge-label">out-of-band</text>
<!-- Inspection points into DLP -->
<line x1="486" y1="94" x2="498" y2="148" class="arrow-cf"/>
<line x1="486" y1="164" x2="498" y2="168" class="arrow-cf"/>
<line x1="486" y1="234" x2="498" y2="192" class="arrow-cf"/>
<!-- Arrows out -->
<line x1="654" y1="62" x2="676" y2="56" class="arrow-cf"/>
<line x1="654" y1="150" x2="676" y2="116" class="arrow-cf"/>
<line x1="654" y1="172" x2="676" y2="186" class="arrow-cf"/>
<line x1="654" y1="196" x2="676" y2="250" class="arrow-cf"/>
<line x1="486" y1="318" x2="676" y2="326" class="arrow-cf"/>
<!-- Right column: destinations -->
<rect x="680" y="36" width="214" height="40" rx="6" class="box-stroke"/>
<text x="787" y="61" text-anchor="middle" class="label">SaaS AI Providers</text>
<rect x="680" y="96" width="214" height="40" rx="6" class="box-stroke"/>
<text x="787" y="121" text-anchor="middle" class="label">AI Models (LLM APIs)</text>
<rect x="680" y="166" width="214" height="40" rx="6" class="box-stroke"/>
<text x="787" y="191" text-anchor="middle" class="label">MCP Servers</text>
<rect x="680" y="230" width="214" height="40" rx="6" class="box-stroke"/>
<text x="787" y="255" text-anchor="middle" class="label">Internal Apps / SaaS</text>
<rect x="680" y="306" width="214" height="40" rx="6" class="box-stroke"/>
<text x="787" y="331" text-anchor="middle" class="label">Your AI Apps / Models</text>
<!-- Column labels -->
<text x="81" y="450" text-anchor="middle" class="label-sm">Who interacts</text>
<text x="787" y="450" text-anchor="middle" class="label-sm">What they reach</text>
</svg>
<figcaption style="text-align:center;font-size:0.85rem;opacity:0.65;margin-top:0.5rem;">Four interaction surfaces, four inspection points. Surface 1 only exists once an <a href="https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/" target="_blank" rel="nofollow noopener external" style="color:inherit;text-decoration:underline;">on-ramp</a> steers traffic in; everything inline follows <a href="https://developers.cloudflare.com/cloudflare-one/traffic-policies/order-of-enforcement/" target="_blank" rel="nofollow noopener external" style="color:inherit;text-decoration:underline;">Gateway's order of enforcement</a>; CASB reaches SaaS providers out-of-band over API.</figcaption>
</figure>

Which inspection point applies is decided by how the traffic arrives, so they are not interchangeable:

<div style="overflow-x: auto;">

| If the interaction is… | It is inspected by… | Because… |
| --- | --- | --- |
| A human in a browser or IDE | Secure Web Gateway (SWG) | Traffic is steered in by an on-ramp – device client or proxy endpoint |
| An agent calling a model API | AI Gateway | The agent points at your gateway hostname |
| An MCP client calling tools | MCP Server Portal | The client connects to one authenticated endpoint |
| A customer hitting your chatbot | AI Security for Apps | Traffic arrives inbound at your reverse proxy |
| Data sitting inside a SaaS tenant | CASB | Nothing is proxied at all – it is an API scan |

</div>

One dependency the diagram makes deliberately explicit: **the workforce path only exists if you build an on-ramp for it.** The other three do not share it – an agent reaches AI Gateway because you configured it to use that hostname, a customer reaches AI Security for Apps because your domain is [proxied](https://developers.cloudflare.com/dns/proxy-status/), and CASB needs no traffic path at all.

---

## Getting Traffic to Cloudflare

An inspection point that never sees the traffic enforces nothing. Pick the [connectivity option](https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/) that matches what you need to cover:

- **Device client** – the Cloudflare One Client (formerly WARP) tunnels device traffic over MASQUE with [post-quantum cryptography (PQC)](https://developers.cloudflare.com/ssl/post-quantum-cryptography/), or WireGuard. The on-ramp for laptops running browsers and IDEs.
- **Proxy endpoint** – Gateway policies via a PAC file, nothing installed. For contractors and unmanaged machines.
- **Cloudflare Mesh** – bidirectional connectivity with a private Mesh IP per node, preserving source IPs. For servers and CI runners calling AI APIs.
- **Cloudflare Tunnel** – outbound-only connector reaching a self-hosted model or internal MCP server without opening inbound ports.
- **Cloudflare WAN** – GRE and IPsec tunnels for branch offices and data centers.

### Order of Enforcement

[Gateway policies](https://developers.cloudflare.com/cloudflare-one/traffic-policies/) run in a fixed [order](https://developers.cloudflare.com/cloudflare-one/traffic-policies/order-of-enforcement/): DNS → resolver → egress → network → HTTP. Within HTTP policies:

```text
1. Do Not Inspect
2. Isolate
3. Allow / Block / Do Not Scan
4. Body inspection (DLP, antivirus, file sandboxing)
```

Evaluation is first match. Put specific AI policies above catch-alls, and remember that a [Do Not Inspect](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/#do-not-inspect) rule placed high neutralizes every DLP rule below it for that traffic.

### Be Honest About the Blind Spots

Inspecting HTTPS requires [TLS decryption](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/tls-decryption/) – a root CA on managed devices, decrypted in memory in Cloudflare's data centers.

**The certificate does not stop at the OS trust store, and this is the detail that derails rollouts.** Much of the tooling that matters most for AI work keeps its own trust store and fails with certificate errors until you tell it about the Cloudflare CA ([full guide](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/user-side-certificates/manual-deployment/#5-add-the-certificate-to-applications)):

<div style="overflow-x: auto;">

| Application | What it needs |
| --- | --- |
| cURL | Uses the OS keychain, so an OS-level install is usually enough |
| Docker | Certificate copied **into the image** at build time, container trust store updated |
| Python | Append to the `certifi` bundle, or set `SSL_CERT_FILE` and `REQUESTS_CA_BUNDLE` |
| Node / npm | `npm config set cafile [PATH]`, or export `NODE_EXTRA_CA_CERTS` |
| Git | `git config --global http.sslcainfo [PATH]` |
| Rust | `CARGO_HTTP_CAINFO` |
| AWS CLI | `ca_bundle` in the config file, or `AWS_CA_BUNDLE` |

</div>

Docker deserves deliberate planning: containerized build agents and CI runners are where AI tooling now lives, and a container that has never heard of your root CA fails every outbound HTTPS call the moment inspection turns on. Other traffic cannot be decrypted at all: **certificate pinning** (common in desktop AI clients and IDE extensions), **mutual TLS**, **self-signed certificates**, and **ECH/ESNI** all force a Do Not Inspect policy – and with it you lose HTTP logging, DLP, and antivirus for that traffic. **This is the strongest argument for the sections that follow:** when you cannot inspect an agent on the wire, point it at an endpoint you control instead – an AI Gateway hostname or an MCP Server Portal – moving governance to the application layer, where pinning is irrelevant.

### Knowing How Traffic Arrived

The [**Traffic Source selector**](https://developers.cloudflare.com/changelog/post/2026-08-12-traffic-source-selector/) exposes `net.onramp.type` in HTTP and Network policies, so rules can depend on how traffic reached Cloudflare:

```text
device_client    Cloudflare One Client (WARP)
mesh             Mesh connector
cloudflare_wan   Cloudflare WAN (Magic WAN)
proxy_endpoint   Proxy endpoint (PAC file)
clientless_rdp   Clientless RDP session
agentless_biso   Clientless Browser Isolation
mcp_portal       MCP Server Portal
```

A companion selector, `net.is_isolated`, identifies Remote Browser Isolation (RBI) sessions; `mcp_portal` is what turns MCP governance from advisory into enforceable, below. Separately, [**Worker egress now flows through Gateway**](https://developers.cloudflare.com/changelog/post/2026-06-05-gateway-egress/): Workers using `cf1:network` VPC bindings send public Internet traffic through Gateway, with policies applied and logs written – so **the agents your own team builds inherit the same policies as your employees' laptops.**

---

## Surface 1: Workforce in Browsers and IDEs

**Inspection point: Secure Web Gateway (SWG).**

The goal is not to stop employees using AI. It is to know what they use, decide what is acceptable, and make the acceptable path the easy one.

**Discover, then classify.** [Shadow IT discovery](https://developers.cloudflare.com/cloudflare-one/insights/analytics/shadow-it-discovery/) surfaces the AI applications your users actually reach, and each moves through a review workflow – **Unreviewed → In Review → Unapproved → Approved**. That [status](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/#application-approval-status) is not cosmetic: it is both a policy selector and an analytics dimension. The [**AI Security report**](https://developers.cloudflare.com/cloudflare-one/insights/analytics/ai-security/) adds five panels – top AI applications by user count, application counts per review status, **data uploaded by review status**, MCP servers behind Access over time, and Access login events to those servers. It needs Gateway inspecting outbound traffic *and* MCP servers behind Access; without both it is empty, which is itself a signal.

**Control what leaves.** [**Data Loss Prevention**](https://developers.cloudflare.com/cloudflare-one/data-loss-prevention/) is what makes an AI usage policy enforceable. Applied through Gateway HTTP policies with TLS decryption on, it scans request bodies – chat messages, file uploads, form submissions – before they reach a provider, in memory, never written to disk. For investigation, enable [payload logging](https://developers.cloudflare.com/cloudflare-one/data-loss-prevention/dlp-policies/logging-options/) for encrypted copies, or Logpush matches to your SIEM. Where blocking is too blunt, [**Remote Browser Isolation**](https://developers.cloudflare.com/cloudflare-one/remote-browser-isolation/isolation-policies/#policy-settings) is the middle path: people read and type in a tool you allow but do not fully trust, while upload, download, and copy-paste stay disabled – combinable with DLP.

**The IDE problem.** Some coding-agent traffic is ordinary HTTPS that Gateway inspects cleanly; some comes from clients that pin or self-sign certificates, where Do Not Inspect is the only way to keep the tool working. SWG then gives you a connection record and nothing more – you see that an agent talked to a provider, not what it said. That is a property of the transport, and the answer is Surface 2.

> _For the threat-by-threat treatment of the browser surface – phishing, deepfakes, social engineering, DDoS and rate limiting – see [The CISO's Guide to Securing AI](https://davidtofan.com/articles/ciso-guide-securing-ai-cloudflare/)._

---

## Surface 2: Agents and MCP Clients

**Inspection points: AI Gateway (model calls) and MCP Server Portal (tool calls).**

An agent does two different things: it **calls a model** to think, and it **calls tools** to act. Conflating them is the most common mistake in AI governance – "sent a prompt to a provider" and "executed a write against production" are not comparable risks.

### 2.1 Model Calls: AI Gateway

The goal is to eliminate the shared API key. While a team shares one provider key, you cannot attribute usage, enforce per-person limits, or revoke one individual.

**Start with a custom domain.** [AI Gateway custom domains](https://developers.cloudflare.com/ai-gateway/configuration/custom-domains/) collapse:
```
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/v1/chat/completions
``` 
into this:
```
https://ai.example.com/openai/v1/chat/completions
```
And, more importantly, give Access something to sit in front of.

**Then put [Access](https://developers.cloudflare.com/ai-gateway/configuration/cloudflare-access/) in front of it.** The Access JWT becomes the request credential, replacing the gateway token, and every request carries `cf.user_id` – the JWT `sub` claim, not the email address – so logs, analytics, and spend are filterable by authenticated user. Cloudflare-only credentials are **stripped before the request is forwarded upstream**. Machine-to-machine callers use service tokens, which carry no `cf.user_id` because they do not represent a person. One consequence to plan for: once the domain is protected, *every* request to it must pass an Access policy, so migrate callers before you flip it on.

**Then watch what that identity reveals.** The [**identity-aware AI Gateway**](https://blog.cloudflare.com/identity-aware-ai-gateway/) flags a session costing more than 2× that user's own 30-day p95 *and* landing in the account's most expensive 1% of sessions – the second condition is what keeps it a rogue-behavior feed rather than a noisy log. Per-user budget buckets block requests or fall back to a cheaper model at the limit.

**Then inspect content.** [**AI Gateway DLP**](https://developers.cloudflare.com/ai-gateway/features/dlp/) shares detection engines and account-level profiles with Cloudflare One DLP – configure a profile once, apply it in both places. It scans prompts, model responses, **tool call arguments and results**, and text in multipart bodies; binary data, base64 images, and external URLs are not inspected. Two caveats: response scanning **buffers the full streamed response** first, increasing time-to-first-token (noticeable in a chat UI, irrelevant for batch agents), and DLP applies per gateway and uniformly, so different inspection requirements mean separate gateways.

The [**Workers AI and AI Gateway unification**](https://blog.cloudflare.com/workers-ai-gateway-unification/) then removes the split between models Cloudflare hosts and models you call – one `env.AI` binding, one wallet, one dashboard, with [credits](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) applying across providers. Governance-wise, one place answers "what did we spend, on which model, for whom".

### 2.2 Tool Calls: MCP Server Portals

Model calls send data out. **Tool calls take action**, and an agent can execute thousands at machine speed with nobody reviewing any of them. This surface deserves the most attention and usually gets the least.

[**MCP Server Portals**](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/) collapse many upstream MCP servers behind one authenticated HTTP endpoint: the user authenticates through your Access identity provider, and the portal returns the tools from enabled servers – each call namespaced, credentialed, and proxied. That gives you:

- **Identity at the door.** Access policies decide who reaches the portal. Per server, `Require user auth` (on by default) decides whether calls run as the individual with their own credentials or under a shared admin credential. Prefer the former: it preserves permission parity with the underlying system.
- **A curated catalog.** Tools can be toggled off, renamed, and re-described; `default_disabled` exposes only an allowlist. An agent cannot call a tool it was never shown.
- **Logs that name the tool** – time, status, server, capability used, duration – Logpushable on Enterprise.
- **Content inspection.** Enable Gateway routing and portal traffic lands in your HTTP logs and can be DLP-scanned.
- **OAuth that non-browser clients can complete.** A CLI, SDK, or agent cannot follow Access's browser redirect – it just gets a `302` with no token. [Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/) turns Access into a standards-compliant OAuth 2.0 authorization server issuing an **opaque** token rather than a JWT, while "Access enforces the same policies as a browser login."

> _**Two gotchas when writing the DLP policy.** The portal **re-originates** each tool call, so Gateway sees the upstream server's hostname, not the portal's. And **DLP AI prompt profiles do not apply to portal traffic**; use standard profiles instead._

**From visibility to enforcement.** A portal only helps if agents use it. Per the [**MCP security updates**](https://blog.cloudflare.com/mcp-security-updates/), Gateway now identifies MCP traffic from the `MCP-Protocol-Version` header on TLS-inspected requests, exposed as the `experimental.is_mcp` selector (beta), and a dashboard separates portal traffic from direct device connections so shadow MCP servers become visible. Onboard the sanctioned ones, then close the bypass:

```text
Action:   Block
Criteria: experimental.is_mcp and not(net.onramp.type == "mcp_portal")
```

That rule converts a portal from a convenience into a control. Detection depends on TLS inspection, so the blind spots above apply here too.

**Why this got easier.** The stateless [**MCP 2026-07-28 specification**](https://blog.cloudflare.com/mcp-v2/) adds `Mcp-Method` and `Mcp-Name` headers, so gateways and WAF rules see which operation is being performed **without parsing JSON bodies**; RFC 8707 audience binding stops a token minted for one server being replayed against another; and RFC 9207 issuer identification prevents confusion between authorization servers. Cloudflare's [Agents SDK](https://developers.cloudflare.com/changelog/post/2026-07-27-agents-sdk-v0.20.0-mcp-sdk-v2/) speaks both it and the 2025 protocols with automatic fallback.

**Context cost is a security lever.** Portals enable [Code Mode](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/#code-mode) by default, replacing the tool list with code-execution tools whose JavaScript runs in an isolated Dynamic Worker, keeping credentials out of model context. Lighter `optimize_context` options exist: `minimize_tools` strips schemas behind an on-demand lookup tool (up to 5x savings), `search_and_execute` hides tools entirely. When exposing a hundred tools costs almost nothing, there is no reason to over-grant to save tokens.

---

## Surface 3: Your Public AI Apps and APIs

**Inspection point: AI Security for Apps.**

This surface reverses direction: your own chatbot or API, receiving prompts from people you do not control. The [**AI Security for Apps reference architecture**](https://developers.cloudflare.com/reference-architecture/architectures/ai-security-for-apps/) describes an AI-specific detection layer that complements – rather than replaces – the [WAF](https://developers.cloudflare.com/waf/), inline at the reverse proxy.

**Discovery comes first.** LLM endpoints are identified by [heuristic analysis](https://blog.cloudflare.com/take-control-of-public-ai-application-security-with-cloudflare-firewall-for-ai/) of traffic characteristics and it routinely surfaces endpoints nobody told the security team about. **Three detection families** then run **in parallel**, each against a model specific to its threat, which is what keeps inline inspection viable on latency:

- **PII exposure** – `cf.llm.prompt.pii_detected`, `cf.llm.prompt.pii_categories`
- **Unsafe topics** – `cf.llm.prompt.unsafe_topic_detected`, `cf.llm.prompt.unsafe_topic_categories`
- **Prompt injection** – `cf.llm.prompt.injection_score`, a 1–99 score where **lower means higher risk**

**Discovery alone does not start scanning, and this is the step people miss.** There are two switches: enable AI Security for Apps in Security Settings – off by default – then, in [Web Assets](https://developers.cloudflare.com/api-shield/management-and-monitoring/), save the discovered endpoint with the `cf-llm` [endpoint label](https://developers.cloudflare.com/api-shield/management-and-monitoring/endpoint-labels/#categories). That label is a **switch, not a selector**: nothing is scanned until it is applied.

As one of the [WAF traffic detections](https://developers.cloudflare.com/waf/detections/), it is sensor-and-responder: "detections are always on once enabled, even if you have not configured any security rules that use them." Every request is scored whether a rule exists or not, and the fields combine with any other Rules language field:

```text
(cf.llm.prompt.injection_score lt 20 and cf.bot_management.score lt 20)
```

Scoring without blocking lets you measure before you enforce. [Log mode versus production mode](https://developers.cloudflare.com/waf/detections/ai-security-for-apps/log-mode-vs-production-mode/) is the deployment decision:

<div style="overflow-x: auto;">

| | Log mode | Production mode |
| --- | --- | --- |
| Rules | Managed ruleset firing on three fixed conditions: PII, unsafe topic, prompt injection | Your own WAF custom rules over the detection fields |
| Logic | No score thresholds | Full score-based and combinatorial logic |
| Logging | Full request body, encrypted via payload logging | Request metadata only – prompts are not logged |
| Response | Default WAF block page | Custom responses, including JSON |

</div>

Start in log mode to tune thresholds, then move to custom rules; both can run at once during the transition, custom rules first.

### Probabilistic Is Not Deterministic

A classic WAF rule is **deterministic**: it matches a known pattern and is auditable by reading it. AI threat detection is **probabilistic** – it reasons about *intent* in natural language, which has no signatures. Three consequences:

- **You tune thresholds, you do not write patterns.** No score catches everything and blocks nothing legitimate; you are picking a point on a curve, which is why log mode exists.
- **Both error types are permanent.** An attacker will eventually phrase something below your threshold, and a genuine user something above it. Plan the appeal path before you enable blocking.
- **It does not replace the deterministic layer.** Rate limiting, bot scoring, schema validation, and managed rulesets remain the floor; an injection score says nothing about credential stuffing.

Use both kinds of evidence in a [layered-security approach](https://davidtofan.com/articles/cloudflare-l7-security-recommendations/): deterministic controls for what a request *is*, probabilistic ones for what it appears to be *trying to do*.

### Who Is Reading Your Content

[**AI Crawl Control**](https://developers.cloudflare.com/ai-crawl-control/) answers a different question: not who is attacking your AI app, but who is consuming your content to build theirs. It gives per-crawler allow and block policies, tracks which crawlers honor `robots.txt`, and offers pay per crawl. The [**attribution dashboard**](https://blog.cloudflare.com/attribution-business-insights/) adds **crawl-to-referral ratios** per operator – crawls versus visitors sent back, with observed extremes as lopsided as 50,000:1 – and classifies crawlers as Training, Search, or Agent. (The flip side is being legible to the agents you *do* want: [Making Your Website AI Agent Ready](https://davidtofan.com/articles/ai-agent-ready-website-cloudflare-guide/).)

**Mind the execution order.** A terminating action in the [Ruleset Engine](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/) ends evaluation immediately, and within a phase custom rules run top to bottom on first match. AI Crawl Control implements its blocks *as* WAF custom rules appended at the end of yours, so an earlier Allow or Skip lets a crawler straight past: "move the AI Crawl Control rule to the top of your WAF custom rules," as the [docs](https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/) put it. Pay per crawl runs after WAF, so anything already blocked never reaches it.

One limit worth naming: Cloudflare knows whether an endpoint is protected, not what the application behind it can reach. The [Wiz integration](https://www.wiz.io/integrations/cloudflare) feeds protection status into the Wiz Security Graph, making "which AI endpoints are both exposed *and* able to reach sensitive data?" a query.

> _WAF rulesets, Advanced Rate Limiting, Bot Management, API Shield, and DDoS protection are the foundation underneath all of this, covered in [The CISO's Guide to Securing AI](https://davidtofan.com/articles/ciso-guide-securing-ai-cloudflare/)._

---

## Surface 4: SaaS AI Providers

**Inspection point: CASB – out-of-band, over API.**

This is the surface that works when nothing is [proxied](https://developers.cloudflare.com/dns/proxy-status/): no device client, no gateway hostname, no TLS decryption. CASB connects to the provider's API and inspects what is already there. [Cloudflare One's integrations](https://developers.cloudflare.com/cloudflare-one/integrations/cloud-and-saas/) include **Anthropic** and **OpenAI** directly, plus the AI features embedded in suites you already run – Gemini in Google Workspace, Copilot in Microsoft 365 – alongside Slack, GitHub, Bitbucket, Atlassian, Salesforce, ServiceNow, Box, Dropbox, AWS S3, and GCP Cloud Storage.

It answers different questions from inline inspection:

- Inline tells you **what is being sent right now**; CASB tells you **what is already in the tenant** – files, shared conversations, retained data.
- Inline requires traffic to route through Cloudflare; CASB works for **unmanaged devices and personal networks**, where it never will.
- Sharing settings, organization membership, seat sprawl, and retention configuration are invisible on the wire, and visible only through the API.

Deploy it alongside inline controls, then ask providers the right questions. Cloudflare's [Responsible AI](https://www.cloudflare.com/trust-hub/responsible-ai/) page shows what a clear answer looks like: it states that Cloudflare does not train its own LLMs and does not use customer content to train any, that threat-detection models are trained on network traffic patterns rather than customer content, and that third-party models on Workers AI carry vendor responsibility for EU AI Act compliance. It sits inside a [**Trust Hub**](https://www.cloudflare.com/trust-hub/) collecting certifications, attestations, and sub-processor lists – use that as the shape of the questionnaire you send your own providers. "We have a CASB integration" and "we know what they do with our data" are separate assurances.

---

## Building and Deploying Agents Safely

Everything so far governs AI your organization *consumes*. This is about AI your teams *build*, where the goal is to make the safe path the default rather than reviewing each agent forever.

**Isolated execution.** The [**Sandbox SDK 1.0 preview**](https://developers.cloudflare.com/sandbox/1-0-preview/) (`@cloudflare/sandbox@next`) runs code inside Cloudflare Containers. `exec()` takes an argument array and returns a process handle as soon as the process starts:

```javascript
const process = await sandbox.exec(["npm", "test"]);
const result = await process.output({ encoding: "utf8" });
console.log(result.stdout, result.exitCode);
```

The same handle serves a short command or a long-running service, alongside `logs()`, `waitForExit()`, `kill()`, and PTY terminals. A sandbox keeps a stable ID while the container behind it can be replaced – and when that happens, processes fail closed rather than reattaching elsewhere. [**`@cloudflare/computer`**](https://blog.cloudflare.com/cloudflare-computer/) sits a level above, routing each piece of work to a lightweight isolate or a full Linux container (the design target is needing a container for **less than 10% of an agent's work**). For security teams the relevant property is that its operations are "gated, audited and observed" – the audit trail belongs to the runtime, not to whoever wrote the agent.

**A reference pattern.** The [**enterprise AI agent workspace**](https://developers.cloudflare.com/reference-architecture/diagrams/ai/enterprise-ai-agent-workspace/) diagram assembles these into something you can copy: work arrives through several channels (web app, chat, email, webhooks, schedules), Access authenticates browser sessions while each asynchronous channel validates its own signature, and the agent restores state from Durable Objects before calling **approved models through AI Gateway** and **approved tools through an MCP Server Portal**. Its governing principle is the whole design in one line: **treat model output, tool output, and generated code as untrusted, and apply controls at platform boundaries rather than inside generated code.**

**An open-source starting point.** [**Cloudflare OS**](https://blog.cloudflare.com/cloudflare-os/) is the agent workspace Cloudflare built for its own employees, open-sourced for your own account. Its security model is worth studying whether or not you deploy it: every agent "starts with access to nothing"; [**gatekeepers**](https://github.com/cloudflare/cloudflare-os#gatekeepers-a-capability-based-security-layer) are service-specific Workers that mediate each resource access and hold the credentials, so agents never obtain long-lived tokens; and observation tracking **propagates access restrictions through generated outputs**, so a collaborator opening a document is checked against the underlying resources rather than inheriting laundered data.

### How Cloudflare Runs This on Itself

Cloudflare's [**internal stack**](https://blog.cloudflare.com/internal-ai-engineering-stack/) runs this pattern for 3,683 employees – 60% of the company – with a proxy Worker injecting provider keys server-side, AI Gateway enforcing zero data retention, and one MCP Server Portal aggregating 13 servers and 182+ tools. Of the [five governance principles](https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/) behind it, the fifth is worth adopting verbatim as policy language:

> _You should never have more permission with systems of record when using AI._

Standards are then machine-enforced: the [**Engineering Codex**](https://blog.cloudflare.com/engineering-standards-enforcement/) holds them as RFCs using RFC 2119 keywords and a proposed → approved → **enforced** lifecycle, and an [**AI code reviewer**](https://blog.cloudflare.com/ai-code-review/) applies them across 48,095 merge requests a month at a median $0.98 per review. One detail there is directly transferable: **user-controlled content is sanitized by stripping XML boundary tags entirely** before it reaches the reviewer's structured prompt. The [**Agents Week review**](https://blog.cloudflare.com/agents-week-review-august-2026/) indexes the rest.

---

## Summary

<div style="overflow-x: auto;">

| Surface | Inspection point | What you see | What you enforce |
| --- | --- | --- | --- |
| [1 – Workforce in browsers and IDEs](#surface-1-workforce-in-browsers-and-ides) | Secure Web Gateway | Shadow AI/MCP discovery, AI Security report, HTTP logs | Block, isolate, DLP on uploads and prompts |
| [2.1 – Agents calling model APIs](#21-model-calls-ai-gateway) | AI Gateway | Per-user logs via `cf.user_id`, cost, anomaly feed | Access policies, spend limits, DLP flag or block |
| [2.2 – MCP clients calling tools](#22-tool-calls-mcp-server-portals) | MCP Server Portal | Per-tool request logs, shadow MCP dashboard | Curated catalog, per-user auth, portal-only rule |
| [3 – Customers hitting your AI app](#surface-3-your-public-ai-apps-and-apis) | AI Security for Apps | LLM endpoint discovery, threat scores, crawler analytics | Injection, PII and unsafe-topic rules; crawler policy |
| [4 – Data at rest in SaaS tenants](#surface-4-saas-ai-providers) | CASB (out-of-band API) | Misconfiguration and exposure findings | Posture remediation, provider data-handling review |

</div>

### Where to Start

Order matters more than completeness:

1. **Fix the on-ramps, and prepare properly for TLS decryption.** The longest step, and the one that sinks projects when treated as a checkbox: deploy the [device client](https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/) through your [MDM](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/deployment/); distribute the [root certificate](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/user-side-certificates/) to the OS trust store *and* to applications that keep their own; and write the [Do Not Inspect](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/#do-not-inspect) policies for pinned and mTLS applications before your users find them, recording what those exemptions cost you in visibility.
2. **Discover before you block.** Run Gateway and the AI Security report for a few weeks, and classify applications rather than guessing.
3. **Give agents a governed path for models** – an AI Gateway custom domain, callers migrated off shared API keys, then Access on.
4. **Give agents a governed path for tools** – approved MCP servers behind a portal with a curated catalog and per-user auth.
5. **Only then, close the bypass.** Blocking non-portal MCP traffic before step 4 just pushes people onto unmanaged devices.
6. **Run Surfaces 3 and 4 in parallel**, and **make the safe build path the easy one** – sandboxed execution, zero-permission defaults, gatekeepered credentials.

The connecting idea across all four surfaces is that **identity is the primary control, and the network is how you attach it**. Every capability here – `cf.user_id` on a model call, per-user OAuth on a tool call, an Access policy on a gateway hostname – exists to answer one question: which human is accountable for what this agent just did?

---

## Appendix: Let an Agent Drive Cloudflare

If you are going to secure AI, use it. [**Cloudflare Agent Setup**](https://developers.cloudflare.com/agent-setup/) wires the common coding agents into [**Cloudflare's own MCP servers**](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/) – a primary server covering 2,500+ API endpoints via [code mode](https://blog.cloudflare.com/code-mode-mcp/) (about 1,000 tokens instead of 1.17 million), plus focused ones for docs, observability, AI Gateway logs, CASB findings, [DEX troubleshooting](https://blog.cloudflare.com/ai-troubleshoot-warp-and-network-connectivity-issues/), [GraphQL analytics](https://developers.cloudflare.com/analytics/types-of-analytics/), audit logs, and Radar – with the [**Cloudflare One stack**](https://blog.cloudflare.com/cloudflare-one-stack/) skills for Zero Trust work.

For skills beyond Cloudflare, [skills.sh](https://www.skills.sh/) is an open, vendor-neutral registry supporting 19+ coding agents.

**Start read-only.** Scope the [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), and read what a skill does before installing it. A read-only token is already most of the value: an agent that can read your Gateway logs, AI Gateway spend, and CASB findings can investigate an anomaly, explain a policy's blast radius, and draft the rule, while a human still applies it.

---

## Disclaimer

Educational purposes only.

This blog post is independent and not affiliated with, endorsed by, or necessarily reflective of the opinions of Cloudflare or any other entities mentioned. Product capabilities described here reflect publicly available documentation and blog posts at the time of writing; several features referenced are explicitly in preview or beta and may change.

This blog post was partially drafted and refined with AI assistance.
