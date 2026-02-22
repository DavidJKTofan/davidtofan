---
title: Intro to Email Security
date: 2021-02-28
description: "How to improve email security and reliability."
tags: ["cybersecurity", "email"]
type: 'article'
---

Welcome to a brief introduction to Email Security – **FOCUS ON: SPF, DKIM, and DMARC**.

* * *

## Email Security Overview

Some very useful tools which provide more insights and troubleshooting for your email security are the following:

* [Google Admin Toolbox](https://toolbox.googleapps.com/apps/main/)
* [Email Security Grader (ESG)](https://www.emailsecuritygrader.com/)
* [MX Toolbox](https://mxtoolbox.com/)

Additionally, a great checklist for the most important aspects can be found here:

* [The Email Security Checklist](https://www.upguard.com/blog/the-email-security-checklist)


## Google Workspace (formerly G Suite)

Google Workspace is one of the most used business email providers for startups and SMEs alike. Even larger companies trust Google with their email and internal communication. And Google already offers a good security by default. However, you should always look further than the default, and make sure to keep up-2-date with new security features and solutions.

Some of the most basic aspects of better email security are the three following authentication configurations:

* SPF (Sender Policy Framework)
* DKIM (DomainKeys Identified Mail)
* DMARC (Domain-based Message Authentication, Reporting, and Conformance)

All of these need to be properly configured in your domain's DNS records. That's why it is also important to properly choose and protect your Domain Registration Providers. Some providers I personally have had good experiences with so far are the following:

* [Google Domains](https://domains.google/)
* [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)
* [GoDaddy](https://www.godaddy.com/)
* [WIX Domain Names](https://www.wix.com/domain/names)

After you have chosen your favorite Domain Registration Provider, you should start setting up your email security...


### Sender Policy Framework (SPF)

"_SPF is an email authentication method designed to detect forging sender addresses during the delivery of the email._"

Normally, SPF (TXT record) looks like this:
```
v=spf1 include:_spf.google.com ~all
```

More info here:

* [Ensure mail delivery & prevent spoofing (SPF)](https://support.google.com/a/answer/33786)


### DomainKeys Identified Mail (DKIM)

_"DKIM is an email authentication method designed to detect forged sender addresses in email._"

Go to `Apps > Google Workspace > Settings for Gmail > Authenticate email` and you'll find DKIM authentication configuration. Select your email domain and generate a new record. Select your DKIM key bit length (usually the higher, the more secure), and leave the prefix selector as is.

Normally, DKIM (TXT record) looks like this:
```
k=rsa; t=s; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGMjj8MVaESl30KSPYdLaEreSYzvOVh15u9YKAmTLgk1ecr4BCRq3Vkg3Xa2QrEQWbIvQj9FNqBYOr3XIczzU8gkK5Kh42P4C3DgNiBvlNNk2BlA5ITN/EvVAn/ImjoGq5IrcO+hAj2iSAozYTEpJAKe0NTrj49CIkj5JI6ibyJwIDAQAB
```

Now copy the TXT record to your domain DNS management.
After that, go back to Google Workspace and click on start authentication.

_Note: You might have to wait a few hours for the DNS to update._


### Domain-based Message Authentication, Reporting and Conformance (DMARC)

"_DMARC is an email authentication protocol. It is designed to give email domain owners the ability to protect their domain from unauthorized use, commonly known as email spoofing._"

An example of a DMARC (TXT record) looks like this:
```
v=DMARC1; p=quarantine; pct=100; rua=mailto:EMAIL@DOMAIN.com; ruf=mailto:EMAIL@DOMAIN.com; rf=afrf; fo=1
```

More info can be found here:

* [DMARC Overview](https://dmarc.org/overview/)


## Email Security and Routing

**OCTOBER 2021 UPDATE:** Cloudflare is announcing solutions for email safety and security, which are super easy to set up, and FREE!

"_The new Email Security DNS Wizard can be used to create DNS records that prevent others from sending malicious emails on behalf of your domain._"

Find more information here: [Tackling Email Spoofing and Phishing](https://blog.cloudflare.com/tackling-email-spoofing/) and [Easily creating and routing email addresses with Cloudflare Email Routing](https://blog.cloudflare.com/introducing-email-routing/)

**FEBRUARY 2022 UPDATE:** Cloudflare acquired Area 1 and is integrating it's technology and solutions to it's own stack. More info here: [Why we are acquiring Area 1](https://blog.cloudflare.com/why-we-are-acquiring-area-1/)

**2023 UPDATE:** check out [Cloudflare DMARC Management](https://developers.cloudflare.com/dmarc-management/), in order to stop brand impersonation.

## Disclaimer

This is a very general introduction to email security, SPF, DKIM and DMARC. Educational purposes only. There are many more aspects to email security which are not covered here, and all implementations might differ from situation to situation, platform to platform, technology to technology. Remember, you are responsible for your own actions – this is merely an educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful!
