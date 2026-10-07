---
title: "Beta 11: Admin panel and expanded tracking"
description: >-
  NoHorny now covers tiled displays, sorters and illuminators, and gets a
  website with request pages and an admin panel. Likely the last beta before v4.
publishedAt: 2026-10-07
author: phinner
topic: NoHorny
releases:
  - xpdustry/nohorny@v4.0.0-beta.9
  - xpdustry/nohorny@v4.0.0-beta.10
  - xpdustry/nohorny@v4.0.0-beta.11
---

Oh boy, what an excellent day to post about major improvements in NoHorny.

It has been a while since the last post in July? And I implemented a bunch of features you will really like:

- Added support for **tiled displays**, **sorters** and **illuminators**.
  Now, all blocks that can be used to display images are covered by NoHorny.

- Added the ability to route discord alerts through free proxies.
  For my fellas whose servers are hosted in countries that ban discord.

- Added **classification chains** to the NoHorny server,
  allowing you to gate your premium classifier with a dumber one, acting as a filter.

- And a bunch of bugfixes as always.

But **MOST IMPORTANTLY**, I finally added a decent frontend for NoHorny:

- [With an official website](https://nohorny.xpdustry.com).

- Details page for individual requests, linked in the logs and in the discord reports. Can be used as proofs for your ban system and also for sharing. 

- And the long awaited admin panel. Besides the request list, filter and search, you have access to very useful stats.

<!-- ::post-image src="/blog/nohorny-site-hero-dark.png" alt="The NoHorny homepage hero, with the tagline on the left and a live counter of 78,380 classified images on the right" width="2880" height="1800" caption="The new NoHorny homepage, with live statistics." -->

<!-- ::post-image src="/blog/nohorny-request-dark.png" alt="A public request page showing a blurred image flagged as NSFW, the verdict, the classifier chain with vit and sight-engine scores, and request details" width="2880" height="1800" caption="A classification request page, linked from Discord alerts." -->

<!-- ::post-image src="/blog/nohorny-admin-overview-dark.png" alt="The admin panel activity view, with safe, warn, NSFW and failed counts, a daily bar chart over 30 days, and breakdowns by network and client version" width="2880" height="1800" caption="The admin panel overview." -->

<!-- ::post-image src="/blog/nohorny-admin-requests-dark.png" alt="The admin panel request list with filters by verdict and date, and rows showing the image, verdict, request id, client version, server and timing" width="2880" height="1800" caption="Browsing and filtering requests in the admin panel." -->

This is it folks, if all goes well, this is the last beta build before the final release of NoHorny 4.

Thank you for reading. Any questions, or feature request, let me know on discord (`@phinner`) or by mail (`contact@phinner.dev`).
