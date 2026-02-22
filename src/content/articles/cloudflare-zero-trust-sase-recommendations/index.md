---
title: General Zero Trust & SASE Recommendations
date: 2025-02-14
description: "This guide provides non-exhaustive recommendations and general best practices to achieve a comprehensive Zero Trust & SASE approach with Cloudflare."
tags: ["cybersecurity", "cloudflare", "resources", "zero trust", "sase"]
type: "article"
draft: true
---

## Introduction

This guide provides non-exhaustive recommendations and general best practices to achieve a comprehensive **Zero Trust or SASE approach** with [Cloudflare One](https://www.cloudflare.com/zero-trust/). Note that each and every organization determines for themselves what the best approach and policies are for them, their use cases and situations.

Some features mentioned are available only through add-on solutions, such as **Data Loss Prevention (DLP)** and **Remote Browser Isolation (RBI)**, or other **Enterprise** features, such as Gateway **Dedicated Egress IPs**.

For demonstration, this guide assumes a first-time, clean onboarding scenario to Zero Trust architecture with Cloudflare.

---

## Preparation

### Understanding SASE & Zero Trust

The primary difference between Zero Trust and Secure Access Service Edge (SASE) lies in scope:

- **Zero Trust**: Focuses on managing access and authorization for authenticated users based on the principle _"never trust, always verify"_.
- **SASE**: Encompasses broader network and security functionalities, integrating Zero Trust alongside other capabilities.

In Zero Trust, all networks are treated as insecure - whether corporate, home, or public Wi-Fi. This mindset simplifies security, reducing complexity and hidden costs associated with traditional models. This requires a change of perspective.

There are plenty of articles about these topics going into much more detail. Feel free to do your own research or check out these blog posts:

- [Zero Trust, SASE and SSE: foundational concepts for your next-generation network](https://blog.cloudflare.com/zero-trust-sase-and-sse-foundational-concepts-for-your-next-generation-network/).
- [Zero Trust](https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Zero-Trust/zero-trust_node.html)
- [SASE vs. ZTNA: What Is the Difference?](https://www.paloaltonetworks.com/cyberpedia/sase-vs-ztna).
- [SASE vs. Zero Trust: What's the Difference?](https://www.zscaler.com/de/blogs/product-insights/sase-vs-zero-trust-what-s-difference).

Some general advantages of SASE usually are:

- **Comprehensive Security**: Combines network and security services in a unified platform.
- **Zero Trust Integration**: Incorporates Zero Trust principles for secure access.
- **Scalability**: Adapts to growing and evolving organizational needs.
- **Cloud Optimization**: Improves performance for cloud-based applications.
- **Simplified Management**: Centralizes control for reduced complexity.
- **Enhanced Performance**: Optimizes traffic routing for faster connectivity.
- **Global Reach**: Ensures consistent security policies across distributed locations.

#### Glossary

|           **Industry Term**            |       **Cloudflare Solution**       |
| :------------------------------------: | :---------------------------------: |
|    Zero Trust Network Access (ZTNA)    |          Cloudflare Access          |
|        Secure Web Gateway (SWG)        |         Cloudflare Gateway          |
|   Device client (or endpoint agent)    |             WARP Client             |
| Application connector (to set up ZTNA) | Cloudflare Tunnel or WARP Connector |
| Zero Trust platform (ZTNA + SWG + RBI) |           Cloudflare One            |
|     Remote Browser Isolation (RBI)     | Cloudflare Remote Browser Isolation |
|     Data Loss Prevention (DLP)         |    Cloudflare Data Loss Prevention  |

- On-ramps: Methods used to route traffic from users or networks into the Cloudflare network.
- Off-ramps: Methods used to route traffic from Cloudflare to origin servers or private networks.

### Tailoring to Use Cases

Organizations embark on SASE and Zero Trust journeys differently. A detailed analysis of specific use cases and risks helps define the optimal approach and roadmap.

Here are some roadmap examples:

- [A vendor-agnostic Roadmap to Zero Trust Architecture](https://zerotrustroadmap.org/)
- [A Roadmap to Zero Trust Architecture - Whitepaper](https://cf-assets.www.cloudflare.com/slt3lc6tev37/9jyDLdW3VXPGwChDCCnrx/a4b7f7825e229f2caeaa1a12a2d16b24/Whitepaper_A-Roadmap-to-Zero-Trust-Architecture.pdf)
- [Roadmap to Zero Trust - theNET](https://www.cloudflare.com/the-net/roadmap-zerotrust/)
- [Security Transformation - Episode 1: The Roadmap to Zero Trust - theNET](https://www.cloudflare.com/the-net/security-transformation/zero-trust-roadmap/)
- [Cloudflare Zero Trust: A roadmap for highrisk organizations](https://cf-assets.www.cloudflare.com/slt3lc6tev37/4R2Wyj1ERPecMhbycOiPj8/c30f3e8502a04c6626e98072c48d4d7b/Zero_Trust_Roadmap_for_High-Risk_Organizations.pdf)
- [How to implement Zero Trust security - Learning](https://www.cloudflare.com/en-gb/learning/access-management/how-to-implement-zero-trust/)

### Understanding Connectivity

It’s critical to distinguish between connecting **locations/networks**, **users (knowledge workers)**, and **applications/resources**.

The following table outlines Cloudflare's composable and flexible connectivity options (on-ramps and off-ramps):

| **Connectivity**                                 |        **Locations (Networks)**        |                              **Users**                               | **Applications** |     |
| ------------------------------------------------ | :------------------------------------: | :------------------------------------------------------------------: | :--------------: | --- |
| WARP Client (default mode)                       |                                        |                                  ✅                                  |                  |     |
| WARP Client (Gateway with DoH mode)              |                                        |                 🟡<br>(only supports DNS filtering)                  |                  |     |
| WARP Client (Gateway without DNS filtering mode) |                                        |                🟡<br>(does not support DNS filtering)                |                  |     |
| WARP Client (Proxy mode)                         |                                        |                🟡<br>(does not support DNS filtering)                |                  |     |
| WARP Client (Device Information Only mode)       |                                        |              🟡<br>(only supports device posture rules)              |                  |     |
| DNS Resolver IPs                                 |                   ✅                   |                                  🟡                                  |                  |     |
| DNS over HTTPS (DoH)                             | ✅<br>(location-specific DoH endpoint) | ✅<br>(requires user-specific DoH token for identity-based policies) |                  |     |
| DNS over TLS (DoT)                               | ✅<br>(location-specific DoT endpoint) |                                  🟡                                  |                  |     |
| Proxy Endpoint (PAC file)                        |                                        |                                  🟡                                  |                  |     |
| Cloudflare Tunnel                                |                   ✅                   |                                                                      |        ✅        |     |
| WARP Connector                                   |                   ✅                   |                                                                      |        ✅        |     |
| Clientless RBI                                   |                                        |                                  🟡                                  |                  |     |
| Magic WAN                                        |                   ✅                   |                                                                      |        ✅        |     |
| Cloudflare Network Interconnect (CNI)            |                   ✅                   |                                                                      |        ✅        |     |

> _Updated as of December 2024. The public Internet (HTTPS) also remains a viable connection option to the nearest Cloudflare data center._

> 🟡: does not support [identity-based policies](https://developers.cloudflare.com/cloudflare-one/policies/gateway/identity-selectors/).

![cloudflare-connectivity-cloud-overview](img/cloudflare-connectivity-cloud-overview.png)

> Note: IPSec / GRE Tunnels and Cloudflare Network Interconnect (CNI) require [Magic WAN](https://developers.cloudflare.com/magic-wan/) or [Magic Transit](https://developers.cloudflare.com/magic-transit/). However, for [Public Peering or Private Network Interconnect (PNI)](https://developers.cloudflare.com/network-interconnect/pni-and-peering/) Cloudflare follows an open peering policy.

### Modus Operandi

At Cloudflare there are two main policy rule builders:

- **Cloudflare Gateway**: Secure Web Gateway to inspect outbound traffic, which includes DNS, Network, and HTTP filtering, as well as Egress and Resolver Policies.
- **Cloudflare Access**: Zero Trust Network Access (ZTNA) authentication layer solution to secure inbound traffic to your applications.

Standardized naming conventions simplify policy management. This is especially relevant for Gateway. Additionally, be aware of the [order of enforcement](https://developers.cloudflare.com/cloudflare-one/policies/gateway/order-of-enforcement/).

Policies should be:

- Unique across your Cloudflare account.
- Structured for clarity and purpose.
- Descriptive (limited to 100 characters).

Policy Naming Convention model: `<Source>-<Cloudflare Component/Protocol>-<Destination>-<Purpose>`

Examples:

- `All-DNS-Domain-Whitelist`
- `All-DNS-Domain-BlacklistMalware`
- `<IdPGroup>-DNS-Domain-BlockAItools`
- `<IdPGroup>-NET-<DestinationIPList>-SAPAccess`
- `All-HTTP-SecurityRisks-CategoriesBlacklist`
- `All-HTTP-Application-DoNotInspectBankApps`
- `<IdPGroup>-HTTP-FileUpload-DoNotScan`

### Firewalls

Review and align current (device, on-prem or origin server) firewall configurations for Cloudflare integrations:

- [WARP with firewall](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/deployment/firewall/)
- [Cloudflare Tunnel with firewall](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/deploy-tunnels/tunnel-with-firewall/)
- [Browser Isolation with firewall](https://developers.cloudflare.com/cloudflare-one/policies/browser-isolation/network-dependencies/)

### Limitations

Be aware and familiarize yourself with the general [account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/), most of which are soft-limits, as well as any other feature-specific limitations or caveats, such as the [inspection limitations](https://developers.cloudflare.com/cloudflare-one/policies/gateway/http-policies/tls-decryption/#inspection-limitations).

---

## Getting Started

### Standard Configurations

[Create a Zero Trust organization](https://developers.cloudflare.com/cloudflare-one/setup/#create-a-zero-trust-organization) by choosing a team name (`<your-team-name>`) for your organization/account.

[Enable the Gateway proxy](https://developers.cloudflare.com/cloudflare-one/policies/gateway/proxy/#proxy-protocols), specifically UDP & ICMP. This ensures support for routing all application traffic types, including [HTTP/3 inspection](https://developers.cloudflare.com/cloudflare-one/policies/gateway/http-policies/http3/).

[Enable TLS Decryption](https://developers.cloudflare.com/cloudflare-one/policies/gateway/http-policies/tls-decryption/). This is required to apply HTTP filtering, such as Content Categorization and Scanning.

[Enable AV Scanning](https://developers.cloudflare.com/cloudflare-one/policies/gateway/http-policies/antivirus-scanning/#enable-av-scanning). This adds an additional layer of security by allowing to scan the uploaded and downloaded files for malware. For larger files that cannot be scanned, consider allowing [Do Not Scan](https://developers.cloudflare.com/cloudflare-one/policies/gateway/http-policies/#do-not-scan) exceptions if necessary.

[Set up Clientless Browser Isolation](https://developers.cloudflare.com/cloudflare-one/policies/browser-isolation/setup/clientless-browser-isolation/#set-up-clientless-web-isolation). This can be useful for high-risk users, or external providers or third-party users who require controlled access to certain internal applications.

[Configure your Identity Providers (IdP)](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/). Here it is also recommended to use [SCIM provisioning](https://developers.cloudflare.com/cloudflare-one/identity/users/scim/) to sync users and groups, simplifying user management and deprovisioning.

[Configure the Device Enrollment Permissions](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/deployment/device-enrollment/) to only allow approved user devices to join your organization. Related to this, it is recommended to [install the root certificate using WARP](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/user-side-certificates/) and trust it, if possible.

[Configure the App Launcher](https://developers.cloudflare.com/cloudflare-one/applications/app-launcher/) to provide users with a centralized dashboard of authorized applications.

[Improve end user experience](https://developers.cloudflare.com/cloudflare-one/policies/gateway/block-page/#customize-the-block-page) by customizing the Block Page and applying your own corporate branding. Check out this open source _highly customizable block page built in Cloudflare Workers that provides enriched Access Deny reasoning to end users_ on [GitHub](https://github.com/cloudflare/cf-identity-dynamic). Be sure to enable Block Page support for DNS and HTTP policies. More details on customizing the UX [here](https://developers.cloudflare.com/learning-paths/zero-trust-web-access/customize-ux/).

[Create or upload your Lists](https://developers.cloudflare.com/cloudflare-one/policies/gateway/lists/) of URLs, hostnames, or other entries to later use in the Gateway or Access Policies. This can be relevant for corporate devices by keeping track of [Device Serial Numbers](https://developers.cloudflare.com/cloudflare-one/identity/devices/warp-client-checks/corp-device/).

Create [Access Groups](https://developers.cloudflare.com/cloudflare-one/identity/users/groups/) for quick and reusable groups within policies.

Configure [SSH command logging](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/use-cases/ssh/ssh-infrastructure-access/#ssh-command-logs) with your own public key to encrypt logged SSH commands that users ran on a target machine.

> _Depending on your use case and the phase of your Zero Trust deployment, you may configure certain features differently, enable them at a later stage, or leave them disabled altogether._

---

## Connecting Locations / Networks

### DNS Resolver IPs

> This is an [agentless option](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/).

DNS Resolver IPs or DNS Locations refer to a set of DNS endpoints that are associated with physical entities, such as offices, homes, or data centers.

Cloudflare will provide **IPv4 and IPv6 DNS servers** for (default plaintext) unencrypted DNS, which you can easily configure on your routers or devices.

Enterprise customers can opt to use [dedicated DNS resolver IP addresses](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/locations/dns-resolver-ips/#dns-resolver-ip) that are assigned to their account.

Documentation and guide: [DNS Locations](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/locations/).

> Note: any [third-party DNS filtering](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/locations/#third-party-filtering) can be replaced and should be deactivated.

### DNS over HTTPS (DoH) / DNS over TLS (DoT)

> This is an [agentless option](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/).

Cloudflare will provide **DNS over TLS (DoT)** and **DNS over HTTPS (DoH)** endpoints for encrypted DNS traffic, which you can easily configure on your routers or devices.

Both are encryption protocols for securing DNS queries, but they differ in how they transmit data. DoT uses TLS on port 853, keeping DNS traffic separate from other traffic, while DoH uses HTTPS on port 443, blending DNS queries with regular web traffic.

Documentation and guides: [Filter DoH requests by location](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/dns-over-https/#filter-doh-requests-by-location) and [DNS over TLS (DoT)](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/dns-over-tls/).

### Cloudflare Tunnel

TBD

Documentation and guide:

### WARP Connector

TBD

Documentation and guide:

### MagicWAN

TBD

Documentation and guide:

### Cloudflare Network Interconnect (CNI)

TBD

Documentation and guide:

---

## Connecting Applications

### Cloudflare Tunnel

TBD

Documentation and guide:

### WARP Connector

TBD

Documentation and guide:

---

## Connecting Users

### WARP Client (Recommended)

TBD

Documentation and guide:

### DNS over HTTPS (DoH)

TBD

Documentation and guide: [Filter DoH requests by user](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/dns-over-https/#filter-doh-requests-by-user).

### Proxy Endpoint (PAC file)

TBD

Documentation and guide:

### Clientless Remote Browser Isolation (RBI)

> This is an [agentless option](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/).

TBD

For Clientless RBI, they'll navigate any URL via: `https://<your-team-name>.cloudflareaccess.com/browser/<URL>`.

Documentation and guide:

### DNS over HTTPS (DoH)

> This is an [agentless option](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/).

With Cloudflare Gateway, you can filter [DNS over HTTPS (DoH)](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/dns/dns-over-https/#filter-doh-requests-by-user) requests by user with user-specific DoH tokens, applying identity-based policies.

Documentation and guide:

### Proxy Endpoint (PAC file)

> This is an [agentless option](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/).

You can apply Gateway HTTP and DNS policies at the browser level by configuring a [Proxy Auto-Configuration (PAC) file](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/pac-files/).

Documentation and guide:

---

## Creating Policies

Policy Naming Convention model: `<Source>-<Cloudflare Component/Protocol>-<Destination>-<Purpose>`

> There are certain [Global Policies](https://developers.cloudflare.com/cloudflare-one/policies/gateway/global-policies/) always enabled.

### DNS Policies

#### Block Security Categories

By default, one normally wants to block any [Security Categories](https://developers.cloudflare.com/cloudflare-one/policies/gateway/domain-categories/#security-categories) identified by Cloudflare's Threat Intelligence.

![dns-block-security-categories](img/dns-block-security-categories.png)

> The same Policy should be applied as an HTTP Policy. Test this Policy with one of the [common test domains](https://developers.cloudflare.com/cloudflare-one/policies/gateway/dns-policies/test-dns-filtering/#common-test-domains).

Reference: [Domain Categories](https://developers.cloudflare.com/cloudflare-one/policies/gateway/domain-categories/).

#### More Examples for DNS Policies

[Recommended DNS policies](https://developers.cloudflare.com/learning-paths/secure-internet-traffic/build-dns-policies/recommended-dns-policies/).

### Network Policies

#### TBD

TBD

<IMAGE_HERE>

Reference: TBD.

#### More Examples for Network Policies

[Recommended Network policies](https://developers.cloudflare.com/learning-paths/secure-internet-traffic/build-network-policies/recommended-network-policies/).

### HTTP Policies

#### Block unauthorized Applications

Any known unauthorized applications can be blocked by using a [List](https://developers.cloudflare.com/cloudflare-one/policies/gateway/lists/) of relevant URLs, hostnames, or IPs, or by simply using the [Applications Selector](https://developers.cloudflare.com/cloudflare-one/policies/gateway/application-app-types/).

![http-block-unauthorized-applications](img/http-block-unauthorized-applications.png)

> After several days of usage, review the [Shadow IT Discovery](https://developers.cloudflare.com/cloudflare-one/insights/analytics/access/) to review any other previously unkown unauthorized apps.

#### Allowing Social Media with Restrictions

In a corporate environment, one might want to allow browsing and seeing social media activities, but prevent interactions, such as commenting, posting images, or even messaging.

Depending on the social media platform, one needs to adapt the policies.

Block messaging on LinkedIn:

![http-block-linkedin-messaging](img/http-block-linkedin-messaging.png)

Block posting on X (formerly Twitter):

![http-block-x-posting](img/http-block-x-posting.png)

Block messaging on X (formerly Twitter):

![http-block-x-messaging](img/http-block-x-messaging.png)

Block commenting on Reddit:

![http-block-reddit-commenting](img/http-block-reddit-commenting.png)

Block messaging on Reddit:

![http-block-reddit-messaging](img/http-block-reddit-messaging.png)

Block post creaton on Reddit, using DLP:

![dlp-custom-detection-graphql-reddit-createpost](img/dlp-custom-detection-graphql-reddit-createpost.png)

![http-block-reddit-post-creation](img/http-block-reddit-post-creation.png)

Reference: [Block sites by URL](https://developers.cloudflare.com/cloudflare-one/policies/gateway/http-policies/common-policies/#block-sites-by-url).

#### More Examples for HTTP Policies

[Recommended HTTP policies](https://developers.cloudflare.com/learning-paths/secure-internet-traffic/build-http-policies/recommended-http-policies/).

### Resolver Policies

TBD

<IMAGE_HERE>

Reference: TBD.

### Egress Policies

TBD

<IMAGE_HERE>

Reference: [Use virtual networks to change user egress IPs](https://developers.cloudflare.com/cloudflare-one/tutorials/user-selectable-egress-ips/).

### Access Policies (ZTNA)

#### Isolate Third-Party Contractors

Require specific users, such as third-party contractors, to access applications via RBI, while others are allowed direct access based on different policy rules.

Reference: [Isolate Access applications](https://developers.cloudflare.com/learning-paths/zero-trust-web-access/advanced-workflows/isolate-application/).

---

## Troubleshooting, Insights & Monitoring

### Troubleshooting

Review the [FAQs](https://developers.cloudflare.com/cloudflare-one/faq/), including the [Troubleshooting WARP](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/troubleshooting/) sections and [common errors with Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/troubleshoot-tunnels/common-errors/).

Visit the [Zero Trust Help Page](https://help.teams.cloudflare.com/) and [one.one.one.one/help](https://one.one.one.one/help/) to view relevant connection information.

### Shadow IT

TBD

### Digital Experience Monitoring (DEX)

TBD

---

## Automation

### API & Terraform

Infrastructure automation tools enable developers to seamlessly integrate Zero Trust security into their application development pipelines.

For larger organizations, leveraging [Terraform](https://developers.cloudflare.com/cloudflare-one/api-terraform/) for automated deployment is highly recommended. Additionally, the **Dashboard Read-Only** functionality provides secure, audit-friendly access for monitoring and oversight.

---

## Disclaimer

Educational purposes only.

This blog post is independently created and is not affiliated with, endorsed by, or necessarily representative of the views or opinions of any organizations or services mentioned herein.

The images used in this article primarily consist of screenshots from the Cloudflare Dashboard or other publicly available materials, such as Cloudflare webinar slides.

The guidelines provided in this post are intended for general educational purposes. They should be customized to fit your specific use cases and traffic patterns. You are responsible for configuring settings according to your unique requirements, and it is important to understand their potential impact. Familiarity with Cloudflare concepts and relevant features is recommended.

The author of this post is not responsible for any misconfigurations, errors, or unintended consequences that may arise from implementing the guidelines or recommendations discussed herein. You assume full responsibility for any actions taken based on this content and for ensuring that configurations are appropriate for your specific environment.

For additional learning resources, explore the following:

- [Learning Paths](https://developers.cloudflare.com/learning-paths/)
- [Implementation Guides](https://developers.cloudflare.com/reference-architecture/implementation-guides/zero-trust/)
- [Reference Architectures](https://developers.cloudflare.com/reference-architecture/by-solution/#zero-trust--sase)
- [Enterprise Customer Portal](https://www.cloudflare.com/ecp/overview/) (for Enterprise customers)
- [Security Center](https://developers.cloudflare.com/security-center/)

If you have any questions or need assistance, please [contact Cloudflare support](https://developers.cloudflare.com/support/contacting-cloudflare-support/#methods-of-contacting-cloudflare-support).
