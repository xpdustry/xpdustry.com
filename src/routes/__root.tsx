import {
  HeadContent,
  Scripts,
  createRootRoute,
  rootRouteId,
  useMatch
} from "@tanstack/react-router";
import { getLocale, getTranslationsSnapshot, GTProvider, T } from "gt-tanstack-start";
import { useEffect, type ReactNode } from "react";
import { Background } from "#app/shell/Background";
import { ENTER } from "#app/shell/enter";
import { Footer } from "#app/shell/Footer";
import { Header } from "#app/shell/Header";
import { FRAME_IMAGES, REVEAL, REVEAL_IMAGES } from "#app/shell/reveal";
import { RouteAnnouncer } from "#app/shell/RouteAnnouncer";
import { shellData } from "#app/shell/shellData";
import { getLiveData } from "#app/status/live.functions";
import { CROWN } from "#app/textures/page";
import { fontPreloads } from "#app/ui/styles/fontPreloads";
import "@fontsource/momo-trust-display/400.css";
import "@fontsource-variable/momo-trust-sans/wght.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "#app/ui/styles/cyrillic.css";
import "#app/ui/styles/global.css";

export const Route = createRootRoute({
  loader: async () => {
    const locale = getLocale();
    const [live, translations] = await Promise.all([
      getLiveData(),
      getTranslationsSnapshot(locale)
    ]);
    return { live, locale, translations };
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: CROWN.settings.color }
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      ...fontPreloads(["display", "mono"], shellData(loaderData).locale),
      // The backdrop's layers are many times the crown's weight, so they yield to the first screen.
      ...REVEAL_IMAGES.map((href) => ({
        rel: "preload",
        href,
        as: "image",
        type: "image/webp",
        fetchPriority: FRAME_IMAGES.includes(href) ? ("high" as const) : ("low" as const)
      }))
    ]
  }),
  shellComponent: Document
});

/**
 * The colour a browser shows before the stylesheet arrives, in place of white. It is the same deep
 * green the stylesheet's own `:root` rule gives the canvas.
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
  useSmoothScrollOnceHydrated();
  const { locale, translations, players } = shellData(
    useMatch({ from: rootRouteId, select: (match) => match.loaderData })
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <style>{UNSTYLED_CANVAS}</style>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
        <script dangerouslySetInnerHTML={{ __html: ENTER }} />
      </head>
      <body>
        <GTProvider locale={locale} translations={translations}>
          <SkipLink />
          <Background />
          <div className="wrap">
            <Header players={players} />
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
