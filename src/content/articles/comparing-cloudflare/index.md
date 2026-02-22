---
title: Comparing Cloudflare
date: 2022-06-30
description: "A comparison of cybersecurity features and solutions."
tags: ["cybersecurity", "cloudflare"]
type: 'article'
draf: true
---

## Cloudflare One

_[Cloudflare One Week](https://blog.cloudflare.com/cloudflare-one-week-2022/)_ is one of the several innovation weeks that Cloudflare organizes every year to highlight new product announcements, beta products opening up to general availability, and share how their users and customers are using Cloudflare to help build a better Internet.

> _We believe in Zero Trust Architecture so strongly that we worked with security experts to build a **vendor-agnostic guide** to implementing Zero Trust_

Check it out here: **https://zerotrustroadmap.org/**

All Cloudflare's solutions related to Zero Trust and SASE are mapped out here: [Zero Trust, SASE and SSE: foundational concepts for your next-generation network](https://blog.cloudflare.com/zero-trust-sase-and-sse-foundational-concepts-for-your-next-generation-network/)


## Comparison Table

|                                          |                                    **Cloudflare**                                   |                                **Akamai**                               |                                      **Zscaler**                                     |                     **Cisco**                     |            **Netskope**           |
|:----------------------------------------:|:-----------------------------------------------------------------------------------:|:-----------------------------------------------------------------------:|:------------------------------------------------------------------------------------:|:-------------------------------------------------:|:---------------------------------:|
|                **GENERAL**               |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |
| Data centers / Points of Presence (POPs) |                                         +270                                        |                        ~4,200  (+11 with Linode)                        |                           +55 cities  (~8 distinct clouds)                           |                        +37                        |                +50                |
|         Network Interconnections         |                                       +10,500                                       |                                  +1,400                                 |                                                                                      |                                                   |                                   |
|             Network capacity             |                                      +142 Tbps                                      |                                +800 Tbps                                |           +1.5 Tbps (maximum bandwidth of 1 Gbps for each GRE [IP] tunnel)           |                      +1 Tbps                      |             +100 Tbps             |
|                  Ciphers                 |               Post-quantum cryptography, BoringSSL, TLS 1.3 and below               | TLS 1.3 and below (TLS 1.2 and below for Enterprise Application Access) |                                   TLS 1.3 and below                                  |                 TLS 1.2 and below                 |         TLS 1.3 and below         |
|                  Clients                 |                                  ✅ – uses WireGuard                                 |                      ✅ – outbound via TCP port 443                      |                                           ✅                                          |                         ✅                         |     ✅ – download limit of 1 MB    |
|  Traffic Forwarding Methods / Protocols  |         Client, GRE Tunnel, IPsec Tunnel, PAC Files, Cloudflare Tunnel, QUIC        |                GRE Tunnel, IPsec Tunnel, Tunnel-type 2.0                | Client, GRE Tunnel, IPsec Tunnel, PAC Files, Proxy Chaining, Zscaler Cloud Connector |                                                   |                                   |
|              **ZERO TRUST**              |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |
|          **Secure Web Gateway**          |                                **Cloudflare Gateway**                               |                                                                         |                           **Zscaler Internet Access (ZIA)**                          |                 **Cisco Umbrella**                |     **Netskope Next Gen SWG**     |
|                DNS queries               |    ~1,391 billion DNS queries per day (responsible for the F-root DNS nameserver)   |                     ~7 trillion DNS requests per day                    |                                           -                                          |          ~400 billion DNS queries per day         |                 -                 |
|    Unlimited SSL/TLS (HTTP) inspection   |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
| Web and URL filtering (incl. categories) |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
|               DNS filtering              |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
|      Antivirus / Malware protection      |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
|        Data Loss Prevention (DLP)        |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
|         Automatic threat updates         |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
|  Maximum bandwidth / Network bottleneck  |                                        6 Gbps                                       |                                                                         |                                        1 Gbps                                        |                                                   |                                   |
|                **Access**                |                                **Cloudflare Access**                                |                 **Enterprise Application Access (EAA)**                 |                                                                                      |                                                   | **Netskope Private Access (NPA)** |
|                                          |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |
|                                          |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |
|                                          |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |
|           **Browser Isolation**          |                             **Remote Browser Isolation**                            |                                                                         |                              **Cloud Browser Isolation**                             | **Cisco Umbrella remote browser isolation (RBI)** |                                   |
|                 Features                 |     Disable keyboard, upload/download, copy-pasting, printing, and add watermark    |                                                                         |                  Disable upload/download, copy-pasting, and printing                 |                                                   |                                   |
|                Clientless                |                                          ✅                                          |                                                                         |                                           ✅                                          |                                                   |                                   |
|                Limitations               | Webcam / Microphone support is unavailable Websites that use WebGL may not function |                                                                         |      Maximum 10 browser tabs open Isolated browser URL address bar is read-only      |                                                   |                                   |
|            **Email Security**            |                                **Cloudflare Area 1**                                |                                                                         |                          **Zscaler Delivery Assurance (?)**                          |                    **IronPort**                   |                                   |
|                                          |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |
|                 **CASB**                 |                                 **Cloudflare CASB**                                 |                                    -                                    |                                   **Zscaler CASB**                                   |                **Cisco Cloudlock**                |         **Netskope CASB**         |
|                                          |                                                                                     |                                                                         |                                                                                      |                                                   |                                   |


_NOTE: data as of June 2022._

**WORK IN PROGRESS...**


## Information Sources

**GENERAL**
- Cloudflare: https://www.cloudflare.com/network/ and https://developers.cloudflare.com/ssl/ssl-tls/cipher-suites/ and https://github.com/cloudflare/boring and https://blog.cloudflare.com/post-quantumify-cloudflare/ 
- Zscaler: https://trust.zscaler.com/zscaler.net/data-center-map and https://www.zscaler.com/press/zscaler-powers-its-global-data-centers-and-offices-100-renewable-energy and https://help.zscaler.com/zia/supported-cipher-suites-ssl-inspection and https://help.zscaler.com/zpa/about-zpa-cloud-architecture and https://www.zscaler.com/blogs/company-news/2019-review and https://help.zscaler.com/zscaler-client-connector/using-zscaler-client-connector
- Cisco: https://umbrella.cisco.com/why-umbrella/global-network-and-traffic and https://www.nojitter.com/video-collaboration-av/webex-meetings-or-zoom-peering-performance and https://support.umbrella.com/hc/en-us/articles/4403299537044-Umbrella-Supported-Cipher-Suites and https://www.cisco.com/c/en/us/td/docs/security/asa/asa96/asdm76/vpn/asdm-76-vpn-config/vpn-asdm-ssl.html and https://www.cisco.com/c/en/us/support/security/anyconnect-secure-mobility-client/products-installation-and-configuration-guides-list.html 
- Akamai: https://www.akamai.com/why-akamai and https://www.akamai.com/company/facts-figures and https://www.datacenterknowledge.com/archives/2012/03/08/akamai-now-running-105000-servers and https://www.datacenterdynamics.com/en/news/cdn-company-akamai-enters-cloud-business-with-900m-linode-acquisition/ and https://www.akamai.com/our-thinking/cdn/what-is-a-cdn and https://seekingalpha.com/article/4379686-akamai-granddaddy-of-cdn-is-well-positioned-for-next-generation-applications and https://community.akamai.com/customers/s/article/SSL-TLS-Cipher-Profiles-for-Akamai-Secure-CDNrxdxm?language=en_US and https://techdocs.akamai.com/eaa/docs/config-tls-cipher-suite-apps and https://techdocs.akamai.com/eaa-gmbo/docs/eaa-client-admin and https://techdocs.akamai.com/eaa-gmbo/docs/welcome-eaa
- Netskope: https://www.bizety.com/2019/07/29/netskope-builds-50-pop-100-tbps-cdn-caliber-network/ and https://www.netskope.com/press-releases/netskope-global-coverage-and-connectedness-newedge-infrastructure and https://docs.netskope.com/en/traffic-steering.html and https://docs.netskope.com/en/netskope-client.html and https://docs.netskope.com/en/steering-configuration.html

**ZERO TRUST**
- Cloudflare: https://developers.cloudflare.com/warp-client/get-started/ and https://developers.cloudflare.com/workers/examples/data-loss-prevention/ and https://developers.cloudflare.com/cloudflare-one/policies/browser-isolation/ and https://blog.cloudflare.com/cloudflare-one-vs-zscaler-zero-trust-exchange/ and https://www.cloudflare.com/products/zero-trust/cloudflare-vs-cisco-umbrella/ and https://www.cloudflare.com/reliability/
- Zscaler: https://www.zscaler.com/platform/zscaler-client-connector and https://help.zscaler.com/zia/about-data-loss-prevention and https://help.zscaler.com/zia/about-cloud-browser-isolation and https://www.zscaler.com/technology/browser-isolation and https://help.zscaler.com/zia/limits-cloud-browser-isolation and https://help.zscaler.com/zia/handling-dns-resolution-various-traffic-forwarding-methods
- Cisco: https://umbrella.cisco.com/products/remote-browser-isolation 
- Akamai: https://www.akamai.com/products/enterprise-application-access 
- Netskope: https://www.netskope.com/products/private-access


### Other sources

- [Vendor-agnostic Zero Trust Roadmap](https://zerotrustroadmap.org/)
- [Comparing Cloudflare vs. Zscaler](https://www.cloudflare.com/products/zero-trust/cloudflare-vs-zscaler/)
- [Worker Environments](https://workers.js.org/#state-of-worker-environments)
- [Choosing Between DNSFilter and Cloudflare Gateway?](https://www.dnsfilter.com/vs-cloudflare-gateway)
- [Compare the SASE Market](https://www.netify.com/lists/10-best-sase-vendors-comparison)

### Credits

Thank you [Tables Generator](https://www.tablesgenerator.com/markdown_tables#), friends, and colleagues.

* * * *

## Disclaimer

Educational purposes only.

Empty fields might imply that no publicly available information was found. 

This is a non exhaustive table, and new information might become available in the future. 

This is a general comparison between Cloudflare and potential competitors or alternatives, using publicly available information. Educational purposes only, and this blog post does not necessarily reflect the opinions of Cloudflare, or any other entity or company mentioned here. All logos, and brands are property of their respective owners.

There are many more aspects to Cloudflare and its products and services – this is merely a brief educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful! Images are online and publicly accessible.