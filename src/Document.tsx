import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";
import { THEME_BOOTSTRAP } from "#app/components/layout/theme";

/**
 * The document shell. `data-theme` is set by a blocking inline script before
 * the first paint, because resolving the theme after hydration flashes the
 * wrong one on every load.
 */
export default function Document(props: ParentProps) {
  // noinspection HtmlRequiredTitleElement
  return (
    <html class="scroll-smooth" lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* No <title> here on purpose: every route renders <PageMeta>, and a
            static one in the shell would come first in the head and win. */}
        <script>{THEME_BOOTSTRAP}</script>
        <HydrationScript />
      </head>
      <body class="overflow-x-hidden bg-page font-sans text-ink antialiased">{props.children}</body>
    </html>
  );
}
