---
title: "Beta 3: Incremental grouping"
description: >-
  How NoHorny went from scanning the whole map in a background thread to a
  synchronous incremental grouping algorithm.
publishedAt: 2026-04-23
author: phinner
topic: NoHorny
releases:
  - xpdustry/nohorny@v4.0.0-beta.3
---

Another day, another NoHorny release. This time: **beta 3**.
In this release, the main improvement is the grouping algorithm.

- **In v3**, I was scanning the entire map every time there was a change, in a background thread.
- **In v4 b1 and b2**, I restricted the scanning to a small bounding zone around a modified
  building. It no longer needed to run in a background thread, as performance became predictable.
  But for large canvas groups, larger than **20 by 20 blocks**, the accuracy decreased as the
  resulting images were clipped.
- **In v4 b3**, I spread the grouping process across several ticks, allowing me to make the
  bounding box much larger: **400 by 400 blocks**.

With that improved accuracy, the local model of the NoHorny server is less likely to throw false
positives for large canvas images.

Anyway, with that out of the way, for beta 4 I want to improve tracking and monitoring, especially
for people who do not want to automatically ban players, but instead want to be warned about
detected NSFW builds.

For that, I will either add an option in the client to set up a Discord webhook that sends you the
suspicious image, or build that directly into the NoHorny server.
