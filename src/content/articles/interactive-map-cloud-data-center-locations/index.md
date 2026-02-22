---
title: Where the Cloud lives – an Interactive Map of Data Center Locations of Top Cloud Providers
date: 2023-01-30
description: "Explore the datacenter distribution and visualization of major Zero Trust providers across the globe."
tags: ["cybersecurity", "cloud", "datacenters", "resources"]
type: 'article'
---

Have you ever wondered – where does _the Cloud_ live?

Let's take a look at an [interactive map of data center locations of top cloud providers](https://sasecloudmap.com/).

* * *

## Data Center Locations

This can be a useful tool for visualizing the locations and availability of cloud providers, which specifically offer [Zero Trust](https://www.cloudflare.com/learning/security/glossary/what-is-zero-trust/) services, or similar.

### The Development... 🛠️

First and foremost, where do we get **the data** from?

Many cloud providers do not disclose detailed information about the locations of their data centers, with some being accessible only behind login pages, others seemingly behind the _whois_ information of IP ranges and ASNs, and some located on (probably unknown or forgotten) public projects.

Nonetheless, some providers fortunately like to visually show their presence across the globe – like for example [Cloudflare](https://www.cloudflare.com/network/) and [Zscaler](https://trust.zscaler.com/zscaler.net/data-center-map). Others have API endpoints or tables with location data, or we were also thinking of looking up what information their public IP addresses would return to us.

Once we googled and searched like champions for weeks and scratched our heads a few times, we found some ways to get some proper data together.

Of course, we intended to use [Cloudflare Workers](https://developers.cloudflare.com/workers/) in order to take care of most of the things and deploy the application without the need to think about configuring or maintaining our own infrastructure.

Then the real task began, which involved obtaining the data in an automated manner as much as possible, enhancing certain elements to generate [geoJSON](https://geojson.org/)s and subsequently creating interactive maps using the obtained data, as well as including their respective icons.

We decided to store the geoJSONs in [Workers KV](https://developers.cloudflare.com/workers/wrangler/workers-kv/) and the icons and other assets on [Cloudflare R2](https://developers.cloudflare.com/r2/) – all offering generous FREE plans.

We also had to figure out the proper sizes of each icon, as you can see...

![Testing Map 1](img/map-test-1.png)

And even had a weird "bug", where the data of all providers was scrumbled and overwritten, because we wanted to try to use import one centralized geoJSON skeleton for each JS file; (we fixed it though).

![Testing Map 5](img/map-test-5.png)

There are many more tales to tell about what we experienced during this project. However, to get to the point, after some sleepless nights, many pizzas and drinks, it is finally live and it (seems to) work. (Big thank you to my buddy at Cloudflare!)

How it looks:

![Cloudflare vs Zscaler](img/cloudflare-vs-zscaler.png)

Additionally, we wanted to make it easier to compare the vendors with Cloudflare. So there's a nice little button on the right top corner now to do exactly that.

![Comparison](img/comparison.gif)

### Performance ⚡️

Performance is important, for you, for us, for everyone, because you want a smooth online experience. And because performance is important to you, take a look at the blog post [Cloudflare is faster than Zscaler](https://blog.cloudflare.com/network-performance-update-cio-edition/).

Through [Cloudflare Workers](https://workers.cloudflare.com/) we are not only deploying the severless code across the entire Cloudflare network within minutes, but it is also running blazing fast. 

![PageSpeed Insights](img/pagespeed-insights.png)

_Note: maps might run slower due to more third-party code dependencies and higher CPU usage, or your network situation._

We also added the [Cache TTL](https://developers.cloudflare.com/workers/runtime-apis/kv/#cache-ttl) parameter to the KV, in order to reduce cold read latency on keys and cache the KV values.

On another note, when you start using Cloudflare Pages, it enjoys [early access to the latest, greatest, and fastest standards and network protocols](https://blog.cloudflare.com/cloudflare-pages-is-lightning-fast/), such as TLS 1.3, IPv6, QUIC & HTTP/3.

Essentially, you can [build your next big idea with Cloudflare Pages](https://blog.cloudflare.com/big-ideas-on-pages/).

### Security 🔐

Ensuring the security of our website and tokens is crucial. 

We started by looking at the Mapbox documentation: [How to use Mapbox securely](https://docs.mapbox.com/help/troubleshooting/how-to-use-mapbox-securely/).

Out of the box, we are already benefiting from Cloudflare's offerings, such as [SSL/TLS](https://developers.cloudflare.com/ssl/), [DDoS protection](https://developers.cloudflare.com/ddos-protection/), [WAF Managed Rules](https://developers.cloudflare.com/waf/managed-rules/), [Bot Management](https://developers.cloudflare.com/bots/), and more, which provide great application security.

### Next Steps... 🚀

As next steps, we'd like to improve the overall stability and performance of the code running on Cloudflare Workers – and the static homepage –, the comparison of the different cloud providers, as well as adding more Cloud providers and potentially improve data accuracy and the design of the map.

What else should we do?

## Feedback is welcomed!

Go to the [GitHub repo](https://github.com/DavidJKTofan/sase-cloud-map) and feel free to fork, contribute, open issues, provide feedback, and help improve.

For questions, feel free to reach out (I'll try to answer). 🤓

Thank you!

* * *

## Disclaimer

Educational purposes only. This blog post does not necessarily reflect reality, or the opinions of Cloudflare or any other entity mentioned. The data is collected from publicly available sources on the Internet and is intended for general informational and educational purposes only. While we make every effort to ensure the accuracy and completeness of this information, we cannot guarantee that it is completely reliable, current, or free from errors or omissions. This website and its owners shall not be held liable for any damages or losses arising from the use of the information provided on this website. By accessing this website, you agree to use the information provided here at your own risk.
