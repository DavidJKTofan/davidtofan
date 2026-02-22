---
title: Migrating to Cloudflare
date: 2021-04-19
description: "Migrating from Netlify to Cloudflare Pages and doing some improvements."
tags: ["cybersecurity", "cloudflare"]
type: 'article'
---

After joining Cloudflare in April 2021, I recognized the amazing potential of [Cloudflare Pages](https://pages.cloudflare.com/) and all of its other products, so I decided to migrate my website from Netlify to Cloudflare (_sorry Netlify – it was nice!_).

* * *

## My Personal Website

### Prep

All my web content is located on my [GitHub repository](https://github.com/DavidJKTofan/davidtofan.com) – you can create one for free today.

This can also be a simple `index.html` file, and Cloudflare Pages will deploy and render it.

If you rather want to use a template, here a few interesting ones:
- https://www.w3schools.com/w3css/w3css_templates.asp
- https://html5up.net/
- https://freehtml5.co/

However, for this specific migration and my personal website, I used [Hugo](https://gohugo.io/) as [Jamstack](https://jamstack.org/generators/hugo/) framework.

### Step 0: Cloudflare Pages

First, I created a FREE account on Cloudflare, and connected my [GitHub repository](https://github.com/DavidJKTofan/davidtofan.com) with Cloudflare Pages.

I had to tweak the deployment a little by adding the build command:
```
hugo --gc --minify -b https://YOUR_DOMAIN.com/
```

Additionally, I had to set an Environment Variable to use the right version:
```
HUGO_VERSION   0.80.0
```

After that, the page deployed and worked just fine.

### Step 1: DNS

Now, go to `dash.cloudflare.com` and add your custom domain. Choose the FREE plan for starters, and simply follow the next steps – which will be to change your domain's Nameservers to Cloudflare's in order to do a Full Setup and enjoy the full range of solutions and features; (alternatively, it's also possible to do a [CNAME Setup](https://support.cloudflare.com/hc/en-us/articles/360020348832-Understanding-a-CNAME-Setup) or Partial Setup).

On the DNS tab, add the following DNS records in order to connect to the page on Cloudflare Pages:
```
CNAME   davidtofan.com    CLOUDFLARE-PAGES.pages.dev   Auto
CNAME   www               CLOUDFLARE-PAGES.pages.dev   Auto
```

_Note: it's recomended to use [Page Rules](https://developers.cloudflare.com/pages/how-to/www-redirect/) to redirect `www` to the domain apex when using Cloudflare Pages.

Make sure that there are orange cloud icons ![Cloudflare Icon](img/cloudflare-orange-cloud.webp) next to the DNS records, which mean that traffic to those hostnames is running / proxied through Cloudflare.

Some other benefits of the orange cloud DNS records are:
- Masking your Origin IP
- Caching
- an HTTPS certificate on the edge servers (a separate certificate on your server is still necessary)

_NOTE: only A, AAAA and CNAME records should have the orange cloud / be proxied. For non web traffic, such as TCP or UDP protocols, solutions such as [Spectrum](https://www.cloudflare.com/products/cloudflare-spectrum/) can help. Alternatively, a gray-cloud icon (DNS-only) does not proxy traffic._

Furthermore, I also added an empty MX record because I do not use this domain for emails nor do I want to receive emails, which is set to DNS-only:
```
MX      davidtofan.com    .                            Auto
```

### Step 2: Domain

In order to redirect www to davidtofan.com, go to Page Rules > Forwarding URL and set up the following Permanent Redirect Rule 301:

Matching URL:
```
www.davidtofan.com/*
```

Destination URL:
```
https://davidtofan.com/$1
```

_Note: the DNS records need to be configured properly for this to work._

Then, I activated the DNSSEC function to add an extra layer of protection to my domain.

### Step 3: Workers

Now on to Workers – it's simply amazing! You can deploy serverless code instantly across the globe.

I used this JavaScript template to create HTTP Security Headers for my website by using Workers:
```
let securityHeaders = {
    "Content-Security-Policy": "default-src 'self'; upgrade-insecure-requests; script-src 'self' https://static.cloudflareinsights.com; img-src 'self'; object-src 'none'; form-action 'none'; base-uri 'self'; worker-src 'none'; connect-src 'self' https://static.cloudflareinsights.com/ https://cloudflareinsights.com/; child-src 'none'; frame-src 'none'; frame-ancestors 'none';",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-XSS-Protection": "1; mode=block",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "fullscreen=(self), autoplay=(), geolocation=(), microphone=(), camera=(), payment=(), interest-cohort=()",
    "Access-Control-Allow-Origin": "https://cloudflareinsights.com/"
}
let sanitiseHeaders = {
    Server: "My new server header"
}
let removeHeaders = [
    "Public-Key-Pins",
    "X-Powered-By",
    "X-AspNet-Version"
]

addEventListener('fetch', event => {
	event.respondWith(addHeaders(event.request))
})

async function addHeaders(req) {
	let response = await fetch(req)
	let newHdrs = new Headers(response.headers)

	if (newHdrs.has("Content-Type") && !newHdrs.get("Content-Type").includes("text/html")) {
        return new Response(response.body , {
            status: response.status,
            statusText: response.statusText,
            headers: newHdrs
        })
	}

	Object.keys(securityHeaders).map(function(name, index) {
		newHdrs.set(name, securityHeaders[name]);
	})

	Object.keys(sanitiseHeaders).map(function(name, index) {
		newHdrs.set(name, sanitiseHeaders[name]);
	})

	removeHeaders.forEach(function(name){
		newHdrs.delete(name)
	})

	return new Response(response.body , {
		status: response.status,
		statusText: response.statusText,
		headers: newHdrs
	})
}
```

Don't forget to add ```https://static.cloudflareinsights.com``` to your ```script-src``` directive and ```https://cloudflareinsights.com``` to your ```connect-src``` directive, in order to make [Web Analytics](https://www.cloudflare.com/web-analytics/) work on Cloudflare.

Feel free to change any details and adapt it to your needs. If you need help with the Content Security Policy (CSP), then check out my other [article](/post/website-security/).

_Code source: [The brand new Security Headers Cloudflare Worker](https://scotthelme.co.uk/security-headers-cloudflare-worker/)_

_Alternative code: [Set security headers - Workers](https://developers.cloudflare.com/workers/examples/security-headers)_

**OCTOBER 2021 UPDATE:** Cloudflare announced support for ```_headers``` and ```_redirects``` files. Simply create the files in the build directory of your project and within it, define the rules you want to apply.

For example, to prevent your ```pages.dev``` deployment from being indexed and improve SEO, add the following to your `_headers` file: 
```
https://:project.pages.dev/*
  X-Robots-Tag: noindex
```

More information here: [Custom Headers for Cloudflare Pages](https://blog.cloudflare.com/custom-headers-for-pages/)


### Step 4: Firewall

Now we set up a Firewall Rule on the Firewall Tab > Firewall Rules, such as for example to block some python requests on my website:
```
(http.user_agent contains "python")
```

There are some interesting examples on [Runcloud Blog](https://blog.runcloud.io/cloudflare-firewall-rules/).

### Step 5: Results

Finally, we analyze our website and check what has changed or improved:

-   [Cloudflare Diagnostic Center](https://www.cloudflare.com/diagnostic-center/?url=davidtofan.com)
-   [Security Headers](https://securityheaders.com/?q=https%3A%2F%2Fdavidtofan.com%2F&hide=on&followRedirects=on)
-   [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fdavidtofan.com%2F)
-   [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly/result?id=abDpKeo79FNobtHKkNFHdg)
-   [Web Page Test](https://www.webpagetest.org/result/220108_AiDc0X_9817cb34105ef8f2cb4feb25bbb13f34/)
-   [DNSViz DNSSEC](https://dnsviz.net/d/davidtofan.com/dnssec/)
-   [DNSSEC Analyzer](https://dnssec-analyzer.verisignlabs.com/davidtofan.com)
-   [GTmetrix](https://gtmetrix.com/reports/davidtofan.com/VL739AzA/)
-   [Request Map Generator](https://requestmap.webperf.tools/render/220108_BiDcM9_a3cfebd86a1cb63e69f8b9c158f80854?dark=0#)
-   [DNS Speed Benchmark](https://www.dnsperf.com/dns-speed-benchmark?id=mt8i0gky5svaw6)
-   [Yellow Lab Tools](https://yellowlab.tools/result/g5wx821w25)
-   [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=davidtofan.com&hideResults=on&latest)

## Conclusion

**2023 UPDATE:** review the [Migration Hub](https://www.cloudflare.com/migration-hub/).

Comparisons from 2023 to 2024...

### 2023

![Cloudflare Speed Measurement](img/cloudflare-speed-measurement.png)

![Screenshot 2023-12-10 at 21.22.35.png](img/Screenshot-2023-12-10-img1.png)

![Screenshot 2023-12-10 at 21.22.48.png](img/Screenshot-2023-12-10-img2.png)

![Screenshot 2023-12-10 at 21.23.01.png](img/Screenshot-2023-12-10-img3.png)

![Screenshot 2023-12-10 at 21.23.16.png](img/Screenshot-2023-12-10-img4.png)

![Screenshot 2023-12-10 at 21.23.23.png](img/Screenshot-2023-12-10-img5.png)

### 2024

![Screenshot 2024-06-02 at 00.30.41.png](img/Screenshot-2024-06-02-img1.png)

![Screenshot 2024-06-02 at 00.30.48.png](img/Screenshot-2024-06-02-img2.png)

![Screenshot 2024-06-02 at 00.32.17.png](img/Screenshot-2024-06-02-img3.png)

![Screenshot 2024-06-02 at 00.49.10.png](img/Screenshot-2024-06-02-img4.png)

![Screenshot 2024-06-02 at 00.51.14.png](img/Screenshot-2024-06-02-img5.png)

![Screenshot 2024-06-02 at 00.51.40.png](img/Screenshot-2024-06-02-img6.png)

* * * *

## More on Cloudflare

- [Introducing Cloudflare](https://davidtofan.com/articles/cloudflare-security/)
- [Intro to Cloudflare Workers](https://davidtofan.com/articles/cloudflare-workers/)
- [Cloudflare for Teams](https://davidtofan.com/articles/cloudflare-for-teams/)
