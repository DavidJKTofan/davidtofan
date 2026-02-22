---
title: Post-Quantum Cryptography (PQC)
date: 2025-06-15
description: "Discover why Post-Quantum Cryptography (PQC) matters now — with Cloudflare-led insights, real-time adoption data, and tools to easily implement PQC in your infrastructure."
tags:
  [
    "cybersecurity",
    "cloudflare",
    "zero trust",
    "application security",
    "post-quantum cryptography",
  ]
type: "article"
---

<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ 
        startOnLoad: true,
        flowchart: {
            htmlLabels: true,
            curve: 'basis'
        }
    });
</script>

## What is Post-Quantum Cryptography (PQC)?

By now, most people who are somehow involved in Cybersecurity should have already heard: we're living through one of the biggest cryptographic transitions in history. PQC isn't some distant sci-fi concept anymore. It's real, it's being standardized, and it's already protecting some traffic across the Internet today.

If you want to learn more about what PQC means, there are plenty of well-written explainers out there:

- [What Is Post-Quantum Cryptography? | NIST](https://www.nist.gov/cybersecurity/what-post-quantum-cryptography)
- [Post-quantum cryptography (PQC) | Google Cloud](https://cloud.google.com/security/resources/post-quantum-cryptography)
- [BSI - Post-quantum cryptography](https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Quantentechnologien-und-Post-Quanten-Kryptografie/Post-Quanten-Kryptografie/post-quanten-kryptografie_node.html)

## It's live!

- Latest versions of [Chrome](https://www.bleepingcomputer.com/news/security/chrome-switching-to-nist-approved-ml-kem-quantum-encryption/), [Firefox, and Edge browsers](https://blog.cloudflare.com/pq-2024/) support post-quantum key agreement.
- [Cloudflare](https://blog.cloudflare.com/tag/post-quantum/) is running PQC in production.
- [Signal](https://signal.org/blog/pqxdh/) and [Apple iMessage](https://security.apple.com/blog/imessage-pq3/) use it for secure messaging.
- Even [Zoom](https://news.zoom.com/post-quantum-e2ee/) added post-quantum protection to video calls.

You can quickly verify if your browser supports PQC by visiting [pq.cloudflareresearch.com](https://pq.cloudflareresearch.com/).

> Want to see who else is ahead of the curve? [PQScan.io](https://pqscan.io/) tracks PQC deployment across the web and allows you to scan websites for PQC support.

If you are curious about the overall adoption trend of PQC, check out the [Cloudflare Radar Data Explorer](https://radar.cloudflare.com/explorer?dataSet=http&groupBy=post_quantum&filters=botClass%253DLikely_Human%252CdeviceType%253DMobile&dt=14d).

<iframe class="cf-radar-embed" width="800" height="619" src="https://radar.cloudflare.com/embed/DataExplorerVisualizer?path=http%2Ftimeseries_groups%2Fpost_quantum&dateRange=14d&param_botClass=Likely_Human&param_deviceType=Mobile&param_limitPerGroup=10&locale=en-US&widgetState=%7B%22showAnnotations%22%3Atrue%2C%22xy.hiddenSeries%22%3A%5B%5D%2C%22xy.highlightedSeries%22%3Anull%2C%22xy.hoveredSeries%22%3Anull%2C%22xy.previousVisible%22%3Atrue%7D&ref=%2Fexplorer%3FdataSet%3Dhttp%26groupBy%3Dpost_quantum%26filters%3DbotClass%25253DLikely_Human%25252CdeviceType%25253DMobile%26dt%3D14d" title="Cloudflare Radar - HTTP requests by post-quantum support time series" loading="lazy" style="border:0;max-width:100%;"></iframe>

## Take action!

[Governments](https://www.bleepingcomputer.com/news/security/uk-urges-critical-orgs-to-adopt-quantum-cryptography-by-2035/) around the world are already pushing for PQC adoption.

What you as a website owner or working in Cybersecurity at a company should generally do:

- **Audit your crypto dependencies**. If you don't know where RSA and ECC live in your stack, you can't protect against quantum threats. This inventory is painful but essential.
- **~~Pressure~~ Motivate your vendors**. Don't assume your security tools are quantum-ready. Ask specific questions about PQC roadmaps. The vendors who can't answer clearly aren't prepared.
- **Design for crypto-agility**. Build systems that can swap algorithms without architectural changes. The next cryptographic transition won't be our last.
- **Test before you need to**. Spin up a lab environment with PQC enabled. Learn what breaks before your hand is forced by compliance requirements or security incidents.

### Technical Requirements for PQC

There are [three relevant connections](https://developers.cloudflare.com/ssl/post-quantum-cryptography/#three-connections-in-the-life-of-a-request) in the life of a request where PQC needs to be applied, when using a proxy service. In this case, we will take Cloudflare as an example.

<pre class="mermaid">
graph LR
    A["🌐 Client Browser<br/>Chrome (Latest)<br/>🔐 PQC Ready"] 
    B["☁️ Cloudflare<br/>Edge Network<br/>🛡️ Global Proxy"]
    B2["☁️ Cloudflare<br/>Edge Network<br/>🔗 Internal Nodes"]
    C["🖥️ Origin Server<br/>Your Application<br/>🏠 Backend"]
    
    A -.->|"🔒 <b>CONNECTION 1</b><br/>TLS 1.3 + PQC<br/>Quantum-Safe Handshake"| B
    B -.->|"⚡ <b>CONNECTION 2</b><br/>Internal Network"| B2
    B2 <-.->|"🚇 <b>CONNECTION 3</b><br/>Cloudflare Tunnel<br/>--post-quantum flag"| C
    
    style A fill:#0f4c75,stroke:#0f4c75,stroke-width:3px,color:#fff
    style B fill:#3282b8,stroke:#3282b8,stroke-width:3px,color:#fff
    style B2 fill:#3282b8,stroke:#3282b8,stroke-width:3px,color:#fff
    style C fill:#bbe1fa,stroke:#1b262c,stroke-width:3px,color:#1b262c
    
    linkStyle 0 stroke:#ff6b35,stroke-width:4px
    linkStyle 1 stroke:#f7931e,stroke-width:4px  
    linkStyle 2 stroke:#c5d86d,stroke-width:4px
</pre>

#### Client to Cloudflare

When your website is [proxied](https://developers.cloudflare.com/dns/proxy-status/) through Cloudflare, the only requirements for PQC to work are the following:

- Enable [TLS 1.3](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/tls-13/).
- Client browser supports PQC, like i.e. the latest Chrome version.

More details [here](https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/).

#### Within Cloudflare

Cloudflare has been upgrading internal connections to support PQC since [September 2023](https://blog.cloudflare.com/post-quantum-cryptography-ga/).

#### Cloudflare to Origin Server

This is usually the most challenging part to configure, as your origin server needs to support PQC. However, it can be made simple when using [Cloudflare Tunnel](https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-and-zero-trust/) and enforcing PQC with the [`--post-quantum`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/cloudflared-parameters/run-parameters/#post-quantum) flag.

More details [here](https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-to-origin/).

## The Future

Quantum computing might not break the Internet tomorrow, but we need to keep up with the latest trends and changes, adapting to them, and improving.

Key exchange and symmetric encryption are well underway for the PQC adoption. However, there's still further development required, especially for digital signatures and certificate chains, to be made post-quantum secure.

---

## Disclaimer

Educational purposes only. We are using the term PQC interchangeably for anything post-quantum related here.

I myself am not a cryptography expert, but find this topic very interesting and I am curious about how the future of cryptography and privacy will look like.
