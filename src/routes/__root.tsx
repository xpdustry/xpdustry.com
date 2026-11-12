/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Background } from "#app/components/site/Background";
import { Footer } from "#app/components/site/Footer";
import { Header } from "#app/components/site/Header";
import { useSpotlight } from "#app/lib/useSpotlight";
import "#app/styles/global.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#135854" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: Document,
});

function Document({ children }: { children: ReactNode }) {
  useSpotlight();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Background />
        <div className="wrap">
          <Header />
          {children}
        </div>
        <Footer />
        <Scripts />
      </body>
    </html>
  );
}
