---
title: Setting Up a New macOS
date: 2024-01-06
description: "Guide for Setting up macOS Development Environment: Essential Software, Tools, and Browsers with Enhanced Privacy and Security Settings."
tags: ["cybersecurity", "developers", "privacy", "resources"]
type: "article"
---

I predominantly use Apple products, and when transitioning to a new device within the Apple ecosystem, such as a fresh new MacBook, I find myself in the routine task of reinstalling all the essential software and tools crucial for my projects and day to day.

This article serves as a general to-do list for my own reference during the setup of a new laptop. Moreover, it can be a valuable source of inspiration for fellow individuals aiming to establish a privacy-conscious developer environment, encompassing the essential and often indispensable tools.

## macOS Privacy & Security Settings

Update all devices to the latest version.

[Change Privacy & Security Advanced settings on Mac](https://support.apple.com/en-gb/guide/mac-help/mh40595/mac).

Turn on [FileVault](https://support.apple.com/en-gb/guide/mac-help/mh11785/mac) to encrypt your data.

Configure [firmware password](https://support.apple.com/en-au/102384).

A nice feature is also [Secure Keyboard Entry](https://support.apple.com/en-gb/guide/terminal/trml109/mac) for the Terminal.

> Review the GitHub repository [drduh/macOS-Security-and-Privacy-Guide](https://github.com/drduh/macOS-Security-and-Privacy-Guide).

## Install Objective-See's Tools

Follow the instructions to install [LuLu](https://github.com/objective-see/LuLu) firewall and [BlockBlock](https://objective-see.org/products/blockblock.html) monitor.

## Install Warp.dev

Install [Warp](https://www.warp.dev/) terminal. Disable telemetry.

## Xcode & Command Line Tools

```
xcode-select --install
```

## Homebrew (brew)

First start by installing Homebrew. Go to [brew.sh](https://brew.sh/).

Opt out of [analytics](https://docs.brew.sh/Analytics):

```
brew analytics off
```

### Install cURL

```
brew install curl
```

Use cURL from Homebrew instead of system:

```
echo 'export PATH="/opt/homebrew/opt/curl/bin:$PATH"' >> ~/.zshrc
```

> For HTTP/3 support, review experimental [HTTP3 (and QUIC)](https://curl.se/docs/http3.html), preferably `quiche`.

Force Homebrew to use the brewed version of cURL instead of the system version:

```
export HOMEBREW_FORCE_BREWED_CURL=1
```

Reload `zsh`:

```
source ~/.zshrc
```

### Install Visual Studio Code (VS Code)

```
brew install --cask visual-studio-code
```

> Alternatively, install it manually from the [website](https://code.visualstudio.com/docs/setup/mac).

### Install Wireshark

```
brew install --cask wireshark
```

```
brew install --cask wireshark-chmodbpf
```

### Install git

```
brew install git
```

### Install Python

```
brew install python@3.13
```

> In case of a complete Python cleanup, use something like this [script](https://raw.githubusercontent.com/DavidJKTofan/CyberSec-resources/refs/heads/master/Projects/macOS-Cleanup/clean_python_env.sh).

> When developing with Python, use [virtual environments](https://github.com/DavidJKTofan/CyberSec-resources/blob/master/MacOS_Commands.md#virtual-environment).

### Install npm

```
brew install node
```

Update npm:

```
npm install -g npm@latest
```

Update Node.js:

```
sudo n stable
```

### Install SilentKnight

Fully automatic checks of firmware and security systems:

```
https://formulae.brew.sh/cask/silentknight
```

Reference: [SilentKnight, Skint, silnite, LockRattler, SystHist & Scrub](https://eclecticlight.co/lockrattler-systhist/)

### How `zsh` should look like

```
$ nano ~/.zshrc

export PATH="/opt/homebrew/bin:/opt/homebrew/opt/curl/bin:/usr/local/bin:/usr/sbin:/sbin:/usr/bin:/bin:$PATH"

#export PATH="/usr/sbin:/sbin:/usr/bin:/bin:/opt/homebrew/bin:/usr/local/bin:/Us$
#export PATH="/opt/homebrew/opt/curl/bin:$PATH"
```

### Update Everything

Updating `brew`, `npm`, `nvm` and their packages:

```
brew update && brew upgrade && brew autoremove && brew cleanup && brew doctor && npm install -g npm@latest && npm update -g && nvm install --lts --latest-npm && nvm alias default $(nvm version --lts) && npm cache clean
```

## Private Browser

Install and use [Brave](https://brave.com/) or [Firefox](https://www.mozilla.org/en-US/firefox/new/) – or other privacy-friendly browsers, whichever you feel safer with.

Review browser configurations.

Additionally, install and configure [uBlock Origin](https://github.com/gorhill/uBlock) or [uBlock Origin Lite](https://github.com/uBlockOrigin/uBOL-home) Add-Ons on Firefox, or [Brave Shields](https://brave.com/shields/) on Brave.

> Use the [Startpage](https://www.startpage.com/) or [DuckDuckGo](https://duckduckgo.com/) or [Ecosia](https://www.ecosia.org/) Search Engines.

Additionally, I'd bookmark the following sites...

- https://report.automatic-demo.com/
- https://web.archive.org/
- https://redirectdetective.com/
- https://haveibeenpwned.com/
- https://canarytokens.org/nest/generate
- https://gchq.github.io/CyberChef/

DNS:

- https://toolbox.googleapps.com/apps/dig/
- https://one.one.one.one/purge-cache/
- https://one.one.one.one/help/
- https://dns.google/cache
- https://help.teams.cloudflare.com/

URL Scan:

- https://urlscan.io/
- https://radar.cloudflare.com/scan
- https://www.ipqualityscore.com/threat-feeds/malicious-url-scanner
- https://securityheaders.com/
- https://www.virustotal.com/gui/home/upload
- https://host.io/
- https://urlhaus.abuse.ch/browse/

IP Scan:

- https://ipinfo.io/
- https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test
- https://www.abuseipdb.com/
- https://search.censys.io/
- https://www.shodan.io/
- https://intelx.io/

Images:

- https://www.labnol.org/reverse
- https://sightengine.com/detect-ai-generated-images
- https://fotoforensics.com/
- https://contentcredentials.org/verify
- https://wasitai.com/
- https://jimpl.com/
- https://aiimagedetector.org/

AI Text Detector:

- https://gptzero.me/
- https://www.zerogpt.com/

Malware Analysis:

- https://www.joesandbox.com/#windows
- https://hybrid-analysis.com/
- https://app.any.run/

Web Performance:

- https://pagespeed.web.dev/
- https://www.webpagetest.org/
- https://www.debugbear.com/test/website-speed
- https://gtmetrix.com/
- https://tools.pingdom.com/
- https://treo.sh/sitespeed
- https://speedvitals.com/

## Encrypted DNS

Follow the guide on [connect to 1.1.1.1 using DoH clients](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/dns-over-https-client/#cloudflared).

Alternatively, [configure DoH on your browser](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/encrypted-dns-browsers/). Or this landing page offers more advanced options: [secure guest and public WiFi](https://www.cloudflare.com/zero-trust/solutions/secure-guest-wifi/).

## E-Mail, Calendar, Drive, VPN, Password Manager

Sign up, configure and use the entire [Proton](https://proton.me/) suite of products. Check out my [invitation to join Proton](https://pr.tn/ref/T9EEJ6CB5Q3G).

Some additional options are:

- Configure and use the FREE [Cloudflare Zero Trust](https://www.cloudflare.com/plans/zero-trust-services/) plan, using the WARP VPN client and Gateway filtering to protect oneself from threats on the Internet. Including building your own email system with [Email Routing](https://developers.cloudflare.com/email-routing/).
- Configure and use the FREE [NextDNS](https://nextdns.io/) plan, which also has an encrypted DNS option.

## More...

I also enabled [Hot Corners](https://support.apple.com/en-gb/guide/notes/apdf028f7034/mac) Shortcuts to immediately lockdown my laptop. Very practical when I need to just look away for a minute.

Read more on [A Journey into Digital Privacy & CyberSec](/articles/a-journey-into-digital-privacy/).

More information and examples on my [GitHub Repository](https://github.com/DavidJKTofan/CyberSec-resources/blob/master/MacOS_Commands.md).

Another very cool resource is [macos_hardening](https://github.com/ataumo/macos_hardening), where you can manually check the [policies](https://github.com/ataumo/macos_hardening/blob/main/POLICIES.md).

---

## Disclaimer

Educational purposes only.

This blog post is independent and not affiliated with, endorsed by, or necessarily reflective of the opinions of any entities mentioned.
