import text from "@fontsource-variable/momo-trust-sans/files/momo-trust-sans-latin-wght-normal.woff2?url";
import mono from "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2?url";
import display from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?url";
import {
  HeadContent,
  Scripts,
  createRootRoute,
  rootRouteId,
  useMatch,
} from "@tanstack/react-router";
import { getLocale, getTranslationsSnapshot, GTProvider, T } from "gt-tanstack-start";
import { useEffect, type ReactNode } from "react";
import { Background } from "#app/components/site/Background";
import { Footer } from "#app/components/site/Footer";
import { Header } from "#app/components/site/Header";
import { RouteAnnouncer } from "#app/components/site/RouteAnnouncer";
import { playerCount } from "#app/data/live";
import { getLiveData } from "#app/data/live.functions";
import { CROWN } from "#app/data/textures";
import { FRAME_IMAGES, REVEAL, REVEAL_IMAGES } from "#app/lib/reveal";
import { useSpotlight } from "#app/lib/useSpotlight";
import gtConfig from "../../gt.config.json";
import "@fontsource/momo-trust-display/400.css";
import "@fontsource-variable/momo-trust-sans/wght.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "#app/styles/cyrillic.css";
import "#app/styles/global.css";

export const Route = createRootRoute({
  loader: async () => {
    const locale = getLocale();
    const [live, translations] = await Promise.all([
      getLiveData(),
      getTranslationsSnapshot(locale),
    ]);
    return { live, locale, translations };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: CROWN.settings.color },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      ...[display, text, mono].map((href) => ({
        rel: "preload",
        href,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous" as const,
      })),
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

/**
 * The colour a browser shows before the stylesheet arrives, in place of white. The stylesheet's own
 * `:root` rule outranks `:where()` and clears it, so the body's background reaches the canvas.
 */
const UNSTYLED_CANVAS = `:where(html){background:${CROWN.settings.color}}`;

function useSmoothScrollOnceHydrated() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "";
  }, []);
}

function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      <T>Skip to content</T>
    </a>
  );
}

function Document({ children }: { children: ReactNode }) {
  useSpotlight();
  useSmoothScrollOnceHydrated();
  const loaded = useMatch({ from: rootRouteId, select: (match) => match.loaderData });
  const live = loaded?.live;
  const locale = loaded?.locale ?? gtConfig.defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <style>{UNSTYLED_CANVAS}</style>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
      </head>
      <body>
        <GTProvider locale={locale} translations={loaded?.translations ?? {}}>
          <SkipLink />
          <Background />
          <div className="wrap">
            <Header players={live ? playerCount(live.servers.servers) : { state: "polling" }} />
            {children}
          </div>
          <Footer />
        </GTProvider>
        <RouteAnnouncer />
        <Scripts />
      </body>
    </html>
  );
}
