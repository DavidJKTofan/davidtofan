---
title: Intro to Website Security
date: 2021-02-28
description: "Exploring website security, best practices and standards."
tags: ["cybersecurity", "developers"]
type: 'article'
---

Welcome to a brief introduction to Website Security – **FOCUS ON: Content Security Policy (CSP)**.

Nowadays, it's very easy and fast to create and deploy websites. Services like WIX, Squarespace, Webflow, Wordpress, and others make it so easy to create beautiful websites in a matter of hours. Almost anyone with a little bit of time at hand can do that.

However, not everyone thinks or even knows about how to properly secure their website, once it is deployed and public. Most services do offer some basics and take care of some features and configurations under the hood, such as HTTPS (SSL Certificate), but that is barely scratching the surface of website security. Especially, if you are actively being targeted by hackers or other threat actors. And even if you are not being targeted, it is good to at least understand that your and most other websites have a certain degree of security that will maintain you and your information safe, (or not).

Let's dive right into it. Below a quick overview...

* * *

## The OWASP Top 10

Here you will find the top 10 web application security risks: [Top 10 Web Application Security Risks – OWASP](https://owasp.org/www-project-top-ten/)

In this blog post you'll learn a little bit more about the X-XSS-Protection (_Cross-Site Scripting (XSS)_), specifically about the Content Security Policy (CSP).

## Content Security Policy (CSP)

_"The HTTP Content-Security-Policy response header allows web site administrators to control resources the user agent is allowed to load for a given page."_

This is probably one of the most forgotten aspects in website security. CSP allows you to set certain parameters for your website in order to prevent specific attacks or unauthorized access or modifications from external resources.

Here a small example of a CSP in a website header block:

    <meta http-equiv="Content-Security-Policy" content="default-src https://cdn.example.net; child-src 'none'; object-src 'none'">

_"Fetch directives control the locations from which certain resource types may be loaded."_

All fetch directives, such as `default-src` or `child-src`, have a specific meaning and purpose. Some good places to start learning more about CSP and the fetch directives are these websites:

-   [Content Security Policy Reference Guide](https://content-security-policy.com/)
-   [Mozilla Developer - CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
-   [Google Developers - CSP](https://developers.google.com/web/fundamentals/security/csp)

Additionally, if you want to know what CSP a specific website has implemented, you can use these tools:

-   [Security Headers](https://securityheaders.com/)
-   [Mozilla Observatory](https://observatory.mozilla.org/)
-   [CSP Evaluator with Google](https://csp-evaluator.withgoogle.com/)
-   [CSP Scanner](https://cspscanner.com/)
-   [Content Security Policy (CSP) Validator](https://cspvalidator.org/)
-   [HTTP Header Checker – KeyCDN](https://tools.keycdn.com/curl)

### Implementation of a CSP

In order to implement CSP on your website, it depends on what your website is built on or what hosting provider you are using. Most often, you configure your CSP on server side configurations. But in some cases you might apply it on the website header as a meta tag (as shown in the first example above).

The _most_ important part of implementation though is to know your own website: what external sources, links, external resources is your website using? Are they all really necessary? Do those resource locations change over time, or are they static? Depending on what you answer to each of these questions, you will have to change and adapt your CSP to your own needs – step by step.

An easy way to figure those out is to start with implementing the default CSP `Content-Security-Policy: "default-src 'self';`, and then when you inspect your website (_Command + Shift + C_ on MacOs / _Control + Shift + C_ on Windows) with Google Chrome, the console will display what resources and hashes need to be added to your CSP in  most cases. Do it step by step, in order to be able to fix anything that you might accidentally break.

Don't forget that CSP varies from website to website. It mostly depends on what resources you want your website to be able to load.

Below you will find a few general examples on how to implement CSP on different platforms:

#### Apache

In your `httpd.conf` main configuration file – usually located in `/etc/httpd/conf` or `/etc/httpd/conf` or `/etc/apache2/` – add your CSP.

Here is a simple example:

    Header set Content-Security-Policy "default-src 'self';"

If you are using **Wordpress**, you can either use a [Wordpress plugin](https://wordpress.org/plugins/tags/csp/) to add your CSP, or you can add your policy to the default `.htaccess` distributed configuration file.

Here is a simple example:

    <IfModule mod_headers.c>
      Header set Content-Security-Policy "default-src 'self'; img-src 'self' http: https: *.gravatar.com;"
    </IfModule>

#### Nginx

In your `nginx.conf` configuration file – usually located in the `/etc/nginx` or `/usr/local/nginx/conf` or `/usr/local/etc/nginx` directory –, add your CSP at the end of your `server {}` block.

Here is a simple example:

    add_header Content-Security-Policy "default-src 'self';";

#### Netlify

Add a file named `_headers` to your website's root directory.

Here an example of a `_headers` file:

    /*
      Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
      Content-Security-Policy: default-src 'self' https:; img-src 'self'; script-src 'self'; style-src 'self'; font-src 'self' https://fonts.googleapis.com/ https://fonts.gstatic.com/; child-src 'none'; object-src 'none'; report-uri https://YOUR_DOMAIN.report-uri.com/r/d/csp/reportOnly
      X-Frame-Options: SAMEORIGIN
      X-XSS-Protection: 1; mode=block
      X-Content-Type-Options: nosniff
      Referrer-Policy: no-referrer
      Permissions-Policy: fullscreen=(self "https://www.YOUR_DOMAIN.com/"), geolocation=*
      Cache-Control: max-age=0
      Cache-Control: no-cache
      Cache-Control: no-store
      Cache-Control: must-revalidate

_Source: [Netlify Docs](https://docs.netlify.com/routing/headers/)_

#### Cloudflare

Visit the `Workers` tab within your Cloudflare account. Click the `Manage Workers` button and then click `Create a Worker`.
Add the following code to the Worker, and add your security header parameters.

    const securityHeaders = {
            "Content-Security-Policy": "upgrade-insecure-requests",
            "Strict-Transport-Security": "max-age=1000",
            "X-Xss-Protection": "1; mode=block",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        sanitiseHeaders = {
            Server: ""
        },
        removeHeaders = [
            "Public-Key-Pins",
            "X-Powered-By",
            "X-AspNet-Version"
        ];

    async function addHeaders(req) {
        const response = await fetch(req),
            newHeaders = new Headers(response.headers),
            setHeaders = Object.assign({}, securityHeaders, sanitiseHeaders);

        if (newHeaders.has("Content-Type") && !newHeaders.get("Content-Type").includes("text/html")) {
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        }

        Object.keys(setHeaders).forEach(name => newHeaders.set(name, setHeaders[name]));

        removeHeaders.forEach(name => newHeaders.delete(name));

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    }

    addEventListener("fetch", event => event.respondWith(addHeaders(event.request)));

_Code source: [GitHub](https://github.com/securityheaders/security-headers-cloudflare-worker)_

_More info on [Workers Docs](https://developers.cloudflare.com/workers/examples/alter-headers)_

_Note: Cloudflare will grant you 100,000 free worker requests per day on the FREE plan._

Back on the Workers dashboard click the `Add Route` button.

-   Configure your route using [Cloudflare's Matching Behavior syntax](https://developers.cloudflare.com/workers/platform/routes#matching-behavior).
-   Select the Worker you just created.
-   Expand the "Request limit failure mode" accordion to configure Failure mode (select "Fail" open) so that users can continue to use your website if you run out of requests.
-   Add additional routes to prevent the CSP worker from processing requests for static assets (such as `img`, `style`, `scripts`, `assets`, etc.).

_Source for Cloudflare: Thanks to [maxchadwick](https://maxchadwick.xyz/blog/cloudflare-worker-csp)_

_Alternatively, check out this article: [GeekFlare](https://geekflare.com/de/cloudflare-workers-secure-headers/)_

Definitely also check out [Cloudflare Zaraz supports CSP](https://blog.cloudflare.com/cloudflare-zaraz-supports-csp/).

### Report URI

_"Report URI provides real-time security reporting for your site."_

It is a useful feature built into content-security-policy that allows you to get insights on your policy. The probably most useful website for this is the one below:

-   [Report URI](https://report-uri.com/)

Report URI allows you to easily display your CSP, as well as any errors that might occur over time. It has many more features, but it is definitely a good place to start learning about analytics.

## Implementing HTTPS

Another important aspect of Website Security is HSTS and HTTPS. Normally, your hosting provider should allow you to activate HTTPS for your domain, providing you with SSL Certificates.

Now, we can submit our domain to be preloaded. Being added to the [HTTP Strict Transport Security (HSTS)](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) preload list, allows our website to be _hardcoded_ into the browser, and your site should not be available in an insecure way anymore.

The following page allows us to submit our domain:

-   [HSTS Preload](https://hstspreload.org/)

And then we can test our SSL and security level on the following page:

-   [SSL Labs](https://www.ssllabs.com/ssltest/)

If you are using **Cloudflare**, then take a look at those amazing short YouTube tutorials:

-   [HTTPS Is Easy](https://httpsiseasy.com/)

## Web Security Analysis Tools

There are also other several tools out there that can be helpful to do further security checks and analysis on websites. Check these out:

-   [HostedScan Security](https://hostedscan.com/scans)
-   [Probely](https://probely.com/)
-   [Sucuri Site Check](https://sitecheck.sucuri.net/)
-   [Website Security Test](https://www.immuniweb.com/websec/)
-   [Blacklight](https://themarkup.org/blacklight)

Other good places to start learning more are these articles (or just Google):

-   [Hardening Your HTTP Security Headers – KeyCDN](https://www.keycdn.com/blog/http-security-headers)
-   [HTTP Headers for fast & secure static sites](https://simonhearne.com/2019/http-headers-fast-and-secure/)

## Server and Network Security

Let's not forget websites are served by servers. Security actually starts right there (_Security Misconfiguration_). The level of your server security depends on who is your hosting provider, what are you web admin configurations, how's your network firewall configured, and several other aspects.

There are many more aspects and more things to take into account when working on your website's security. Google can be your best friend for that. Feel free to also contact your hosting provider to learn more about how to properly secure your website.

* * * *

## Disclaimer

This is a very general introduction to Website security, specifically to Content Security Policy (CSP). Educational purposes only. There are many more aspects to website security which are not covered here, and all implementations might differ from situation to situation, technology to technology. Remember, you are responsible for your own actions – this is merely an educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful!
