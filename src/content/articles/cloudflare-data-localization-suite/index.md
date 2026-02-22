---
title: Cloudflare Data Localization Suite
date: 2021-11-11
description: "The Data Localization Suite (DLS) is a set of features offered by Cloudflare that enable enterprise customers to manage and control the location of their data, including private TLS keys, traffic decryption, and metadata handling."
tags: ["cybersecurity", "privacy", "cloudflare"]
type: 'article'
---

This is a brief introduction to [Cloudflare Data Localization Suite](https://www.cloudflare.com/data-localization/), which honestly is A-M-A-Z-I-N-G!

Check out Matthew Prince, co-founder and CEO at Cloudflare, talking about *"giving company regional distribution controls on customer data"* [on Bloomberg Technology](https://youtu.be/FWO7HQrMyzI).

You can find more detailed information on the [Support Page](https://developers.cloudflare.com/data-localization/), specifically also what products are covered.

* * *
* * *

## Data Localization Suite

The Cloudflare Data Localization Suite is mainly composed of 4 solutions:

1. **Encryption Key Management**: Control where SSL Private Keys can be accessed by Cloudflare with **Keyless SSL** and **Geo Key Manager**

2. **Payload Inspection Boundary**: Choose where (what region) your traffic (HTTPS requests and responses) will be handled/inspected (SSL/TLS decrypted) with **Regional Services**

3. **Customer Metadata Boundary**: Decide where log data and analytics is sent with **Edge Log Delivery**, as well as protect end-user's privacy with **IP obfuscation**

## UPDATES

_Updated: January 30th 2023_

Check out the Blog Post on [Navigating the changing data localization landscape with Cloudflare’s Data Localization Suite](https://blog.cloudflare.com/dls-2022/), as well as the new [Developer Docs](https://developers.cloudflare.com/data-localization/).

Additionally, there is a new [Geo Key Manager v2](https://blog.cloudflare.com/inside-geo-key-manager-v2/) with more capabilities and features.

* * *

### Encryption Key Management

Organizations may choose to use either **Keyless SSL** or **Geo Key Manager** to ensure that their SSL/TLS keys do not leave a specific region, such as i.e. the European Union (EU) or the United States (US).

#### Keyless SSL

_[Keyless SSL](https://www.cloudflare.com/ssl/keyless-ssl/) "allows security-conscious clients to upload their own custom certificates and benefit from Cloudflare, but without exposing their TLS private keys."_

![How Keyless SSL Works Diagram](img/keyless-ssl-diagram-how-keyless-ssl-works.png)
_<caption>Image source: [Overview of Keyless SSL](https://www.cloudflare.com/ssl/keyless-ssl/).</caption>_

It allows organizations to store and manage their own SSL private keys for use with Cloudflare on any external infrastructure of their choosing. Cloudflare never has possession of the private key material at all.

More information can be found on the [Dev Docs](https://developers.cloudflare.com/ssl/keyless-ssl).

#### Geo Key Manager

[Geo Key Manager](https://blog.cloudflare.com/scaling-geo-key-manager/) allows organizations to choose where they store their TLS certificate private keys.

This is similar to Keyless SSL, with the difference that you get granular control over which locations should store the keys, which never leave the specified location/region. For example, an organization can choose for the private keys required for inspection of traffic to only be accessible inside data centers located in the specified region.

One can set this up by going on the Cloudflare Dashboard > ```SSL/TLS``` > ```Edge Certificates``` > ```Upload Custom SSL Certificate```.

More information can be found on the [Dev Docs](https://developers.cloudflare.com/ssl/edge-certificates/custom-certificates).

* * *

### Payload Inspection Boundary

Keyless SSL and Geo Key Manager ensure that private key material does not leave the specified region. Regional Services ensures that those keys are only used inside the specified region.

#### Regional Services

[Regional Services](https://blog.cloudflare.com/introducing-regional-services/) provides full control over exactly where the organization's traffic is handled.

This gives organizations control over where their HTTPS requests and responses are inspected and decrypted (SSL/TLS termination), and that traffic is securely transmitted to Cloudflare data centers inside the selected region.

![Regional Services Process Diagram](img/regional-services-process.png)
_<caption>Image source: [Introducing Regional Services](https://blog.cloudflare.com/introducing-regional-services/).</caption>_

When Regional Services is used, all of the edge application services will run inside the selected region. This includes:

* Storing and retrieving content from Cache
* Blocking malicious HTTP payloads with the Web Application Firewall (WAF)
* Detecting and blocking suspicious activity with Bot Management
* Running Cloudflare Workers scripts
* Load Balancing traffic to the best origin servers

* * *

### Customer Metadata Boundary

All of the traffic metadata that can identify a customer stays in the specified region, such as EU or US.

Cloudflare collects metadata about the usage of their products for the purposes of:

* Serving analytics via dashboards and APIs
* Sharing raw logs with customers
* Stopping security threats such as Bots or DDoS attacks
* Improving the performance of Cloudflare's network
* Maintaining the reliability and resiliency of Cloudflare's network

This metadata does not contain the contents of customer traffic, and so they do not contain usernames, passwords, personal information, and other private details of customers' end-users. However, these logs may contain end-user IP addresses, which is considered personal data in the EU.

![Metadata Boundary diagram](img/customer-metadata-boundary.png)
_<caption>Image source: [Introducing the Customer Metadata Boundary](https://blog.cloudflare.com/introducing-the-customer-metadata-boundary/).</caption>_

More info on their blog post [Introducing the Customer Metadata Boundary](https://blog.cloudflare.com/introducing-the-customer-metadata-boundary/).

#### Edge Log Delivery

With [Edge Log Delivery](https://blog.cloudflare.com/introducing-the-cloudflare-data-localization-suite/), organizations can send logs directly from the edge to their partner of choice, also allowing all of the traffic metadata that can identify a customer to stay in the specified region.

For example, an Azure storage bucket in their preferred region, or an instance of Splunk that runs in an on-premise data center. With this option, organizations can still get their complete logs in their preferred region, without these logs first flowing through either of the US or EU Cloudflare core data centers.

![Edge Log Delivery Diagram](img/edge-log-delivery-before-after.png)
_<caption>Image source: [Introducing the Cloudflare Data Localization Suite](https://blog.cloudflare.com/introducing-the-cloudflare-data-localization-suite/).</caption>_

#### IP obfuscation

Cloudflare anonymizes source IP addresses via IP truncation methods (last octet for IPv4 and last 80 bits for IPv6) on the UI and in logs. This offers end-user data privacy.

* * * * 

## Data Movement

### Data Processor

As outlined in Cloudflare's [Privacy Policy – 5. NOTICE TO UK AND EU RESIDENTS](https://www.cloudflare.com/privacypolicy/), _"Cloudflare is [commonly] a data processor of Customer Logs"_, which are end-user logs, such as i.e. analytics data, API requests and responses, and logs. 

[...] _"Cloudflare processes data on behalf of its Customers pursuant to their data processing instructions."_

### Data Controller 

As outlined in Cloudflare's [Privacy Policy – 5. NOTICE TO UK AND EU RESIDENTS](https://www.cloudflare.com/privacypolicy/),_"Cloudflare [can be] a data controller for the personal information collected [...]."_ with some expections.

### Data Exporter

According to [Chapter 19: Glossary – Unlocking the EU General Data Protection Regulation](https://www.whitecase.com/publications/article/chapter-19-glossary-unlocking-eu-general-data-protection-regulation), a _"data exporter means a controller (or, where permitted, a processor) established in the EU that transfers personal data to a data importer"_. 

Generally, that may be Cloudflare's customer which is based in the EU or may simply collect personal data from EU residents.

### Data Importer

According to [Chapter 19: Glossary – Unlocking the EU General Data Protection Regulation](https://www.whitecase.com/publications/article/chapter-19-glossary-unlocking-eu-general-data-protection-regulation), a _"data importer means a controller or processor located in a third country that receives personal data from the data exporter"_.

Generally, that may be Cloudflare itself.

* * *
* * *

## Conclusion

This is all part of Cloudflare's [Trust Hub](https://www.cloudflare.com/trust-hub/) efforts, as well as to take a rigorous and granular approach to data localization, making it easy for businesses to set rules and controls at the Internet edge, adhere to compliance regulations, and keep data locally stored and protected.

_"Trust is the foundation of Cloudflare’s business. We earn our users’ trust by respecting the sanctity of personal data transiting our network, and by being transparent about how we handle and secure that data."_ – [The Cloudflare Trust Hub](https://www.cloudflare.com/trust-hub/)

* * *

## Disclaimer

Educational purposes only, and this blog post does not necessarily reflect the opinions of Cloudflare. This is not legal advice. There are many more aspects to Cloudflare and its products and services – this is merely a brief educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful! Images are online and publicly accessible.
