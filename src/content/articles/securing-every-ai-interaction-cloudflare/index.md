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

> _This article continues two earlier pieces: [Cybersecurity and Artificial Intelligence (AI) (2023)](https://davidtofan.com/articles/ai-cybersecurity/) introduced the Zero Trust approach to AI, and [The CISO's Guide to Securing AI (2025)](https://davidtofan.com/articles/ciso-guide-securing-ai-cloudflare/) mapped ten concrete threats to Cloudflare controls. This third installment changes the lens: instead of organizing by threat, it organizes by **who or what is interacting with AI** – because each of those actors reaches AI over a different path, and each path has a different inspection point._

Most organizations already have an AI usage policy. Very few can tell you whether it is actually being followed.

The gap is not a policy problem, it is a visibility problem. An employee pasting customer data into a chatbot, a coding agent calling an LLM API from an IDE, an MCP client invoking a tool against an internal system, and a customer-facing chatbot answering a prompt injection are four completely different traffic flows. They do not share a protocol, an identity model, or a logging surface – so a control that catches one will silently miss the other three.

This article walks through all four surfaces, the Cloudflare inspection point that governs each, and how they compose into a single enforceable policy. It closes with how to let developer teams build and deploy agents safely, in sandboxed environments, without becoming the team that says no.

---

## Before You Start

Two things are worth doing before you touch a single policy.

### 1. Let Your Agent Drive Cloudflare

If you are going to secure AI, start by using it. Cloudflare ships first-party support for driving its entire platform from a coding agent, and it dramatically shortens the distance between reading this article and having policies in production.

Start with [**Cloudflare Agent Setup**](https://developers.cloudflare.com/agent-setup/). It provides per-agent installation guides for Claude Code, Codex, Cursor, GitHub Copilot, VS Code, Windsurf, OpenCode, and others, wiring up two things:

- **Skills** – reusable prompt packages that teach an agent a specific domain.
- **MCP servers** – the standard that lets an agent call external tools and APIs.

Connect to [**Cloudflare's own MCP servers**](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/). The primary one at `mcp.cloudflare.com/mcp` exposes over 2,500 API endpoints using a search-and-execute **code mode** pattern: rather than loading thousands of individual tool definitions into context, the model writes JavaScript against a typed representation of the OpenAPI spec. That [difference](https://blog.cloudflare.com/code-mode-mcp/) is roughly 1,000 tokens instead of 244,000. Alongside it sit focused servers worth adding selectively:

<div style="overflow-x: auto;">

| Server | Endpoint | Use it for |
| --- | --- | --- |
| Documentation | `docs.mcp.cloudflare.com/mcp` | Grounding answers in current docs |
| Observability | `observability.mcp.cloudflare.com/mcp` | Debugging Workers logs and analytics |
| AI Gateway | `ai-gateway.mcp.cloudflare.com/mcp` | Log search and prompt analysis |
| CASB | `casb.mcp.cloudflare.com/mcp` | SaaS security misconfigurations |
| DEX | `dex.mcp.cloudflare.com/mcp` | [Troubleshooting device, WARP, and connectivity issues](https://blog.cloudflare.com/ai-troubleshoot-warp-and-network-connectivity-issues/) in natural language |
| GraphQL | `graphql.mcp.cloudflare.com/mcp` | Querying the [GraphQL Analytics API](https://developers.cloudflare.com/analytics/types-of-analytics/) for trends across products |
| Audit Logs | `auditlogs.mcp.cloudflare.com/mcp` | Querying account activity |
| Radar | `radar.mcp.cloudflare.com/mcp` | Internet and threat trends |

</div>

Two of those are worth calling out because they change the shape of everyday work. The **DEX** server answers questions like "why is this user's device slow?" without building a data pipeline first – in Cloudflare's own example it traced a sluggish internal wiki to a 616 ms average DNS response time against a 50 ms baseline. It ships alongside a [WARP diagnostic analyzer](https://blog.cloudflare.com/ai-troubleshoot-warp-and-network-connectivity-issues/) that reads client diagnostic files and surfaces the problematic events directly. The **GraphQL** server exposes the [GraphQL Analytics API](https://developers.cloudflare.com/analytics/types-of-analytics/), which is how you get an agent to analyse trends across HTTP traffic, security events, bot scores, and Workers rather than reading dashboards one filter at a time.

For Zero Trust work specifically, add the [**Cloudflare One stack**](https://blog.cloudflare.com/cloudflare-one-stack/) – a library of agent skills covering the platform. The `cloudflare-one` skill handles product guidance, network diagram generation, and troubleshooting; `cloudflare-one-migration` translates configurations from other vendors. Combined with the code mode MCP server, an agent can analyze live traffic, recommend rules, and investigate anomalies in Gateway HTTP logs against your actual account.

Two more sources of agent context: the [**docs directory**](https://developers.cloudflare.com/directory/?group=AI&group=Developer+platform) is a browsable catalog of every AI and Developer Platform product, and [**`agents/llms-full.txt`**](https://developers.cloudflare.com/agents/llms-full.txt) is the full Agents SDK documentation in a single agent-readable file. For skills beyond Cloudflare, [**skills.sh**](https://www.skills.sh/) is an open, vendor-neutral registry supporting 19+ coding agents, installable with `npx skills add <owner/repo>`.

> _A note on scope: giving an agent authenticated access to your Cloudflare account is a real privilege grant. Treat it like any other administrative credential – scope the [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), and read what a skill does before installing it._

**Start read-only.** A token with only read permissions is already most of the value, and it removes the entire category of "the agent changed something I did not expect". An agent that can read your Gateway HTTP logs, your AI Gateway spend, your CASB findings, and your GraphQL analytics can investigate an anomaly, explain a policy's blast radius, draft the rule, and tell you where it should sit in the order of enforcement. A human still reads it, understands it, and applies it. That is a good place to stay until you have built confidence, and for many teams it is a good place to stay for a long time – the bottleneck in security work is rarely typing the rule, it is knowing which rule to write.

### 2. Understand the Flow

Everything in this article is easier to reason about once you can see where each kind of AI traffic enters, what inspects it, and where it exits.

<figure style="margin: 2rem 0; overflow-x: auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 460" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:880px;height:auto;font-family:system-ui,sans-serif;display:block;margin:0 auto;" role="img" aria-label="High-level flow diagram showing employees, coding agents with MCP clients, and public clients reaching AI models, MCP servers, and applications through Cloudflare inspection points: Access, Secure Web Gateway, AI Gateway, MCP Server Portal, AI Security for Apps, DLP, and out-of-band CASB.">
<title>High-level flow of AI and MCP interactions through Cloudflare</title>
<style>
  .box-stroke { stroke: currentColor; stroke-width: 1.5; fill: none; }
  .cf-box { stroke: #f6821f; stroke-width: 2; fill: #f6821f; fill-opacity: 0.06; }
  .cf-inner { stroke: #f6821f; stroke-width: 1.5; fill: #f6821f; fill-opacity: 0.05; }
  .label { fill: currentColor; font-size: 13px; font-weight: 500; }
  .label-sm { fill: currentColor; font-size: 11px; opacity: 0.7; }
  .sub { fill: currentColor; font-size: 9.5px; opacity: 0.6; }
  .edge-label { fill: currentColor; font-size: 10px; opacity: 0.6; }
  .cf-label { fill: #f6821f; font-size: 15px; font-weight: 700; }
  .cf-box-label { fill: #f6821f; font-size: 12px; font-weight: 600; }
  .cf-sub { fill: currentColor; font-size: 9.5px; opacity: 0.65; }
  .arrow { stroke: currentColor; stroke-width: 1.5; fill: none; marker-end: url(#arrowhead); }
  .arrow-cf { stroke: #f6821f; stroke-width: 1.5; fill: none; marker-end: url(#arrowhead-cf); }
  .arrow-oob { stroke: #f6821f; stroke-width: 1.5; fill: none; stroke-dasharray: 4 3; marker-end: url(#arrowhead-cf); marker-start: url(#arrowstart-cf); }
</style>
<defs>
  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="currentColor"/></marker>
  <marker id="arrowhead-cf" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#f6821f"/></marker>
  <marker id="arrowstart-cf" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto"><path d="M8,0 L0,3 L8,6" fill="#f6821f"/></marker>
</defs>
<!-- Left column: who interacts -->
<rect x="8" y="76" width="144" height="48" rx="6" class="box-stroke"/>
<text x="80" y="98" text-anchor="middle" class="label">Users / Employees</text>
<text x="80" y="114" text-anchor="middle" class="sub">browsers, IDEs</text>
<rect x="8" y="186" width="144" height="56" rx="6" class="box-stroke"/>
<text x="80" y="206" text-anchor="middle" class="label">Coding Agents /</text>
<text x="80" y="222" text-anchor="middle" class="label">MCP Clients</text>
<text x="80" y="236" text-anchor="middle" class="sub">automations, CI</text>
<rect x="8" y="326" width="144" height="48" rx="6" class="box-stroke"/>
<text x="80" y="348" text-anchor="middle" class="label">Public Clients</text>
<text x="80" y="364" text-anchor="middle" class="sub">customers, crawlers</text>
<!-- Arrows in -->
<line x1="154" y1="100" x2="255" y2="140" class="arrow"/>
<text x="206" y="92" text-anchor="middle" class="edge-label">on-ramp required</text>
<text x="206" y="104" text-anchor="middle" class="edge-label">CF One Client</text>
<line x1="154" y1="204" x2="255" y2="192" class="arrow"/>
<line x1="154" y1="226" x2="255" y2="244" class="arrow"/>
<text x="204" y="219" text-anchor="middle" class="edge-label">HTTPS</text>
<line x1="154" y1="348" x2="255" y2="296" class="arrow"/>
<text x="212" y="334" text-anchor="middle" class="edge-label">HTTPS (inbound)</text>
<!-- Cloudflare panel -->
<rect x="245" y="20" width="400" height="375" rx="10" class="cf-box"/>
<text x="445" y="46" text-anchor="middle" class="cf-label">Cloudflare</text>
<line x1="259" y1="58" x2="631" y2="58" stroke="#f6821f" stroke-width="1" opacity="0.4"/>
<!-- Access -->
<rect x="259" y="70" width="170" height="40" rx="6" class="cf-inner"/>
<text x="344" y="89" text-anchor="middle" class="cf-box-label">Access (ZTNA)</text>
<text x="344" y="103" text-anchor="middle" class="cf-sub">identity on every request</text>
<!-- Inspection points -->
<rect x="259" y="118" width="170" height="44" rx="6" class="cf-inner"/>
<text x="344" y="137" text-anchor="middle" class="cf-box-label">Secure Web Gateway</text>
<text x="344" y="152" text-anchor="middle" class="cf-sub">needs TLS decryption</text>
<rect x="259" y="170" width="170" height="44" rx="6" class="cf-inner"/>
<text x="344" y="189" text-anchor="middle" class="cf-box-label">AI Gateway</text>
<text x="344" y="204" text-anchor="middle" class="cf-sub">per-user attribution, spend</text>
<rect x="259" y="222" width="170" height="44" rx="6" class="cf-inner"/>
<text x="344" y="241" text-anchor="middle" class="cf-box-label">MCP Server Portal</text>
<text x="344" y="256" text-anchor="middle" class="cf-sub">curated tools, per-user auth</text>
<rect x="259" y="274" width="170" height="44" rx="6" class="cf-inner"/>
<text x="344" y="293" text-anchor="middle" class="cf-box-label">AI Security for Apps</text>
<text x="344" y="308" text-anchor="middle" class="cf-sub">injection, PII, unsafe topics</text>
<!-- Workers -->
<rect x="259" y="326" width="250" height="48" rx="6" class="cf-inner"/>
<text x="384" y="346" text-anchor="middle" class="cf-box-label">Workers · Sandbox · Containers</text>
<text x="384" y="362" text-anchor="middle" class="cf-sub">isolated execution for agents you build</text>
<!-- CASB + DLP -->
<rect x="470" y="70" width="161" height="60" rx="6" class="cf-inner"/>
<text x="550" y="94" text-anchor="middle" class="cf-box-label">CASB</text>
<text x="550" y="112" text-anchor="middle" class="cf-sub">posture, data at rest</text>
<rect x="470" y="150" width="161" height="100" rx="6" class="cf-inner"/>
<text x="550" y="183" text-anchor="middle" class="cf-box-label">DLP</text>
<text x="550" y="202" text-anchor="middle" class="cf-sub">prompts, files,</text>
<text x="550" y="216" text-anchor="middle" class="cf-sub">tool calls, responses</text>
<text x="550" y="234" text-anchor="middle" class="cf-sub">flag or block</text>
<line x1="550" y1="132" x2="550" y2="148" class="arrow-oob"/>
<text x="596" y="144" text-anchor="middle" class="edge-label">out-of-band</text>
<!-- Inspection points into DLP -->
<line x1="431" y1="140" x2="466" y2="175" class="arrow-cf"/>
<line x1="431" y1="192" x2="466" y2="195" class="arrow-cf"/>
<line x1="431" y1="244" x2="466" y2="215" class="arrow-cf"/>
<!-- Arrows out -->
<line x1="633" y1="100" x2="695" y2="100" class="arrow-cf"/>
<text x="664" y="93" text-anchor="middle" class="edge-label">API</text>
<line x1="633" y1="180" x2="695" y2="160" class="arrow-cf"/>
<line x1="633" y1="200" x2="695" y2="220" class="arrow-cf"/>
<line x1="633" y1="220" x2="695" y2="280" class="arrow-cf"/>
<line x1="431" y1="296" x2="695" y2="340" class="arrow-cf"/>
<!-- Right column: destinations -->
<rect x="700" y="80" width="170" height="40" rx="6" class="box-stroke"/>
<text x="785" y="105" text-anchor="middle" class="label">SaaS AI Providers</text>
<rect x="700" y="140" width="170" height="40" rx="6" class="box-stroke"/>
<text x="785" y="165" text-anchor="middle" class="label">AI Models (LLM APIs)</text>
<rect x="700" y="200" width="170" height="40" rx="6" class="box-stroke"/>
<text x="785" y="225" text-anchor="middle" class="label">MCP Servers</text>
<rect x="700" y="260" width="170" height="40" rx="6" class="box-stroke"/>
<text x="785" y="285" text-anchor="middle" class="label">Internal Apps / SaaS</text>
<rect x="700" y="320" width="170" height="40" rx="6" class="box-stroke"/>
<text x="785" y="345" text-anchor="middle" class="label">Your AI Apps / Models</text>
<!-- Column labels -->
<text x="80" y="425" text-anchor="middle" class="label-sm">Who interacts</text>
<text x="785" y="425" text-anchor="middle" class="label-sm">What they reach</text>
</svg>
<figcaption style="text-align:center;font-size:0.85rem;opacity:0.65;margin-top:0.5rem;">Four interaction surfaces, four inspection points. Surface 1 only exists once an <a href="https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/" target="_blank" rel="nofollow noopener external" style="color:inherit;text-decoration:underline;">on-ramp</a> steers traffic in. Everything inline passes through <a href="https://developers.cloudflare.com/cloudflare-one/traffic-policies/order-of-enforcement/" target="_blank" rel="nofollow noopener external" style="color:inherit;text-decoration:underline;">Gateway's order of enforcement</a>; CASB reaches SaaS providers out-of-band over API.</figcaption>
</figure>

Read it left to right. On the left, three kinds of actors. In the middle, Cloudflare, with **Access** establishing identity across everything and four distinct inspection points beneath it. On the right, the destinations those actors are trying to reach.

One thing the diagram makes deliberately explicit: **the workforce path only exists if you build an on-ramp for it.** Employees in browsers and IDEs do not reach the Secure Web Gateway (SWG) by accident. Their traffic has to be steered there – normally by the [Cloudflare One Client](https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/) (formerly WARP) tunnelling over MASQUE, or for unmanaged machines by a PAC-file proxy endpoint. Without one of those [connectivity options](https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/) deployed, Surface 1 has no inspection point, and every control described in it is theoretical. The other three surfaces do not share this dependency: an agent reaches AI Gateway because you gave it that hostname, a customer reaches AI Security for Apps because your domain is proxied, and CASB needs no traffic path whatsoever but an API integration.

The second important detail is that the four inspection points are necessarily **not interchangeable**. Which one applies is determined by how the traffic arrives:

<div style="overflow-x: auto;">

| If the interaction is… | It is inspected by… | Because… |
| --- | --- | --- |
| A human in a browser or IDE | Secure Web Gateway | Traffic is steered in by an on-ramp – device client or proxy endpoint |
| An agent calling a model API | AI Gateway | The agent points at your gateway hostname |
| An MCP client calling tools | MCP Server Portal | The client connects to one authenticated endpoint |
| A customer hitting your chatbot | AI Security for Apps | Traffic arrives inbound at your reverse proxy |
| Data sitting inside a SaaS tenant | CASB | No traffic is proxied at all – it is an API scan |

</div>

For broader background on where AI meets defensive security, Cloudflare's learning center entry on [AI for cybersecurity](https://www.cloudflare.com/learning/ai/ai-for-cybersecurity/) is a reasonable primer.

---

## Getting the Traffic to Cloudflare

This is the step most AI security projects skip, and the one that determines whether any of the rest works. An inspection point that never sees the traffic enforces nothing.

### On-Ramps

Cloudflare One supports several [connectivity options](https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/), and the right choice depends on what you are trying to cover:

- **Device client** – the Cloudflare One Client (formerly WARP) encrypts device traffic using MASQUE with [post-quantum cryptography (PQC)](https://developers.cloudflare.com/ssl/post-quantum-cryptography/), or WireGuard. This is the on-ramp for laptops running browsers and IDEs.
- **Proxy endpoint** – applies Gateway policies via a PAC file, with no software installed on the device. Useful for contractors and unmanaged machines.
- **Cloudflare Mesh** – bidirectional connectivity where every enrolled device and node receives a private Mesh IP, preserving source IPs. Relevant for servers and CI runners that call AI APIs.
- **Cloudflare Tunnel** – an outbound-only connector that exposes internal services without opening inbound ports. This is how a self-hosted model or internal MCP server becomes reachable without publishing it.
- **Cloudflare WAN** – GRE and IPsec tunnels for site-to-site connectivity from branch offices and data centers.

### Order of Enforcement

[Gateway traffic policies](https://developers.cloudflare.com/cloudflare-one/traffic-policies/) are evaluated in a fixed sequence, and understanding it prevents a class of "my rule doesn't fire" problems. The [order of enforcement](https://developers.cloudflare.com/cloudflare-one/traffic-policies/order-of-enforcement/) runs DNS → resolver → egress → network → HTTP. Within HTTP policies specifically, the sub-order is:

```text
1. Do Not Inspect
2. Isolate
3. Allow / Block / Do Not Scan
4. Body inspection (DLP and antivirus)
```

Evaluation follows **first match**: once traffic hits an Allow or Block, evaluation stops and nothing later can override it. Put specific AI policies above general catch-alls, and remember that a [Do Not Inspect](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/#do-not-inspect) rule placed high could neutralize a DLP rule below it for that traffic.

### Be Honest About the Blind Spots

Inspecting HTTPS requires [TLS decryption](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/tls-decryption/), which means installing a root CA on managed devices. Decryption happens in memory in Cloudflare's data centers.

**The certificate does not stop at the OS trust store, and this is the operational detail that derails rollouts.** Plenty of the tooling that matters most for AI work maintains its own trust store and will simply fail with certificate errors until you tell it about the Cloudflare CA. The [manual deployment guide](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/user-side-certificates/manual-deployment/#5-add-the-certificate-to-applications) covers most examples; the ones that bite in practice:

<div style="overflow-x: auto;">

| Application | What it needs |
| --- | --- |
| cURL | Uses the OS keychain, so an OS-level install is usually enough |
| Docker | The certificate must be copied **into the image** at build time and the container's own trust store updated |
| Python | Append to the `certifi` bundle, or set `SSL_CERT_FILE` and `REQUESTS_CA_BUNDLE` |
| Node / npm | `npm config set cafile [PATH]`, or export `NODE_EXTRA_CA_CERTS` |
| Git | `git config --global http.sslcainfo [PATH]` |
| Rust | `CARGO_HTTP_CAINFO` |
| AWS CLI | `ca_bundle` in the config file, or `AWS_CA_BUNDLE` |

</div>

Docker is the one worth planning for deliberately, because containerised build agents and CI runners are exactly where AI tooling now lives, and a container that has never heard of your root CA will fail every outbound HTTPS call the moment inspection turns on.

Beyond trust stores, TLS decryption does not work everywhere, and the exceptions matter more for AI traffic than for ordinary web browsing:

- **Certificate pinning** – applications that pin certificates will not trust the intermediary. A number of desktop AI clients and IDE extensions do this.
- **Mutual TLS** – Gateway cannot forward the client certificate to the origin, so the handshake fails.
- **Self-signed certificates** and **ECH/ESNI** – the first fails validation, the second hides the SNI needed for policy matching.

The workaround is a Do Not Inspect policy for the affected application, and the cost is real: you lose HTTP logging, DLP, and antivirus scanning for that traffic. **This is the single best argument for the next section.** When you cannot inspect an agent's traffic on the wire, you stop trying, and instead make the agent point at an endpoint you control – an AI Gateway hostname or an MCP Server Portal. Governance moves from the network layer to the application layer, where pinning is irrelevant.

### Knowing How Traffic Arrived

A recent addition worth building policies around: the [**Traffic Source selector**](https://developers.cloudflare.com/changelog/post/2026-08-12-traffic-source-selector/) exposes `net.onramp.type`, letting you write rules that depend on how traffic reached Cloudflare:

```text
device_client    Cloudflare One Client (formerly WARP)
mesh             Mesh connector
cloudflare_wan   Magic WAN
proxy_endpoint   PAC file proxy
clientless_rdp   Clientless RDP session
agentless_biso   Clientless Browser Isolation
mcp_portal       MCP Server Portal
```

So a policy that applies only to managed-device traffic becomes:

```text
net.onramp.type == "device_client"
```

A companion selector, `net.is_isolated`, identifies sessions running inside Remote Browser Isolation. The `mcp_portal` value is the one that turns MCP governance from advisory into enforceable, as covered further below.

Finally, [**Worker egress now flows through Gateway**](https://developers.cloudflare.com/changelog/post/2026-06-05-gateway-egress/). Workers using `cf1:network` VPC bindings send their public Internet traffic through Gateway, where Zero Trust policies apply and requests are logged in DNS, HTTP, and Network logs. Practically: **the agents your own team builds now inherit the same policies as your employees' laptops** – no separate governance story required.

---

## Surface 1: The Workforce – Browsers and IDEs

**Inspection point: Secure Web Gateway (SWG).**

This is the surface everyone starts with, and the one where a policy-first framing beats a blocking-first one. The goal is not to prevent employees from using AI. It is to know what they are using, decide what is acceptable, and make the acceptable path the easy one.

### Discover, Then Classify

Start by looking. Gateway's [Shadow IT discovery](https://developers.cloudflare.com/cloudflare-one/insights/analytics/shadow-it-discovery/) surfaces the AI applications your users are actually reaching, and each discovered application can be moved through a review workflow – **Unreviewed → In Review → Unapproved → Approved**. That [status](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/#application-approval-status) is not cosmetic; it becomes a policy selector and an analytics dimension.

The [**AI Security report**](https://developers.cloudflare.com/cloudflare-one/insights/analytics/ai-security/) in Cloudflare One aggregates this into five panels worth checking weekly:

- **Top 5 visited AI applications**, with adoption trends, so new tools show up before they become entrenched.
- **Application status** counts across the four review states.
- **Data transferred by review status** – the panel that answers "how much data is going to tools we have not approved?"
- **MCP servers behind Access policies** over time, to verify newly deployed servers stay protected.
- **Access login events** to MCP servers, for spotting unusual authentication patterns.

It requires Gateway inspecting user traffic and MCP servers protected by Access. Without those two prerequisites the report is empty, which is itself a useful signal.

### Control What Leaves

[**Data Loss Prevention**](https://developers.cloudflare.com/cloudflare-one/data-loss-prevention/) is the control that makes an AI usage policy enforceable rather than aspirational. DLP profiles define what to detect, detection entries identify the patterns, and Data Classification organizes findings at scale. Applied through Gateway HTTP policies with TLS decryption enabled, DLP scans request bodies – chat messages, file uploads, form submissions – before they reach a provider. Scanning happens in memory and content is never written to disk. For investigation, configure [payload logging](https://developers.cloudflare.com/cloudflare-one/data-loss-prevention/dlp-policies/logging-options/) for encrypted copies, or Logpush to export matching requests to your SIEM.

Where DLP is too blunt, **Remote Browser Isolation (RBI)** is the middle path. For an AI tool you are willing to allow but not fully trust, [isolation](https://developers.cloudflare.com/cloudflare-one/remote-browser-isolation/isolation-policies/#policy-settings) lets you permit reading and typing while disabling file upload, download, and copy-paste. This can still be combined with DLP.

### The IDE Problem

Browser traffic to a chat interface is straightforward. Coding agents in an IDE are not.

Some of that traffic is ordinary HTTPS that Gateway inspects cleanly. Some of it comes from clients that pin certificates or use self-signed certificates, where a Do Not Inspect policy is the only way to keep the tool working – and at that point SWG gives you a connection record and nothing more. You will see that an agent talked to a provider. You will not see what it said.

That limitation is not a gap in the product; it is a property of the transport. The answer is to stop inspecting and start intermediating, which is Surface 2.

> _For the threat-by-threat treatment of the Browser (HTTP/S) surface – phishing, deepfakes, social engineering, and the DDoS and rate-limiting angles – see [The CISO's Guide to Securing AI](https://davidtofan.com/articles/ciso-guide-securing-ai-cloudflare/). This article does not repeat that ground._

---

## Surface 2: Agents and MCP Clients

**Inspection points: AI Gateway (model calls) and MCP Server Portal (tool calls).**

An agent does two fundamentally different things, and they need different controls. It **calls a model** to think, and it **calls tools** to act. Conflating them is the most common architectural mistake in AI governance: the risk profile of "sent a prompt to a provider" and "executed a write against a production system" are not remotely comparable.

### 2.1 Model Calls – AI Gateway

The goal here is to eliminate the shared API key. As long as a team shares one provider key, you cannot attribute usage, enforce per-person limits, or revoke access for one individual.

**Step one is a custom domain.** [AI Gateway custom domains](https://developers.cloudflare.com/ai-gateway/configuration/custom-domains/) let you serve the gateway from your own hostname, collapsing this:

```text
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/v1/chat/completions
```

into this:

```text
https://ai.example.com/openai/v1/chat/completions
```

Beyond being cleaner, the custom domain is the **prerequisite** for identity, because it gives Access (ZTNA) something to sit in front of.

**Step two is Access.** [Putting AI Gateway behind Cloudflare Access](https://developers.cloudflare.com/ai-gateway/configuration/cloudflare-access/) changes the credential model entirely. Configure it from the gateway's Access tab, define which users may call it, and:

- The **Access JWT becomes the request credential** – a valid JWT replaces the need for a separate gateway token.
- Every request carries `cf.user_id`, the JWT `sub` claim, so logs, analytics, and spend are filterable by authenticated user. (Note it is the `sub` claim, not the email address.)
- Cloudflare-only headers – the Access JWT and gateway authorization headers – are **stripped before the request is forwarded upstream**, so the provider never sees them.
- **Service tokens** cover machine-to-machine callers via `CF-Access-Client-Id` / `CF-Access-Client-Secret`. These do not carry `cf.user_id`, since they do not represent a person.

One consequence to plan for: once Access protection is on, *every* request to that domain must pass a policy. Requests carrying only a gateway token are rejected. Migrate callers before you flip it on.

**Step three is watching what that identity reveals.** The [**identity-aware AI Gateway**](https://blog.cloudflare.com/identity-aware-ai-gateway/) builds on the verified identity to establish a behavioral baseline per user and agent, flagging anomalies against a multiplier on each user's own 95th-percentile session cost, filtered by an account-level ceiling to suppress noise. The output is a "rogue behavior" feed rather than a raw log to read. Per-user spend limits and budget buckets sit alongside it, with fallback to cheaper models when a limit is reached. The problem it solves is stated plainly in Cloudflare's own research: shared API keys make it nearly impossible to tell who is using a service, and 59% of organizations cite knowledge gaps as their biggest AI governance obstacle.

**Step four is inspecting content.** [**AI Gateway DLP**](https://developers.cloudflare.com/ai-gateway/features/dlp/) uses the same detection engines and the same account-level profiles as Cloudflare One DLP – configure a profile once, apply it in both places. It inspects:

- User prompts, including text, code, and structured data
- Model responses before they are returned
- **Tool call arguments and results** – the part that matters most for agents
- Text portions of multipart form data

Two operational caveats worth knowing before you enable it. Response scanning **buffers the complete streamed response** before inspecting it, which increases time-to-first-token proportionally – a noticeable UX change for chat interfaces, largely irrelevant for batch agents. And DLP policies are configured per gateway and apply uniformly to everything passing through it, so different inspection requirements mean separate gateways.

Finally, the [**Workers AI and AI Gateway unification**](https://blog.cloudflare.com/workers-ai-gateway-unification/) removes the old split between "models we host" and "models you call". One `env.AI` binding, one wallet, one dashboard:

```javascript
const response = await env.AI.run(
  "@cf/zai-org/glm-5.2",
  { messages: [{ role: "user", content: "Hello!" }] },
  { gateway: { id: "default" } },
);
```

[AI Gateway credits](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) now apply across all providers, and every call – hosted or third-party – lands in the same observability surface. For governance this matters more than it looks: it means there is exactly one place to answer "what did we spend, on which model, for whom".

### 2.2 Tool Calls – MCP Server Portals

Model calls send data out. **Tool calls take action** – and an agent can execute thousands of them at machine speed without a human reviewing any of them. This is the surface that deserves the most attention and usually gets the least.

[**MCP Server Portals**](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/) collapse many upstream MCP servers behind one authenticated HTTP endpoint. The flow: the client connects and receives OAuth metadata, the user authenticates through your Access identity provider, the portal returns the tools from enabled upstream servers, and each tool call is namespaced, credentialed, and proxied – optionally through Gateway for inspection.

What that brings you, concretely:

- **Identity at the door.** Access policies decide who reaches the portal at all. Per server, a `Require user auth` toggle decides whether calls run as the individual user with their own OAuth credentials, or under a shared admin credential. Prefer the former: it preserves permission parity with the underlying system.
- **A curated tool catalog.** Individual tools and prompts can be toggled off, and the `default_disabled` flag lets you expose only an allowlist. Tools can be renamed and re-described at portal or server level. An agent cannot call a tool it was never shown.
- **Logs that name the tool.** Each request records timestamp, HTTP status, server name, tool called, and duration. Enterprise accounts can Logpush this to a SIEM with fields for server name, capability used, and request status.
- **Content inspection.** Enabling Gateway routing sends portal traffic through Cloudflare Gateway, so tool calls land in your HTTP logs and can be DLP-scanned like any other traffic.
- **OAuth that non-browser clients can actually complete.** This is what [Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/) solves. Access normally authenticates through a browser redirect, and a CLI, SDK, script, or AI agent cannot follow one – it just receives a `302` with no token. Managed OAuth turns Access into a standards-compliant OAuth 2.0 authorization server: the client fetches metadata from `/.well-known/oauth-authorization-server`, the user authenticates once through the identity provider, and Access issues an opaque token rather than a JWT, so the client cannot decode identity from it. As the documentation puts it, "Access enforces the same policies as a browser login, and your origin sees no difference." Portals additionally accept manually configured OAuth credentials for upstream providers that require pre-registered applications instead of dynamic registration.

> _**The DLP targeting gotcha.** It is tempting to write the DLP policy against the portal hostname, since that is the URL your users configure. It will not match. The portal terminates the client's connection and **re-originates** each tool call to the upstream server, and it is that outbound leg Gateway sees, carrying the upstream server's hostname as its destination. So the policy has to match something like `example-mcp-server.example.workers.dev`, not `<subdomain>.<domain>`. DLP absolutely applies to portal traffic – it just applies on the far side of the portal, where the data is actually going._

### MCP: From Visibility to Enforcement

A portal only helps if agents actually use it. The [**MCP security updates**](https://blog.cloudflare.com/mcp-security-updates/) close that loop with a four-step path:

1. **Detect MCP traffic.** MCP requests look like ordinary HTTPS API calls. Gateway now identifies them at the protocol level using the `MCP-Protocol-Version` header on TLS-inspected requests, exposed as an `experimental.is_mcp == true` selector.
2. **Find shadow MCP.** A dedicated dashboard shows MCP hosts, users, and request volumes, and distinguishes portal traffic from direct device connections. Unapproved servers become visible at a glance.
3. **Approve and onboard.** Move sanctioned servers behind a portal with identity, a curated catalog, and logging.
4. **Block the bypass.** Use the Traffic Source selector to require the portal:

```text
Action:   Block
Criteria: not(net.onramp.type == "mcp_portal") and experimental.is_mcp
```

That last rule is what converts a portal from a convenience into a control. Note that step 1 depends on Gateway TLS inspection, so the blind spots from the previous section apply here too – and that `experimental.is_mcp` is, as named, experimental. Support for private MCP servers on internal networks is in development.

### Why This Got Easier: MCP v2

The [**MCP 2026-07-28 specification**](https://blog.cloudflare.com/mcp-v2/) replaced the stateful connection model with a stateless one, and several changes are directly useful for security teams:

- **HTTP-aware headers.** New `Mcp-Method` and `Mcp-Name` headers let gateways and WAF rules inspect which MCP operation is being performed **without parsing JSON bodies** – meaning rate limiting and firewall rules at the header level.
- **RFC 8707 resource audience binding.** Tokens must be issued for the canonical server URI, so a token minted for one server cannot be replayed against another.
- **RFC 9207 issuer identification.** Authorization servers advertise and include issuer claims, preventing response confusion between authorities.
- **Client ID Metadata Documents (CIMD)** replace the deprecated Dynamic Client Registration, and pre-registered clients are preferred over dynamically registered ones.
- **Stateless core.** The `initialize` handshake and `Mcp-Session-Id` headers are gone; each request carries its own protocol version, client identity, and capabilities.

Cloudflare's [Agents SDK (v0.20.0 and later)](https://developers.cloudflare.com/changelog/post/2026-07-27-agents-sdk-v0.20.0-mcp-sdk-v2/) speaks both the new stateless protocol and the 2025 versions with automatic fallback, and portals select the version without manual configuration – so you are not blocked on the ecosystem finishing its migration.

### MCP Portals and Context Cost

Not strictly a security control, but it changes what is practical to allow. Portals support [**Code Mode**](https://blog.cloudflare.com/code-mode/), which collapses every tool into two portal-native tools (`portal_codemode_search` and `portal_codemode_execute`) executed as JavaScript in isolated Dynamic Workers. Two lighter options exist: `minimize_tools` strips schemas and exposes an on-demand lookup tool (roughly 5x context savings), and `search_and_execute` hides tools entirely behind a Workers sandbox. The security relevance is straightforward – when exposing +100 tools costs almost nothing in context, you have no reason to over-grant in order to save tokens.

---

## Surface 3: Public AI-Powered Apps and APIs

**Inspection point: AI Security for Apps.**

The first two surfaces are about traffic leaving your organization. This one reverses the direction: your own chatbot or AI API, exposed to customers, receiving prompts written by people you do not control.

The [**AI Security for Apps reference architecture**](https://developers.cloudflare.com/reference-architecture/architectures/ai-security-for-apps/) describes an AI-specific detection layer that complements – rather than replaces – the [WAF](https://developers.cloudflare.com/waf/), running inline at the reverse proxy.

**Discovery comes first.** LLM endpoints are identified automatically using [heuristic analysis](https://blog.cloudflare.com/take-control-of-public-ai-application-security-with-cloudflare-firewall-for-ai/) of traffic characteristics such as bitrate patterns and response latency. In practice this often surfaces AI endpoints that nobody told the security team about.

**Three detection families** run against those endpoints:

- **PII exposure** – personal data in prompts, which is both a compliance problem and a training-data problem.
- **Unsafe topics** – harmful content categories.
- **Prompt injection and jailbreak** – scored by likelihood, where scores below 20 indicate a probable attack.

The architectural detail worth noting is that these run **in parallel**, each against a model specific to the threat being detected, rather than sequentially. That is what keeps an inline AI inspection layer viable latency-wise.

**Discovery alone does not start scanning, and this is the step people miss.** There are two switches, not one. First, enable AI Security for Apps in Security Settings – it is not on by default. Second, in [Web Assets](https://developers.cloudflare.com/api-shield/management-and-monitoring/), promote a discovered candidate to a saved endpoint and apply the `cf-llm` [endpoint label](https://developers.cloudflare.com/api-shield/management-and-monitoring/endpoint-labels/#categories) to it. That label is a **switch, not a selector**: it marks which endpoints get inspected, and nothing is scanned until it is applied.

What you write rules against is a different thing entirely: the detection *fields* that scanning populates. AI Security for Apps is one of the [WAF traffic detections](https://developers.cloudflare.com/waf/detections/), which follow a **sensor-and-responder** model – detections populate fields, rules act on them. As the documentation puts it, "detections are always on once enabled, even if you have not configured any security rules that use them." So once both switches are on, every request is scored whether or not a rule exists, and the fields combine with any other Rules language field:

```text
(cf.llm.prompt.injection_score lt 30 and cf.bot_management.score lt 20)
```

That scoring-without-blocking property is what lets you measure before you enforce, and the measurement period has a supported shape. [Log mode versus production mode](https://developers.cloudflare.com/waf/detections/ai-security-for-apps/log-mode-vs-production-mode/) is the deployment decision:

<div style="overflow-x: auto;">

| | Log mode | Production mode |
| --- | --- | --- |
| Rules | A managed ruleset firing on three fixed conditions: PII, unsafe topic, prompt injection | Your own WAF custom rules over the detection fields |
| Logic | No score thresholds | Full score-based and combinatorial logic |
| Logging | Full request body, encrypted via payload logging | Request metadata only – prompts are not logged |
| Response | Default WAF block page | Custom responses |

</div>

Start in log mode to see real detections and tune thresholds, then move to production mode custom rules. The two can run simultaneously during the transition.

### Probabilistic Is Not Deterministic

This deserves its own heading, because it is the conceptual shift that trips up teams who are fluent in traditional WAF operations.

A classic WAF rule is **deterministic**. It matches a known pattern – a SQL injection signature, a path, a header, an IP range. The same request produces the same verdict every time, the rule is auditable by reading it, and "false positive" means your pattern was too broad.

AI threat detection is **probabilistic**. It is reasoning about *intent* expressed in natural language, and natural language does not have signatures. `cf.llm.prompt.injection_score` is a score, not a match; a jailbreak can be rephrased indefinitely, and the same intent can arrive in a thousand syntactically unrelated sentences. That difference has three practical consequences:

- **You tune thresholds, you do not write patterns.** There is no score at which you catch everything and block nothing legitimate. You are choosing a point on a curve, which is why log mode exists.
- **Both error types are real and permanent.** A determined attacker will eventually phrase something that scores below your threshold, and some genuine user will eventually phrase something that scores above it. Plan the appeal path before you turn on blocking.
- **It does not replace the deterministic layer.** Prompt injection scoring says nothing about a credential-stuffing attempt against your login endpoint. Rate limiting, bot scoring, schema validation, and managed rulesets remain the floor; AI detections are a layer on top that sees a category of attack the deterministic layer structurally cannot.

The healthy mental model is defence in depth ([**layered-security approach**](https://davidtofan.com/articles/cloudflare-l7-security-recommendations/)) across two different kinds of evidence: deterministic controls for what a request *is*, probabilistic ones for what it appears to be *trying to do*. Combining them in one expression – the injection score alongside a bot score, as above – is usually stronger than either alone.

### Who Is Reading Your Content

Alongside this sits [**AI Crawl Control**](https://developers.cloudflare.com/ai-crawl-control/), which addresses a different question: not who is attacking your AI app, but who is consuming your content to build theirs. It provides visibility into which AI services access your content, granular allow and block policies per crawler, and tracking of which crawlers actually honor your `robots.txt` directives – with enforcement rules for those that do not. A pay-per-crawl capability turns that access into a commercial arrangement rather than a binary.

The [**attribution and business insights**](https://blog.cloudflare.com/attribution-business-insights/) dashboard turns that visibility into an argument you can take into a commercial conversation. It reports **crawl-to-referral ratios** per bot operator – how many times a company crawled you versus how many visitors it sent back – over 24 hours, 7 days, or 30 days. The extremes are genuinely startling: ratios as lopsided as 50,000:1 have been observed. It also classifies crawlers by purpose (**Training**, **Search**, or **Agent**) and ranks top bots by volume, country of origin, bandwidth consumed, and current block status. The old bargain was implicit – you let search engines crawl because they sent readers back. This is the data that tells you whether that bargain still holds for each operator individually.

The flip side of blocking is being legible to the agents you *do* want. If you would rather be read well than not read at all, that is a design problem in its own right, covered in [Making Your Website AI Agent Ready with Cloudflare](https://davidtofan.com/articles/ai-agent-ready-website-cloudflare-guide/).

### Mind the Execution Order

Everything on this surface runs through the Ruleset Engine, and the [phase order](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/) decides which of your rules ever gets evaluated.

A terminating action – Block, Managed Challenge – ends evaluation immediately, and the request never reaches later phases. Within a single phase, custom rules are evaluated top to bottom on the same first-match basis.

This has a specific and easily-missed consequence for AI Crawl Control, which implements its blocks *as* WAF custom rules. As the [documentation warns](https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/), the AI Crawl Control rule is appended **at the end** of your existing custom rules, so an earlier Allow or Skip rule can let a crawler straight past it. The guidance is explicit: "To ensure blocked bots are properly blocked, move the AI Crawl Control rule to the top of your WAF custom rules, so it executes before other rules." Pay per crawl sits after WAF entirely, so anything a custom rule already blocked never reaches the charging mechanism – a request blocked by a country rule stays blocked no matter how correct its payment headers are.

If you take one thing from this section: **write the rule, then check where it sits.** On this surface, ordering is not a detail, it is the difference between a policy and a decoration.

### Behind the Endpoint: The Wiz Integration

Everything on this surface is edge-side. Cloudflare sees the request arriving at your AI endpoint and can tell you whether that endpoint is protected. What it cannot tell you is what sits *behind* it – which database that application can reach, which internal API it holds a credential for, whether the image it runs was built from a vulnerable base. That context lives in your cloud accounts and your code, and it is what turns "this endpoint is unprotected" into "this endpoint is unprotected **and** it can read the customer table".

The [**Wiz and Cloudflare integration**](https://www.wiz.io/integrations/cloudflare) closes that gap from the other direction. Wiz is a Cloud-Native Application Protection Platform (CNAPP) covering **code** (vulnerabilities in what you are about to ship), **cloud** (infrastructure posture and exposed resources), and **runtime** (what an application actually does and which data it touches). This specific integration feeds Cloudflare's AI Security for Apps protections into the Wiz Security Graph, so a single view shows every application endpoint alongside whether it is behind Cloudflare's guardrails.

The useful part is the correlation, not the inventory. Wiz knows which of your AI applications can reach sensitive data, internal APIs, and critical systems; Cloudflare knows which endpoints have prompt injection and unsafe topic protection actually enabled. Put those together and "which AI endpoints are both exposed and unprotected?" becomes a query rather than a spreadsheet exercise – and you prioritise by real exploitability instead of guessing which service matters most.

> _WAF rulesets, Advanced Rate Limiting, Bot Management, API Shield, and DDoS protection are the foundation underneath all of this. They are covered in depth in [The CISO's Guide to Securing AI](https://davidtofan.com/articles/ciso-guide-securing-ai-cloudflare/) and are not repeated here._

---

## Surface 4: SaaS AI Providers

**Inspection point: CASB – out-of-band, over API.**

This is the surface that works when nothing is [proxied](https://developers.cloudflare.com/dns/proxy-status/). No device client, no gateway hostname, no TLS decryption. CASB connects directly to the SaaS provider's API and inspects what is already there.

[Cloudflare One's cloud and SaaS integrations](https://developers.cloudflare.com/cloudflare-one/integrations/cloud-and-saas/) include **Anthropic** and **OpenAI** directly, alongside the AI features embedded in suites your organization already runs – Google Gemini within Workspace, Microsoft Copilot within 365 – plus Slack, GitHub, Bitbucket, Atlassian, Salesforce, ServiceNow, Box, Dropbox, S3, and GCP Cloud Storage.

Why bother, when Surfaces 1 and 2 already cover traffic in flight? Because they answer different questions:

- Inline inspection tells you **what is being sent right now**. CASB tells you **what is already sitting in the tenant** – files, shared conversations, retained data.
- Inline inspection requires the traffic to route through Cloudflare. CASB works for **unmanaged devices and personal networks**, where it never will.
- Misconfiguration is invisible on the wire. Sharing settings, organization membership, seat sprawl, and retention configuration are only visible through the API.

Deploy it alongside inline controls, not instead of them.

### Ask Providers the Right Questions

Every provider on that list has a data handling posture, and it is worth reading rather than assuming. Cloudflare's own [Responsible AI](https://www.cloudflare.com/trust-hub/responsible-ai/) page is a useful template for what a clear answer looks like: it states plainly that Cloudflare does not train its own large language models and does not use customer content to train any LLMs, that ML models for threat detection are trained on network traffic patterns rather than customer content, and that third-party models served on Workers AI carry vendor responsibility for EU AI Act compliance.

That page sits inside a broader [**Trust Hub**](https://www.cloudflare.com/trust-hub/), which is worth knowing about as a category as much as a destination. It collects the artefacts a security review actually asks for – certifications, compliance attestations, sub-processor lists, and data protection documentation – in one place rather than scattered across sales conversations. Two neighbours are worth a look for the same reason: the [Transparency](https://www.cloudflare.com/transparency/) hub publishes how the company handles law enforcement and government requests, and the [Impact Portal](https://www.cloudflare.com/impact-portal/) covers environmental, privacy, and human rights commitments.

Use all of it as the shape of the questionnaire you send your own providers – retention period, training use, sub-processors, data residency, zero data retention availability, and where their equivalent documentation lives. A vendor that cannot point you at its own version of these pages has told you something useful. "We have a CASB integration" and "we know what they do with our data" are separate assurances, and you want both.

---

## Building and Deploying Agents Safely

Everything so far governs AI your organization *consumes*. This section is about AI your teams *build* – and the goal is to make the safe path the default one, rather than reviewing each agent individually forever.

### Isolated Execution

Agents that write and run code need somewhere to run it that is not a developer's laptop or a production box.

The [**Sandbox SDK 1.0 preview**](https://developers.cloudflare.com/sandbox/1-0-preview/) provides isolated execution inside Cloudflare Containers. Its API is deliberately honest about lifetime: `exec()` takes an argument array and returns a process handle immediately, and the same handle works for a short command or a long-running service.

```javascript
const process = await sandbox.exec(["npm", "test"]);
const result = await process.output({ encoding: "utf8" });
console.log(result.stdout, result.exitCode);
```

Output is available through `output()`, `logs()`, `waitForExit()`, and `waitForLog()`; processes are terminated with `kill()`. Each call is independent, taking `cwd` and `env` per launch rather than relying on session state. Terminals are first-class PTY resources via `createTerminal()` and `terminal.connect()`. Each sandbox keeps a stable ID while the underlying container can be replaced – when that happens, processes and terminals become unavailable, which the API surfaces rather than hides. It is available as `@cloudflare/sandbox@next`; the stable release remains for existing applications.

[**`@cloudflare/computer`**](https://blog.cloudflare.com/cloudflare-computer/) sits a level above, letting the platform decide where each piece of work runs – a lightweight isolate via Dynamic Workers, or a full Linux container. The reasoning is capacity: there is nowhere near enough compute in the world to give every user's agent its own container, and the design targets needing one for **less than 10% of the work**. It provides a SQLite-backed virtual filesystem with a Node-compatible interface (`fs.mkdir()`, `fs.writeFile()`, `fs.readFile()`), `git.clone()`, and `exec()` across both runtimes. For security teams, the relevant line is that **all operations are logged, with fine-grained access control** – the audit trail is a property of the runtime, not something each agent author has to remember to add.

### A Reference Pattern

The [**enterprise AI agent workspace**](https://developers.cloudflare.com/reference-architecture/diagrams/ai/enterprise-ai-agent-workspace/) diagram assembles these pieces into something you can copy. Work is invoked through multiple channels – web app, enterprise chat, email, webhooks, schedules – with Access authenticating browser sessions and each asynchronous channel validating its own signature. Workers route to the agent, which restores conversation history, permissions, and files from durable state. The agent then calls **approved models through AI Gateway** and **approved tools through an MCP Server Portal**, keeping credentials and policy outside the workspace.

| Component | Role |
| --- | --- |
| Workers | Stateless routing and UI |
| Durable Objects | Per-user profiles, per-workspace agent state |
| Agents SDK | Orchestration |
| AI Gateway | Model governance, routing, usage tracking |
| MCP Server Portal | Governed tool access |
| Dynamic Workers / Sandbox SDK | Code execution |
| Browser Run | Web navigation |
| R2 | Skills library, context, backups |

The governing principle is worth quoting because it is the whole design in one line: **treat model output, tool output, and generated code as untrusted, and apply controls at platform boundaries rather than inside generated code.** Any control an agent could rewrite is not a control.

### An Open-Source Starting Point

[**Cloudflare OS**](https://blog.cloudflare.com/cloudflare-os/) is the platform Cloudflare built for its own employees, open-sourced for deployment into your own account. It gives non-developers a browser-based agent workspace with curated organizational context, reusable skills, and an isolated runtime – supporting research, document creation, app building, and workflow automation.

Its security model is the part worth studying regardless of whether you deploy it:

- **Capability-based access** – agents begin with **zero permissions** and are granted capabilities explicitly.
- [**Gatekeepers**](https://github.com/cloudflare/cloudflare-os#gatekeepers-a-capability-based-security-layer) – service-specific Workers that mediate every resource access, enforce policy, and hold credentials so agents never touch them.
- **Observation tracking** – the platform records which resources were accessed and **propagates access restrictions through generated outputs**, so a document built from restricted data inherits the restriction rather than laundering it.
- **MCP Server Portal integration** for systems of record, respecting existing permission boundaries.
- **All inference through AI Gateway**, giving per-person, per-team, and per-workspace attribution and budget enforcement.

Agent-generated apps run on Dynamic Workers with Durable Object Facets providing isolated SQLite databases, and are shareable as live instances or as modifiable blueprints.

Because Worker egress now flows through Gateway, agents built on this stack can be covered by the same policies as the laptops in Surface 1 – one policy set, not two.

---

## How Cloudflare Runs Cloudflare OS Internally

Cloudflare published unusually specific numbers about running this architecture on itself, which makes it a better reference than most vendor material.

The [**internal AI engineering stack**](https://blog.cloudflare.com/internal-ai-engineering-stack/) serves 3,683 users – 60% of the company and 93% of R&D – processing 241.37 billion tokens and 20.18 million requests through AI Gateway in a single month. Access handles identity with a single OAuth flow across all MCP integrations. AI Gateway centralizes requests, manages provider keys, tracks cost, and enforces **zero data retention** policies, with a proxy Worker injecting API keys server-side so engineers never handle credentials. A single MCP Server Portal aggregates 13 production servers exposing 182+ tools across Backstage, GitLab, Jira, Sentry, Elasticsearch, Prometheus, and Google Workspace – with Code Mode cutting roughly 15,000 tokens of tool schema per request down to near zero. Developer merge requests nearly doubled, from around 5,600 per week to over 8,700.

[**How Cloudflare uses AI with Cloudflare OS**](https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/) describes the governance rules behind that. Of the five guiding principles, the fifth deserves to be adopted verbatim as policy language:

> _You should never have more permission with systems of record when using AI._

That single sentence resolves most agent authorization debates: the access controls that apply to a person's normal data interactions apply identically when that person works through an agent, and an agent receives only the permissions its function requires. The rest follows: humans remain accountable for AI output and agent behavior – when staff change, managers inherit responsibility for their reports' deployed agents. DLP rules prevent sensitive datasets reaching external providers. Model access varies by role, with autonomous workflows routed to efficient models and expensive inference modes blocked. Ephemeral cloud workspaces prevent local data exposure. Beyond engineering, sales operations saved over 10,000 hours in a month, and employees create more than 4,000 custom applications monthly.

Two mechanisms make standards actually stick. The [**Engineering Codex**](https://blog.cloudflare.com/engineering-standards-enforcement/) is a governed set of standards written as RFCs, organized by domain with named owners, using RFC 2119 keywords (MUST, SHOULD) and progressing through proposal → approved → **enforced**. Agents extract those statements into structured JSON so a reviewer retrieves the specific rule rather than loading an entire document into context – the same context-efficiency thinking as Code Mode, applied to policy.

The [**AI code reviewer**](https://blog.cloudflare.com/ai-code-review/) enforces it, running 131,246 reviews across 48,095 merge requests in its first month at a median cost of $0.98 and 3m39s. Rather than one generic reviewer, a coordinator spawns up to seven specialists – security, code quality, performance, documentation, release management, Codex compliance, and AGENTS.md – then deduplicates findings, filters false positives, and decides. Merge requests are risk-tiered by size and sensitivity, so a ten-line change gets two agents and a security-sensitive one gets seven. Nearly 16,000 merges have been blocked on enforced MUST requirements.

One detail from that system is directly transferable to anything you build: **user-controlled content is sanitized by stripping XML boundary tags entirely** before it reaches the coordinator's structured prompt. If you are feeding untrusted text – issue bodies, customer messages, scraped pages – into an agent, that is the class of defense to copy.

The [**Agents Week review from August 2026**](https://blog.cloudflare.com/agents-week-review-august-2026/) is the index to everything referenced above, including the Agent Development Lifecycle framing, live tracing with human-in-the-loop approvals, and the Agent Access Model.

---

## Summary

<div style="overflow-x: auto;">

| Surface | Inspection point | What you see | What you enforce |
| --- | --- | --- | --- |
| [1 – Workforce in browsers and IDEs](#surface-1-the-workforce--browsers-and-ides) | Secure Web Gateway | Shadow AI/MCP discovery, AI Security report, HTTP logs | Block, isolate, DLP on uploads and prompts |
| [2.1 – Agents calling model APIs](#21-model-calls--ai-gateway) | AI Gateway | Per-user logs via `cf.user_id`, cost, anomaly feed | Access policies, spend limits, DLP flag or block |
| [2.2 – MCP clients calling tools](#22-tool-calls--mcp-server-portals) | MCP Server Portal | Per-tool request logs, shadow MCP dashboard | Curated tool catalog, per-user auth, portal-only rule |
| [3 – Customers hitting your AI app](#surface-3-public-ai-powered-apps-and-apis) | AI Security for Apps | LLM endpoint discovery, threat scores and analytics | Prompt injection, PII and unsafe topic detections; crawler policy |
| [4 – Data at rest in SaaS tenants](#surface-4-saas-ai-providers) | CASB (out-of-band API) | Misconfiguration and exposure findings | Posture remediation, provider data-handling review |

</div>

### Where to Start

Order matters more than completeness. A reasonable sequence:

1. **Fix the on-ramps – and prepare properly for TLS decryption.** This is the longest step and the one that sinks projects when it is treated as a checkbox. It is really four pieces of work: deploy the [Cloudflare One Client](https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/) at scale, preferably through your [MDM](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/deployment/) rather than by asking people to install it; distribute the [root certificate](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/user-side-certificates/) to the OS trust store *and* to the applications that keep their own – Docker images and CI runners especially; write the [Do Not Inspect](https://developers.cloudflare.com/cloudflare-one/traffic-policies/http-policies/#do-not-inspect) policies for the pinned and mTLS applications you already know will break, before your users find them; and write down what those exemptions cost you in visibility, or if there are alternative paths. Everything else on this list depends on this step, and every hour spent here is worthwhile.
2. **Discover before you block.** Run Gateway and the AI Security report for a few weeks. Classify applications; do not guess.
3. **Give agents a governed path for models.** Stand up an AI Gateway custom domain behind Access. Migrate callers off shared API keys, then turn Access on.
4. **Give agents a governed path for tools.** Put approved MCP servers behind a portal with a curated catalog and per-user auth.
5. **Only then, close the bypass.** Once the portal genuinely works, block non-portal MCP traffic. Doing this before step 4 just pushes people onto unmanaged devices.
6. **Run Surfaces 3 and 4 in parallel.** They touch different teams and do not block the workforce work.
7. **Make the safe build path the easy one.** Sandboxed execution, zero-permission defaults, and gatekeepered credentials, so the next agent is secure because of how it was built rather than because someone reviewed it.

The connecting idea across all four surfaces is that **identity is the primary control, and the network is how you attach it**. Every capability here – `cf.user_id` on a model call, per-user OAuth on a tool call, an Access policy on a gateway hostname, permission parity with systems of record – exists to answer one question: which human is accountable for what this agent just did?

---

## Disclaimer

Educational purposes only.

This blog post is independent and not affiliated with, endorsed by, or necessarily reflective of the opinions of Cloudflare or any other entities mentioned. Product capabilities described here reflect publicly available documentation and blog posts at the time of writing; several features referenced are explicitly in preview or beta and may change.

This blog post was partially drafted and refined with AI assistance.
