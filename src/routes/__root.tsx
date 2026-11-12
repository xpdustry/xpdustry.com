import text from "@fontsource-variable/momo-trust-sans/files/momo-trust-sans-latin-wght-normal.woff2?url";
import mono from "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2?url";
import display from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?url";
/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
  rootRouteId,
  useMatch,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Background } from "#app/components/site/Background";
import { Footer } from "#app/components/site/Footer";
import { Header } from "#app/components/site/Header";
import { playerCount } from "#app/data/live";
import { getLiveData } from "#app/data/live.functions";
import { FRAME_IMAGES, REVEAL, REVEAL_IMAGES } from "#app/lib/reveal";
import { useSpotlight } from "#app/lib/useSpotlight";
import "#app/styles/global.css";

export const Route = createRootRoute({
  // every page's header counts the players; the home page shows the rest
  loader: () => getLiveData(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // the deep teal the top of the page frays out of
      { name: "theme-color", content: "#083230" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      // the faces the first screen sets, fetched before the stylesheet asks for them
      ...[display, text, mono].map((href) => ({
        rel: "preload",
        href,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous" as const,
      })),
      // the page shows once its crown and ridge are in, and its backdrop fades in once it is
      ...REVEAL_IMAGES.map((href) => ({
        rel: "preload",
        href,
        as: "image",
        type: "image/webp",
        ...(FRAME_IMAGES.includes(href) && { fetchPriority: "high" as const }),
      })),
    ],
  }),
  shellComponent: Document,
});

function Document({ children }: { children: ReactNode }) {
  useSpotlight();
  // smooth scrolling from here on: before, it would glide the restored scroll of a reload
  useEffect(() => {
    document.documentElement.dataset.hydrated = "";
  }, []);
  // the shell also wraps the page while the loader is pending or failed
  const live = useMatch({ from: rootRouteId, select: (match) => match.loaderData });

  return (
    // the reveal marks the root until the backdrop is in
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Background />
        <div className="wrap">
          <Header players={live ? playerCount(live.servers.servers) : { state: "polling" }} />
          {children}
        </div>
        <Footer />
        <Scripts />
      </body>
    </html>
  );
}
