---
title: A Journey into Digital Privacy & CyberSec
date: 2020-11-27
description: "Learn about digital privacy and cybersecurity."
tags: ["cybersecurity", "privacy"]
type: 'article'
---

This is a brief blog post about my friends' and my journey into digital privacy and cyber security, and how to achieve some of it by simply changing a few settings, or with the help of publicly available, free, and open source tools.

This is in no way a complete guide on how to become completely anonymous or secure on the web, but more like an introduction towards what you can do to gain a little bit of digital privacy back, as well as to protect yourself a little better from potential outside threats (like e.g. malware, or simply annoying ads).

* * *

## Browsers

Our journey begins with our browser – our gateway to the internet, and our most favorite program by far. We use it every day, but we never (or very rarely) even stop to think about what information our browser is giving to all those different websites we visit (yes, even in incognito mode).

### Check your Browser now!

There are many online tools out there to figure out what and how much information your browser is giving away, but these URLs might be a good start for you:

-   [Cloudflare ESNI Checker](https://www.cloudflare.com/ssl/encrypted-sni/)
-   [BrowserAudit](https://browseraudit.com/)
-   [BrowserLeaks](https://browserleaks.com/)
-   [Do I Leak](https://www.doileak.com/)
-   [Cover Your Tracks](https://coveryourtracks.eff.org/)
-   [Am I Unique](https://amiunique.org/)

### Browser Settings

Did you ever take the time to review your browser's settings? Like seriously taking your time and trying to understand what every option does?

One of the most basic and easiest things you can do on your browser's settings is to **set your browser to delete Cookies after every session** close. [Here](https://ccm.net/faq/32792-google-chrome-automatically-clear-cookies-after-each-browsing-session) is a brief article that explains how to do it on Chrome. The process should be fairly similar for other browsers nowadays too. If not, google it.

If you are using Firefox, here is a good [guide on privacy settings](https://restoreprivacy.com/firefox-privacy/) you might be interested in.

Additionally, another important thing to take into account is the tracking through Favicons – yes, the little icons on your browser tabs can be used to track you. In order to prevent this, periodically remove the favicon (F-cache) file of your browser. On Google Chrome, delete the following file:

    ~/Library/Application Support/Google/Chrome/Default/Favicons         # On MacOS
    ~/Library/Application Support/Google/Chrome/Default/Favicons-journal

    ~/Library/Application Support/Google/Chrome/Default/Favicons         # On Windows

On Safari, delete the content of the following file:

```
~/Library/Safari/Favicon Cache
```

### Extensions / Addons

One of our favorite Extensions is **[uBlock Origin](https://github.com/gorhill/uBlock)** (not to be confused with [uBlock](https://www.reddit.com/r/ublock/comments/32mos6/ublock_vs_ublock_origin/)). It is our go-to-Extension for content-filtering and ad-blocking (_"it is a wide-spectrum blocker"_).

We recommend checking out the following URLs for potential content-filters that you want to use:

-   [FilterLists](https://filterlists.com/)
-   [Block List Project](https://blocklist.site/)

But if you are more that "one-click-make-it-work" type of person, then the [Privacy Badger](https://privacybadger.org/) might be for you – though it is more focused on blocking some third-party trackers only. Additionally, check out the [CanvasDefender](https://multilogin.com/canvas-defender/), which attempts to change your browser _fingerprint_. Nonetheless, there are thousands of more tools out there which might better adapt to your needs – start googling!

However, be careful not to add too many Extensions, because they might stop each other from working properly, and your device processor will also thank you.



## Mac Settings

Go to your System Preferences, Security & Privacy, and please review all your settings.

The general rules are:

-   Your **Firewall** should definitely be on.
-   If you travel a lot, or somebody else uses your laptop too, turn on FileVault (or **device encryption**).
-   Disable **automatic login**.
-   Review your **Privacy (App) permissions** (e.g. what Apps have access to your Location Services?)
-   Uninstall or delete any **Apps you don't need** or you do not use at all.
-   And please (_please_) **[use a strong password](https://www.kaspersky.com/resource-center/threats/how-to-create-a-strong-password)**.

If you are using a Mac and you want to go even further, here a few tips we recommend you checking out:

-   Check if your **[System Integrity Protection (ISP)](https://support.apple.com/en-us/HT204899)** is enabled by typing in the following command into your Terminal `csrutil status`
-   If you are not using the **remote login or SSH** functionality of your Mac, we recommend turning it off by typing into your Terminal `sudo systemsetup -setremotelogin off`
-   Want to see what connections are currently open? Type into your Terminal `lsof -i` to list all **processes with some sort of network connections open**. Additionally, you should check out your _Network Utility_ App which comes pre-installed on your Mac.

You might also want to consider downloading one (or more) of those **free security tools** from [Objective See](https://objective-see.com/products.html).



## Home Router Settings

First step is to access your router. If you are reading this right now, I assume that you are at home connected to your WiFi. Then go to your browser and in a new tab type in your **[router's IP address](https://www.techspot.com/guides/287-default-router-ip-addresses/)**, which usually is one of the following two:

-   192.168.0.1
-   192.168.1.1

Make sure that the following points are checked (or at least most of them):

-   Change your **default WiFi name** (SSID).
-   Activate modern encryption protocols, such as **WPA2-PSK (AES)** or [WPA3](https://www.wi-fi.org/discover-wi-fi/security).
-   Change your **default WiFi password** to something more complex and with at least 10 characters. (I don't have to mention that you also shouldn't hand out your WiFi password to anyone you don't trust).
-   Change your router's **default admin password** (and remember it).
-   Turn on your router's **Stateful Packet Inspection (SPI) Firewall** (if available).
-   Turn on **DoS (Denial of Service) protection** (if available).
-   Disable **remote access**.
-   Disable **WEP encryption** protocol, or PIN access.
-   Keep your router's **firmware** up to date.

If you don't have all these options above in your router's settings, then you might want to consider changing your router to a newer model.

Additionally, don't forget that you can have the most secure and most powerful router ever, but if you have an older device with security flaws connected to it, well then you have an open door for potential intruders.



## Search Engines

What better search engine than Google? Google is your friend – you can find almost anything nowadays through that search engine. (However, please don't believe everything you find and see online. Be a critical thinker – even towards this little blog post.)

Even though Google is amazing and helps you find things online quickly and (most of the time) accurately, it still tracks a lot (really a lot) of the things you do online (and sometimes even _offline_). And if you do not want Google knowing that you curiously searched for _"Is watermelon a cucumber?"_ at 2am, then you might be better off with **[DuckDuckGo](https://duckduckgo.com/)**.

Some alternatives are:

-   [Swisscows](https://swisscows.com/)
-   [Startpage](https://www.startpage.com/)
-   [Searx](https://searx.space/)



## Advertising, Ads Everywhere

Do you want to opt-out of personalized advertising? The following URLs show you which  companies might gather or even already own some of your data and how to opt-out from personalized advertising:

-   [Network Advertising Initiative](https://optout.networkadvertising.org/) – USA
-   [Your Online Choices](https://www.youronlinechoices.com/)



## Password Manager

Soon



## Private Email Account

Here some free Email Providers which offer some degree of privacy and security:

-   [Tutanota](https://tutanota.com/)
-   [ProtonMail](https://protonmail.com/)
-   [Mailfence](https://mailfence.com/)

### Junk Email Account

Soon



## More on GitHub

For more tools, resources, Linux and MacOs terminal commands, and more, visit my GitHub repo [CyberSec-resources](https://github.com/DavidJKTofan/CyberSec-resources).

* * * *

## Disclaimer

Don't forget that any changes to your settings, and any tools/programs that you download on your device will have some sort of consequences. For example: when filtering content or blocking cookies, you cannot use several functionalities and/or features of some websites – like e.g. Facebook. Additionally, some changes in your settings might prevent you from using other tools or websites. Therefore, when changing anything you are not really sure about: _baby steps_.

As mentioned at the beginning, this is not a complete guide on how to protect yourself.

**You are responsible** of figuring out what the best balance is for your online experience, and how much digital privacy you want to achieve. Educational purposes only. Though I hope that this brief blog post has helped some of you become more conscious about your online behavior, maybe even motivated or inspired some of you to learn more about the world of IT in general. There are thousands of tools and ways out there to improve your digital privacy and security – go for it (if you are curious)!
