import type { BrowserContextOptions, LaunchOptions } from "playwright";

interface BrowserSetup {
  launch: LaunchOptions;
  context: BrowserContextOptions;
}

/** Firefox has no clipboard permission to grant, only a preference that opens the clipboard. */
export const BROWSERS_WITH_OPEN_CLIPBOARD = {
  chromium: { launch: {}, context: { permissions: ["clipboard-read", "clipboard-write"] } },
  firefox: {
    launch: { firefoxUserPrefs: { "dom.events.testing.asyncClipboard": true } },
    context: {}
  }
} satisfies Record<string, BrowserSetup>;
