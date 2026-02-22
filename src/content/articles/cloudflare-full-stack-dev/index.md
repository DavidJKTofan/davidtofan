---
title: Cloudflare Full Stack
date: 2021-11-20
description: "Build and deliver serverless applications with the Cloudflare Developer Platform."
tags: ["cybersecurity", "developers", "cloudflare"]
type: 'article'
draft: true
---

_"Cloudflare Pages Goes Full Stack"_ – this is the title of the [latest blog post](https://blog.cloudflare.com/cloudflare-pages-goes-full-stack/)

Cloudflare is becoming the modern full-stack cloud provider that we all wanted it to be.

If you are already using Serverless solutions such as _AWS Lambda_ or _Google Cloud Functions_, you have to try Cloudflare's solutions!

* * *
* * *

## Cloudflare Pages Goes Full Stack

With Cloudflare Pages going Full Stack, we can now define our bindings, such as:

- **KV namespace**: serverless and globally accessible key-value storage solution.
- **Durable Object namespace**: strongly consistent coordination primitive that makes connecting WebSockets, handling state and building entire applications a breeze.
- **R2 Object Storage**: S3-compatible Object Storage solution that's slashing egress fees to zero.
- **Environment Variable**: An injected value that can be accessed by your functions and is stored as plain-text. You can set your environment variables directly within the Pages interface for both your production and preview environments at build-time and run-time.
- **Secret (coming soon!)**: An encrypted environment variable, which cannot be viewed by [wrangler](https://developers.cloudflare.com/workers/cli-wrangler) or any dashboard interfaces. Secrets are a great home for sensitive data including passwords and API tokens.

Explore all [storage options available](https://developers.cloudflare.com/workers/learning/storage-options/).

### KV namespace

### Durable Objects

Durable Objects lets developer implement previously complexa pplications, like collaborative whiteboarding, game servers, or global queues, in just a few lines of code.

This solves a major problem for developers maning data, and makes it easier than ever to build any type of application, no matter the complexity, compliance requirements, or performance needs.

#### R2 Object Storage

Learn more about R2 in the [Developer Documenation](https://developers.cloudflare.com/r2/).

### Environment Variable

### Secret

Coming soon...


## The Example

["Building a full stack application with Cloudflare Pages"](https://blog.cloudflare.com/building-full-stack-with-pages)

_Today, we're walking through our example image-sharing platform. We want to be able to share pictures with friends while still also keeping some images private. We'll build a JSON API with Functions (storing data on KV and Durable Objects), integrate with Cloudflare Images and Cloudflare Access, and use React for our front end._

* * *

## Disclaimer

Educational purposes only, and this blog post does not necessarily reflect the opinions of Cloudflare. There are many more aspects to Cloudflare and its products and services – this is merely a brief educational intro. Properly inform yourself, keep learning, keep testing, and feel free to share your learnings and experiences as I do. Hope it was helpful! Images are online and publicly accessible.
