---
title: "Beta 8: Breaking changes and blurred alerts"
description: >-
  Tracked buildings are rendered locally now, which makes beta 7 clients
  incompatible with the public server. Discord alerts now arrive blurred.
publishedAt: 2026-07-20
author: phinner
topic: NoHorny
releases:
  - xpdustry/nohorny@v4.0.0-beta.8
---

This Monday morning, I give you NoHorny **beta 8**.

> [!WARNING] Breaking change
> Like I told you last week, this release makes the public NoHorny server instance no longer
> compatible with previous releases. Update your NoHorny jar to beta 8 please, unless you are
> running your own NoHorny server.

- **Tracked buildings are rendered locally**, then sent to the server, instead of sending a custom
  binary representation to the server and rendering it there. This makes things much simpler
  architecturally speaking for me. Sorry for the inconvenience.
- **Discord alerts are now blurred**, thanks to Discord components v2.
- **A bunch of bugfixes.**

<!-- ::post-image src="/blog/nohorny-discord-alert.png" alt="A Discord alert from NoHorny listing the author, coordinates, rating and confidence, with the rendered image hidden behind a spoiler" width="799" height="741" caption="The blurred alert, thanks to Discord components v2." -->

I also laid the groundwork for the last beta builds.
Built-in auth and an admin panel are coming very soon. Now, back to work.
