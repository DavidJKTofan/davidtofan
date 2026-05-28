---
title: Setting Up a New macOS
date: 2024-01-06
description: "Guide for Setting up macOS Development Environment: Essential Software, Tools, and Browsers with Enhanced Privacy and Security Settings."
tags: ["cybersecurity", "developers", "privacy", "resources"]
type: "article"
---

I predominantly use Apple products, and when transitioning to a new device within the Apple ecosystem — such as a fresh MacBook — I find myself in the familiar routine of reinstalling all the essential software and tools I rely on every day.

This article is my own go-to checklist when setting up a new laptop. It can also serve as inspiration for anyone looking to build a privacy-conscious developer environment, with the tools I consider essential.

## macOS Privacy & Security Settings

Start by updating macOS to the latest version, then walk through the following:

- [Change Privacy & Security Advanced settings on Mac](https://support.apple.com/en-gb/guide/mac-help/mh40595/mac).
- Turn on [FileVault](https://support.apple.com/en-gb/guide/mac-help/mh11785/mac) to encrypt your disk.
- Configure a [firmware password](https://support.apple.com/en-au/102384).
- Enable [Secure Keyboard Entry](https://support.apple.com/en-gb/guide/terminal/trml109/mac) in the Terminal.

> For a thorough deep-dive, review the [drduh/macOS-Security-and-Privacy-Guide](https://github.com/drduh/macOS-Security-and-Privacy-Guide) repository.

## Application Firewall & Monitoring

A host-based firewall lets you see and approve every outbound connection your applications make. Two solid options:

- [**LuLu**](https://github.com/objective-see/LuLu) — free and open-source, from Objective-See.
- [**Little Snitch**](https://www.obdev.at/products/littlesnitch/order.html) — paid, with more granular rules and a richer interface.

In addition, install [**BlockBlock**](https://objective-see.org/products/blockblock.html) to monitor for processes attempting to install themselves persistently — useful for catching malware that wants to survive a reboot.

## Xcode Command Line Tools

```bash
xcode-select --install
```

## Homebrew

Install [Homebrew](https://brew.sh/), then opt out of [analytics](https://docs.brew.sh/Analytics):

```bash
brew analytics off
```

### Command-Line Tools

**cURL** — install the Homebrew version (newer than the system one):

```bash
brew install curl
```

Make the brewed version take precedence over the system one by adding it to your `PATH` (see the Shell section below). Optionally, force Homebrew itself to use this version:

```bash
export HOMEBREW_FORCE_BREWED_CURL=1
```

> For HTTP/3 support, see [HTTP3 (and QUIC)](https://curl.se/docs/http3.html) — `quiche` is the recommended backend.

**git, Python, Node.js:**

```bash
brew install git python@3.13 node
```

> Python cleanup script: [clean_python_env.sh](https://raw.githubusercontent.com/DavidJKTofan/CyberSec-resources/refs/heads/master/Projects/macOS-Cleanup/clean_python_env.sh). When developing in Python, use [virtual environments](https://github.com/DavidJKTofan/CyberSec-resources/blob/master/MacOS_Commands.md#virtual-environment).

### Cloudflare Wrangler CLI

[Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) is the CLI for building on Cloudflare Workers. It must be installed via npm — the Homebrew formula named `wrangler` is an unrelated Erlang tool and has been disabled.

```bash
npm install -g wrangler
```

### Developer Apps

Install via Homebrew casks:

```bash
brew install --cask visual-studio-code
brew install --cask github       # GitHub Desktop
brew install gh                  # GitHub CLI
brew install --cask ghostty      # Modern, GPU-accelerated terminal
brew install --cask claude-code  # Anthropic's terminal coding agent
brew install --cask codex        # OpenAI's terminal coding agent
```

### Networking & Security Apps

```bash
brew install --cask wireshark-app
brew install --cask silentknight
```

Wireshark is the standard network protocol analyser. [SilentKnight](https://eclecticlight.co/lockrattler-systhist/) automatically checks the state of macOS firmware and security systems on each launch.

## Shell

Open `~/.zshrc` and set up the `PATH` so Homebrew binaries — including the brewed `curl` — take precedence over the system equivalents:

```bash
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/curl/bin:/usr/local/bin:/usr/sbin:/sbin:/usr/bin:/bin:$PATH"
```

Then reload:

```bash
source ~/.zshrc
```

## Keeping Everything Updated

A single command to refresh Homebrew, all packages, and npm:

```bash
brew update && brew upgrade && brew autoremove && brew cleanup && brew doctor && npm install -g npm@latest && npm update -g
```

## Browser: Brave

Install Brave via Homebrew:

```bash
brew install --cask brave-browser
```

[Brave Shields](https://brave.com/shields/) blocks ads and trackers by default. If you prefer Firefox or another privacy-respecting browser, install [uBlock Origin](https://github.com/gorhill/uBlock) (or [uBlock Origin Lite](https://github.com/uBlockOrigin/uBOL-home)) as an add-on.

> Switch your default search engine to [DuckDuckGo](https://duckduckgo.com/), [Startpage](https://www.startpage.com/), or [Ecosia](https://www.ecosia.org/).

## Encrypted DNS

Follow the guide on [connecting to 1.1.1.1 with DoH](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/dns-over-https-client/#cloudflared). Alternatively, [configure DoH directly in your browser](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/encrypted-dns-browsers/), or use a managed [secure public WiFi profile](https://www.cloudflare.com/zero-trust/solutions/secure-guest-wifi/).

## Email, Calendar, Drive, VPN, Password Manager

Sign up for the [Proton](https://proton.me/) suite for end-to-end-encrypted Mail, Calendar, Drive, VPN, and Pass. Use my [invitation link](https://pr.tn/ref/T9EEJ6CB5Q3G) if you'd like.

Alternatives worth considering:

- [Cloudflare Zero Trust](https://www.cloudflare.com/plans/zero-trust-services/) (free tier) — WARP VPN client, Gateway filtering, and [Email Routing](https://developers.cloudflare.com/email-routing/).
- [NextDNS](https://nextdns.io/) (free tier) — encrypted DNS with custom blocklists.

## Useful Tools & Bookmarks

A curated list of browser-based tools I keep bookmarked for security research, web debugging, and OSINT work.

### General Toolkit

- [CyberChef](https://gchq.github.io/CyberChef/) — the Swiss army knife for encoding, encryption, and data analysis.
- [CanaryTokens](https://canarytokens.org/nest/generate) — generate honeytokens that alert when triggered.
- [Wayback Machine](https://web.archive.org/) ([save URL](https://web.archive.org/save)) — view or archive any page in time.
- [Have I Been Pwned](https://haveibeenpwned.com/) — check if your email or passwords have leaked.
- [Privacy.com](https://www.privacy.com/) — generate virtual cards for online purchases.

### Website Tech Stack

- [BuiltWith](https://builtwith.com/)
- [Wappalyzer](https://www.wappalyzer.com/)
- [W3Techs](https://w3techs.com/sites)
- [SSL Certificate Chain Lookup](https://ssl-certificates.whoisxmlapi.com/lookup)

### URL & Site Scanning

- [urlscan.io](https://urlscan.io/)
- [Cloudflare Radar URL Scanner](https://radar.cloudflare.com/scan)
- [VirusTotal](https://www.virustotal.com/gui/home/upload)
- [URLhaus](https://urlhaus.abuse.ch/browse/)
- [Web Check](https://web-check.xyz/)
- [Security Headers](https://securityheaders.com/)
- [Redirect Detective](https://redirectdetective.com/)

### DNS

- [Google Dig](https://toolbox.googleapps.com/apps/dig/)
- [1.1.1.1 — Purge Cache](https://one.one.one.one/purge-cache/) · [Help](https://one.one.one.one/help/)
- [dns.google/cache](https://dns.google/cache)
- [DNSDumpster](https://dnsdumpster.com/)

### IP Intelligence

- [ipinfo.io](https://ipinfo.io/)
- [AbuseIPDB](https://www.abuseipdb.com/)
- [Shodan](https://www.shodan.io/)
- [Censys](https://search.censys.io/)
- [GreyNoise](https://check.labs.greynoise.io/)
- [IntelX](https://intelx.io/)

### Image Forensics

- [FotoForensics](https://fotoforensics.com/)
- [TinEye](https://tineye.com/) — reverse image search
- [Content Credentials](https://contentcredentials.org/verify)
- [Jimpl](https://jimpl.com/) — EXIF metadata viewer

### AI Content Detection

- [GPTZero](https://gptzero.me/) — AI-generated text
- [AI or Not](https://www.aiornot.com/dashboard/home) — AI-generated images

### Malware Analysis

- [Joe Sandbox](https://www.joesandbox.com/#windows)
- [Hybrid Analysis](https://hybrid-analysis.com/)
- [ANY.RUN](https://app.any.run/)

### Threat Intelligence

- [CVE.org](https://www.cve.org/)
- [Exploit-DB](https://www.exploit-db.com/)
- [AlienVault OTX](https://otx.alienvault.com/)
- [MISP Global Search](https://search.misp-community.org/?q=&index=all&page=1)

### Data Breaches

- [BreachDirectory](https://breachdirectory.org/)
- [OCCRP Aleph](https://aleph.occrp.org/) — public records and leaks

### Web Performance

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [DebugBear Website Speed Test](https://www.debugbear.com/test/website-speed)

## More

Enable [Hot Corners](https://support.apple.com/en-gb/guide/notes/apdf028f7034/mac) to instantly lock the screen — handy when stepping away briefly.

Further reading:

- [A Journey into Digital Privacy & CyberSec](/articles/a-journey-into-digital-privacy/) — companion article.
- [DavidJKTofan/CyberSec-resources](https://github.com/DavidJKTofan/CyberSec-resources/blob/master/MacOS_Commands.md) — more commands and examples.
- [ataumo/macos_hardening](https://github.com/ataumo/macos_hardening) — manual policy checks, see the [policy list](https://github.com/ataumo/macos_hardening/blob/main/POLICIES.md).

---

## Disclaimer

Educational purposes only.

This blog post is independent and not affiliated with, endorsed by, or necessarily reflective of the opinions of any entities mentioned.
