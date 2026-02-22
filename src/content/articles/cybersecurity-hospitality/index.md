---
title: Cybersecurity in Hospitality
date: 2022-11-01
description: "Helping the travel and tourist industries become safer."
tags: ["cybersecurity", "privacy", "travel", "hospitality"]
type: "article"
---

## Cybersecurity in Hospitality

According to the [Cloudflare DDoS threat report for 2022 Q4](https://blog.cloudflare.com/ddos-threat-report-2022-q4/), the Hospitality industry was the most targeted industry of application-layer Distributed Denial of Service (DDoS) attacks.

All businesses in the hospitality industry, including hotels, hostels, and aparthotels, require cybersecurity. Actually, especially those, since they are dealing with lots of personal information on a daily basis.

Even hotel management SaaS companies like [Cloudbeds](https://www.cloudbeds.com/cloudbeds-data-security/) are taking security seriously, and continuously improving their setup.

### Performance and Conversion Rate

In addition to the security benefits of using Cloudflare, it can also improve the performance of your website, which can in turn improve your conversion rate.

A slow-loading website can be frustrating for users and may lead them to abandon the site before completing a booking or other desired action. On the other hand, a fast and responsive website can provide a better user experience and increase the likelihood that users will complete a booking or other desired action.

By using Cloudflare's performance features, such as its content delivery network (CDN) and optimization tools, you can improve the speed and responsiveness of your website, leading to a better user experience and potentially higher conversion rates.

### Application Security

To briefly point out the obvious again: your websites and servers require cybersecurity.

You can get started with advanced security and performance by signing up for the [Cloudflare Business Plan](https://www.cloudflare.com/plans/business/), which costs only $200 per month.
This plan includes a Web Application Firewall (WAF) and the latest version of TLS encryption, which are requirements for [PCI DSS compliance](https://www.cloudflare.com/resources/assets/slt3lc6tev37/1kR1Ql7kIS7wsgPpFYASkG/3860de26da985a63a5e5127d2d28f140/PCI_compliance.pdf). Visit the websites to learn more.

However, keep in mind that the Business Plan is a self-service option, so you will be responsible for setting everything up yourself.

If you require support, and enterprise-grade and customizable solutions, as well as [Data Localization Suite](https://www.cloudflare.com/data-localization/) – to control on a technical-level that visitor traffic's metadata which can identify a customer stays in the EU, and TLS termination and inspection happens only in EU data centers –, then get in touch with the Cloudflare team to talk about the [Enterprise Plan](https://www.cloudflare.com/enterprise/).

The Enterprise Plan includes the following features, among others:

- 24/7/365 email & emergency phone support
- Enterprise guided onboarding, training & continued 24/7/365 support
- Dependable service level agreements (SLA) with 100% uptime
- Advanced DDoS Protection
- Access common compliance documentation for topics like PCI, SOC 2, ISO, and more

### Compliance

In terms of compliance, most often many hospitality businesses are faced with the challenges of using (or not using) Google products, especially Google Analytics or Google Fonts.

In addition, to move closer to PCI DSS compliance, it's crucial to implement application security measures, specifically a [Web Application Firewall (WAF)](https://developers.cloudflare.com/waf/) and a [minimum TLS version of 1.2](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/).

See the overview of Cloudflare's [certifications and compliance resources](https://www.cloudflare.com/trust-hub/compliance-resources/).

#### Google Analytics

With [Cloudflare Zaraz](https://developers.cloudflare.com/zaraz/) you can quickly and easily set the following settings for Google Analytics and other third-party tools:

- Hide Originating IP Address (more info on the [DevDocs](https://developers.cloudflare.com/zaraz/faq/#after-moving-from-google-analytics-4-to-zaraz-i-can-no-longer-see-demographics-data-why))
- Remove URL query parameters
- Trim IP addresses
- Clean User Agent strings
- Remove external referrers

Therefore, answering and following the guidelines set out by the [French National Data Protection Authority (CNIL)](https://blog.cloudflare.com/zaraz-privacy-features-in-response-to-cnil/), the [Austrian Data Protection Authority (DSB)](https://blog.cloudflare.com/keep-analytics-tracking-data-in-the-eu-cloudflare-zaraz/), and others.

Read more about [Cloudflare Zaraz](https://davidtofan.com/articles/cloudflare-zaraz/) in my other article.

#### Google Fonts

According to [TechnikNews](https://www.techniknews.net/en/news/datenschutzverletzung-wegen-google-fonts-datenschutzanwalt-mahnt-ab/) and other sources, Google Fonts sends website users' IP addresses to the US, which is a violation of GDPR.

The potential solutions are:

1. Locally host fonts

Download the fonts files and host them on your server, loading them straight from there, instead of another third-party server.

2. Disable Google Fonts altogether

Changing your Content-Security-Policy (CSP) to `content-security-policy: font-src 'self';`.

3. Get user consent before

Technically, you are allowed to use Google Fonts, if the website user has given explicit consent prior to them downloading and loading. The users should be informed that their IP addresses will be sent to Google servers to provide your website with Google Fonts.

Make sure to stay up to date with the latest requirements and news.

#### Google reCAPTCHA

reCAPTCHA collects personal information and communicates with Google servers.

Introducing [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/): a user-friendly, privacy-preserving alternative to CAPTCHA.

Additionally, Apple devices with versions iOS 16+, iPad 16+ or macOS 13+ will send an encrypted [Private Access Tokens](https://blog.cloudflare.com/eliminating-captchas-on-iphones-and-macs-using-new-standard/) to Cloudflare, in order to verify that the user is a human – without completing a CAPTCHA or giving up personal data.

If you are currently using reCAPTCHA, [follow this tutorial to smoothly migrate](https://developers.cloudflare.com/turnstile/get-started/migrating-from-recaptcha/) to Cloudflare Turnstile.

Check out the [Demo here](https://demo.turnstile.workers.dev/).

### Administrative Security

Protecting your access to sensitive platforms, such as your Booking.com account, is crucial.

Bad actors often attempt to take over hotel Booking.com accounts to spread phishing links and steal customers' personal data. If your account is compromised, it's generally recommended to follow these steps (not necessarily in this order):

- Restrict or block the [permissions](https://partner.booking.com/en-us/help/account-and-log/extranet-pulse/understanding-bookingcom-extranet-account-types-and-access) of the affected user’s account.
- Fill out the [Report a security issue](https://partner.booking.com/en-gb/help/legal-security/security/report-security-issue) form.
- [Report](/articles/protect-against-phishing/#reporting) the phishing URLs.
- Notify affected customers as quickly as possible to prevent them from clicking the links.

Preventing such situations is the best approach. Booking.com has a useful article on this topic: [Preventing unauthorized use of your account](https://partner.booking.com/en-gb/help/legal-security/security/preventing-unauthorised-use-your-account), and there's more guides out there.

Finally, providing annual training on standard cybersecurity hygiene and practices for yourself and your hotel staff, especially those managing sensitive platforms and customer data, is highly recommended.

---

## Physical Security in Hospitality

Physical security is an essential aspect of any industry, but it is especially crucial in the hospitality industry, specifically hotels, to prevent unauthorized access to guests' sensitive information such as passport copies or bank details. Hotels collect and store sensitive data of their guests for various reasons, including check-in and payment processing. This data must be protected from unauthorized access, theft, or misuse to prevent potential financial loss, identity theft, and damage to the hotel's reputation.

How often have we seen papers with scans of passports laying around at the reception of a hotel? Once too many... Personally, I don't want my information to be handled like that.

However, first and foremost, employees need training and need to be aware of the fact that they themselves also wouldn't like to have their passport information laying around for anyone to see.

Hotel staff must be trained to identify and report suspicious behavior, handle sensitive data with care, and follow strict security protocols. It is essential to educate staff on how to identify phishing scams, social engineering attacks, and other types of cyber threats that can lead to unauthorized access to sensitive information.

### Conclusion

Get cybersecurity and performance, and achieve compliance within only a few hours, with the support of Cloudflare.

Interested in some [demos](https://www.cf-testing.com/)?

Need help getting started with Cloudflare? Get a [personalized recommendation](https://www.cloudflare.com/about-your-website/).

Do not forget physical security and training for your employees, to prevent unauthorized access to documents or computers.

---

## Disclaimer

This is a very general introduction to Cybersecurity in Hospitality. Educational purposes only. This blog post does not necessarily reflect the opinions of Cloudflare, or any other entities mentioned. There are many more aspects to Cloudflare and its products and services – this is merely a brief educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful! Images are online and publicly accessible.
