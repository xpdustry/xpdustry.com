import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";
import { THEME_BOOTSTRAP } from "#app/components/layout/theme";
import * as styles from "#app/Document.css";

export default function Document(props: ParentProps) {
  return (
    <html class={styles.html} lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Link unfurlers (Discord, Slack) read the first theme-color and ignore `media`, so
            this stays unconditional: a media-scoped tag before it would tint every embed rail. */}
        <meta name="theme-color" content="#41c1ba" />
        <script>{THEME_BOOTSTRAP}</script>
        <HydrationScript />
      </head>
      <body class={styles.body}>{props.children}</body>
    </html>
  );
}
