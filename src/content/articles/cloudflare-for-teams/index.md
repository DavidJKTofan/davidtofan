---
title: Cloudflare Zero Trust
date: 2021-05-26
description: "Cloudflare Zero Trust, formerly Cloudflare For Teams, helps secure hybrid work, defend against threats, protect data, and simplify any-to-any connectivity on your path to consolidation."
tags: ["cybersecurity", "zero trust", "cloudflare"]
type: 'article'
---

Welcome to a brief introduction to Cloudflare for Teams.

UPDATE 2022: now renamed to "**Cloudflare Zero Trust**".

* * *

## Cloudflare One

[Cloudflare One](https://www.cloudflare.com/cloudflare-one/) is a product suite which can generally be split into two distinctive solution sets:

1. Zero Trust Security Solution Set
2. Connectivity and Network Security

Part of the Zero Trust solution is **Cloudflare for Teams** (renamed to **Cloudflare Zero Trust** in 2022), which I'd like to introduce today.

### Cloudflare Zero Trust

[Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/) is divided into three solutions:

-   **Gateway**: operates between a company's employees and the Internet.
-   **Access**: secures access to applications.
-   **Browser Isolation**: executes active webpage content in a secure isolated browser away from local or on-premise networks and endpoints, insulating devices from attacks.

The official Developer Docs can be found here: [Cloudflare Zero Trust documentation](https://developers.cloudflare.com/cloudflare-one/)

Take a [self-guided tour](https://www.cloudflare.com/products/zero-trust/interactive-demo/) of Cloudflare’s Zero Trust platform.

* * *

## Digital Ocean

### Setting up the Server

For this example I used a Digital Ocean Droplet running _Ubuntu 20.04 (LTS) x64_.

I followed this guide and its prerequisites in order to set up my Droplet and a web environment: [How To Host a Website Using Cloudflare and NGINX on Ubuntu 20.04](https://www.digitalocean.com/community/tutorials/how-to-host-a-website-using-cloudflare-and-nginx-on-ubuntu-20-04)

You can use `netstat` in order to listen to your open ports and check if your server is available/reachable:

    sudo apt-get install net-tools      # Install
    sudo netstat -tulpn | grep LISTEN

_Note: use the netstat command again after setting up the ufw._

### DNS Records

In order to access my Droplet's NGINX content, I set a type A DNS record on my Cloudflare DNS management dashboard with the name (i.e.) `do-droplet` as a subdomain leading to the Droplet's IPv4 address.

* * *

## Cloudflare Access

Let's get started with Cloudflare Zero Trust and how to set up Access.

### cloudflared

Cloudflare Daemon – or `cloudflared` – is the software that powers Cloudflare Tunnel. `cloudflared` runs alongside origin servers to connect to Cloudflare's network, as well as client devices for non-HTTP traffic from user endpoints.

**MARCH 2022 UPDATE:** You can now easily do a remote setup of the Cloudflare Tunnel [via the Dashboard](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

#### Install cloudflared

I downloaded and unpacked the `cloudflared` daemon on the Droplet server:

    sudo wget https://bin.equinox.io/c/VdrWdbjqyF/cloudflared-stable-linux-amd64.deb
    sudo dpkg -i cloudflared-stable-linux-amd64.deb

Checked my version (just in case):

    cloudflared --version

To update the `cloudflared` daemon simply run:

    cloudflared update

I logged in and connected it to my Cloudflare account with:

    cloudflared login

_Note: Credentials will normally be saved to `/home/$USER/.cloudflared/cert.pem`._

Once `cloudflared` has been installed and authenticated, the process to get my first Cloudflare Tunnel up and running included 3 high-level steps:

1.  Create a Tunnel (_TCP over WebSocket encryption_) and configure it
2.  Route traffic to the Tunnel
3.  Run the Tunnel

Let's get going...

#### Create a Tunnel and configure it

I created a Tunnel named _TUNNEL_NAME_ with:

    cloudflared tunnel create TUNNEL_NAME

The output of that command displayed my Tunnel ID (you'll need this later):

    "Created tunnel TUNNEL_NAME with id 6ff42ae2-765d-4adf-8112-31c55c1551ef"

Then I edited the `cloudflared` config file:

    sudo nano ~/.cloudflared/config.yml

Adding the following code to the config file in order to allow HTTP and SSH connections to my Droplet server (change `6ff42ae2-765d-4adf-8112-31c55c1551ef` with your own Tunnel ID, as well as `TUNNEL_NAME.davidtofan.com` with your own hostname):

    tunnel: 6ff42ae2-765d-4adf-8112-31c55c1551ef
    credentials-file: /home/$USER/.cloudflared/6ff42ae2-765d-4adf-8112-31c55c1551ef.json
    # Root-level configuration
    http2: true
    originRequest:
      connectTimeout: 30s
    logDirectory: /var/log/cloudflared

    ingress:
    - hostname: TUNNEL_NAME.davidtofan.com
      service: http://localhost:80
    - hostname: TUNNEL_NAME-ssh.davidtofan.com
      service: ssh://localhost:22
    # Catch-all rule, which just responds with 404 if traffic doesn't match any of
    # the earlier rules
    - service: http_status:404

Always before running the Tunnel, I validated the config input with:

    cloudflared tunnel ingress validate

#### Route traffic to the Tunnel

In order to create DNS records from `cloudflared`, which will provision a CNAME record that points to the subdomain of a specific Tunnel, one can use either one of these commands:

    cloudflared tunnel route dns TUNNEL_NAME TUNNEL_NAME.davidtofan.com
    # OR
    cloudflared tunnel route dns 6ff42ae2-765d-4adf-8112-31c55c1551ef TUNNEL_NAME.davidtofan.com

#### Run the Tunnel

I again checked if the config file is OK, and then I ran my Tunnel to check if it works:

    cloudflared tunnel ingress validate
    cloudflared tunnel run TUNNEL_NAME

Finally, I installed the Cloudflare Tunnel as a system service so that it works even after the server reboots:

    sudo cloudflared service install

#### Connect from a Client Machine

Now in order to connect from a client machine (i.e. my MacBook), first I needed to install `cloudflared` on it too.
Taking macOS as an example, I installed `cloudflared` with Homebrew:

    brew install cloudflare/cloudflare/cloudflared

Then I changed the SSH configuration file on my client machine:

    sudo nano ~/.ssh/config

Inserting the following values, replacing `TUNNEL_NAME.davidtofan.com` with the hostname I created:

    Host TUNNEL_NAME.davidtofan.com
      ProxyCommand /usr/local/bin/cloudflared access ssh --hostname %h

Done!

* * *

### SSH

If we are using the Tunnel to access SSH on the Droplet server, then I only needed to activate `Enable browser rendering` on Access > Applications > Settings > `cloudflared settings` card, which allows us to use SSH terminal directly on our browser.

_Once enabled, when users authenticate and visit the URL of the application, Cloudflare will render a terminal in their browser._

#### Short-lived Certificates

If you are using Public key authentication for SSH on your Droplet, then the following method would make sense to make it easier for users to login: any authenticated user can access my Droplet through SSH without the necessary Public/Private Keys installed on their device by [configuring short-lived certificates](https://developers.cloudflare.com/cloudflare-one/identity/users/short-lived-certificates).

First I had to generate a short-lived certificate Public Key on the Cloudflare Zero Trust dashboard (Configuration > Service Auth).

Then I copy-pasted the Public Key on a new file called `ca.pub` on my Droplet:

    cd /etc/ssh
    sudo nano ca.pub

And the last major step on my Droplet was to properly configure my `sshd_config` file:

    sudo nano /etc/ssh/sshd_config

    PubkeyAuthentication yes            # remove the # in front of this line
    TrustedUserCAKeys /etc/ssh/ca.pub   # Add new line

Finally, I restarted SSH and rebooted the server:

    sudo service ssh restart
    sudo systemctl restart ssh
    sudo reboot

And the last step, on the client machine I ran the following command, changing the `~/.ssh/config` file content to what this command displayed:

    cloudflared access ssh-config --hostname TUNNEL_NAME.davidtofan.com --short-lived-cert

_Note: We need to ensure that Unix usernames on our server [match user SSO identities](https://developers.cloudflare.com/cloudflare-one/identity/users/short-lived-certificates#3-ensure-unix-usernames-match-user-sso-identities)._

Done! [Find demos and examples here](https://www.cf-testing.com/).

* * *

## Cloudflare Gateway

This is Cloudflare's Secure Web Gateway (SWG) solution, which allows you to set up DNS, Network, and HTTP policies, keeping your data safe from malware, ransomware, phishing, command & control, Shadow IT, and other Internet risks.

DNS policies work by simply replacing your router's or devices' DNS servers with Cloudflare's, and Network and HTTP policies work by installing [Cloudflare's Root Certificate](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/install-cloudflare-cert) and a small client called [WARP](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/deployment).

Part of the WARP client is the add-on Browser Isolation, which _"complements the Secure Web Gateway and Zero Trust Network Access solutions by executing active webpage content in a secure isolated browser"_.

Nonetheless, Cloudflare recently introduced [Clientless Web Isolation](https://blog.cloudflare.com/introducing-clientless-web-isolation-beta/), meaning that you can use Browser Isolation without WARP installed on your device.

More info on [Clientless Web Isolation](https://developers.cloudflare.com/cloudflare-one/policies/browser-isolation/clientless-browser-isolation/) on the DevDocs.

* * *

## UFW

Finally, to properly protect my Droplet, I set up the Uncomplicated Firewall (UFW) by denying incoming connections by default and only allow certain connections:

    sudo ufw disable

    sudo ufw default deny
    sudo ufw allow 'NGINX Full'
    #sudo ufw allow 'OpenSSH' # Not necessary as we set up a the Cloudflare Tunnel

    sudo ufw enable
    sudo ufw status

Additionally, I only want to allow traffic from Cloudflare IPs to my Droplet:

    curl -s https://www.cloudflare.com/ips-v4 -o /tmp/cf_ips
    curl -s https://www.cloudflare.com/ips-v6 >> /tmp/cf_ips

    # Allow all traffic from Cloudflare IPs (no ports restriction)
    for cfip in `cat /tmp/cf_ips`; do ufw allow proto tcp from $cfip comment 'Cloudflare IP'; done

    ufw reload > /dev/null

_Note: [cloudflare-ufw](https://github.com/Paul-Reed/cloudflare-ufw/blob/master/cloudflare-ufw.sh) makes this last step easier, which however would not be needed thanks to [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull) – explained in the guide "How To Host a Website Using Cloudflare and NGINX on Ubuntu 20.04" in step 3 at the beginning of this blog post. Additionally, technically, we could simply block all incoming connections to the Droplet as the Cloudflare Tunnel would be the only allowed entry point, making everything a little more secure._

* * *

## Disclaimer

This is a very general introduction to Cloudflare and [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/). Educational purposes only, and this blog post does not necessarily reflect the opinions of Cloudflare. There are many more aspects to Cloudflare and its products and services – this is merely a brief educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful! Images are online and publicly accessible.

* * * *

## More on Cloudflare

- [Introducing Cloudflare](https://davidtofan.com/articles/cloudflare-security/)
- [Migrating to Cloudflare](https://davidtofan.com/articles/migrating-to-cloudflare/)
- [Intro to Cloudflare Workers](https://davidtofan.com/articles/cloudflare-workers/)
