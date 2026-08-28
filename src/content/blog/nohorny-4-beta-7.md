---
title: "Beta 7: Automatic bans are reliable now"
description: >-
  Two accuracy changes, and together they make automatically banning on an NSFW
  rating actually reliable.
publishedAt: 2026-05-22
author: phinner
pfp: /phinner.svg
topic: NoHorny
releases:
  - xpdustry/nohorny@v4.0.0-beta.7
---

The week is ending, so it is time for a new NoHorny release. Say hello to **beta 7**.

### Accuracy improvements

- **The trackers wait for the build to finish.** They estimate the time it takes to build a canvas
  or a logic schematic and wait for its completion. This little trick greatly decreases the number
  of false positives and requests, especially for canvases. Thanks to
  [Lett](https://github.com/BnDLett) from the
  [MDN network](https://github.com/mindustry-ddns-net) for helping with this.
- **The public model is tuned.** I finished tuning the model used by the public NoHorny server.
  Ambiguous images will no longer be marked `NSFW` but `WARN` instead.

> [!NOTE] The short version
> All these changes now make automatically banning on an `NSFW` rating actually reliable.

### Everything else

- The NoHorny server is now published to the GitHub package registry, so you no longer need to
  build it locally.
- NoHorny can now be configured programmatically.
- You can set a username for the Discord webhook.
- A lot of general improvements and bug fixes. Check the changelog for the details.
