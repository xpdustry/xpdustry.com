---
title: "Say hello to NoHorny v4 beta 1"
description: >-
  No more manual setup with an external NSFW detection service. A hosted server
  is provided by default, and tracking is near instant.
publishedAt: 2026-04-13
author: phinner
pfp: /phinner.svg
topic: NoHorny
releases:
  - xpdustry/nohorny@v4.0.0-beta.1
---

Excellent news, everyone: **NoHorny v4 beta** is now available. Just in time for Mindustry v8.

This beta includes some major improvements:

- **Works out of the box.** No more manual setup with an external NSFW detection service. A public
  NoHorny server instance is provided by default. The server is self-hostable too.
- **The tracking algorithm has been greatly improved.** Displays and canvases are now processed
  **almost instantly**, instead of every 5 seconds.
- **Rewritten in Java ☕**, for better compatibility and efficiency.

The moment the display is placed, I am banned:

<!-- ::start:post-video src="/blog/nohorny-showcase.mp4" poster="/blog/nohorny-showcase-poster.jpg" width="1550" height="911" caption="The display goes down, I get banned, and the webhook image lands in Discord." -->

A screen recording: a player places an NSFW logic display, NoHorny deletes it and bans them, and a
Discord webhook alert arrives naming the player and the coordinates.
[Download the video](/blog/nohorny-showcase.mp4) if your browser cannot play it.

<!-- ::end:post-video -->

There are still a few things I want to polish before the full v4 release, especially logging and
caching, but it is in a good enough state to use now. Feedback on the current beta would be very
helpful.
