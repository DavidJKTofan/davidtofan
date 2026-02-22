---
title: Cloudflare IPFS Gateway
date: 2021-12-10
description: "Exploring the Distributed Web Gateway with Cloudflare."
tags: ["cybersecurity", "blockchain", "cloudflare"]
type: 'article'
---

With [Cloudflare Distributed Web Gateway](https://www.cloudflare.com/distributed-web-gateway/) one can easily, quickly, and securely access both the Ethereum network and the InterPlanetary File System (IPFS).

IPFS allows us to serve content from a custom domain over HTTPs, and browser files stored on IPFS, while Cloudflare's gateway allows one to browse any file stored on the public IPFS network by going to `cloudflare-ipfs.com/...`.

More information on the [Dev Docs](https://developers.cloudflare.com/distributed-web/ipfs-gateway) – the demo might take some time to load, depending on how many other nodes or users have accessed the content recently.

* * *
* * *

## index.html Example

See it in action on [Cloudflare Playground](https://dweb.cf-testing.com/ipfs-gateway.html).

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <link rel="icon" type="image/x-icon" href="https://davidjktofan.com/favicon.ico">
    <title>Hello to IPFS!</title>
    <link rel="stylesheet" href="https://unpkg.com/modern-css-reset/dist/reset.min.css" />
    <style>
    body {
        background: #eee;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: sans-serif;
    }
    div.container {
        background: #fff;
        border-radius: 1rem;
        padding: 4rem;
    }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello! <br>This website is hosted on IPFS and accessed via Cloudflare's gateway.</h1><br>
        <p>More information on <a rel="noreferrer external" href="https://developers.cloudflare.com/distributed-web/ipfs-gateway" target="_blank">IPFS Gateway</a> or on <a rel="noreferrer external" href="https://performance.cf-testing.com/ipfs-gateway.html" target="_blank">CF Playground</a></p>
    </div>
</body>
</html>
```

## Setup

### Installing IPFS

Choose which [IPFS Release](https://github.com/ipfs/go-ipfs/releases) you want to download and install:

```
wget -q https://github.com/ipfs/go-ipfs/releases/download/v0.4.21/go-ipfs_v0.4.21_linux-amd64.tar.gz

tar xf go-ipfs_v0.4.21_linux-amd64.tar.gz

sudo mv go-ipfs/ipfs /usr/local/bin

rm -rf go-ipfs go-ipfs_v0.4.21_linux-amd64.tar.gz
```

Run this to set up IPFS:
```
ipfs init
```

### Adding the Service

Create a file with `sudo nano /etc/systemd/system/ipfs.service` with the following content, in order to allow this new service/daemon to run in the background and on boot:
```
[Unit]
Description=IPFS Daemon

[Service]
ExecStart=/usr/local/bin/ipfs daemon
User=root
Restart=always
LimitNOFILE=10240

[Install]
WantedBy=multi-user.target
```

_Note: Change `User=root` if you're not running the daemon as root._

Run the new daemon and enable/start it:
```
sudo systemctl daemon-reload
sudo systemctl enable ipfs
sudo systemctl start ipfs
```

In order to check on its status:
```
systemctl status ipfs
```

### Opening Up to the Internet

The node should be running on an Internet-facing server/VPS, and direct connections on port 4001 should be allowed.

## Connecting Your Website

### Connecting to Cloudflare's Gateway

Connect your IPFS node to the network:
```
ipfs daemon
```

Add your content to IPFS:
```
ipfs add -r /path/to/folder-with-your-content/index.html
```

_Note: This will add your content to IPFS and give you back the hash of the directory._

To ensure that the content stays pinned, we need to pin it to our node, essentially caching it on our node:
```
ipfs pin add -r /ipfs/<hash_of_folder>
```

### Connecting to Cloudflare's Gateway

The hash generated before is essentially the path to the content on the IPFS. However, we want to make it easier to reach that content.

The following guide comes from [Connecting Your Website – Dev Docs](https://developers.cloudflare.com/distributed-web/ipfs-gateway/connecting-website):

First, go to the DNS settings for your domain. When you're there, add the following two records:

1. CNAME for your.website pointing to cloudflare-ipfs.com
TXT record for _dnslink.your.website with the value dnslink=/ipfs/<your_hash_here>
2. Now any request to your.website will resolve to cloudflare-ipfs.com/ipfs/<your_hash_here>.

When you want to update your content, just repeat the steps we've outlined above.

1. Collect all of your updated content into a folder.
2. Upload the content to a pinning service or upload it to your own node. If you're uploading it to your own node, remember to do both ipfs add -r /path/to/folder-with-your-content and ipfs pin add -r /ipfs/<hash_of_folder>.
3. Edit your TXT record for _dnslink.your.website to dnslink=/ipfs/<your_NEW_hash_here>.

## Demo

[Cloudflare Playground – IPFS Demo](https://dweb.cf-testing.com/ipfs-gateway.html)

* * *

## Disclaimer

Educational purposes only, and this blog post does not necessarily reflect the opinions of Cloudflare. There are many more aspects to Cloudflare and its products and services – this is merely a brief educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful! Images are online and publicly accessible.
