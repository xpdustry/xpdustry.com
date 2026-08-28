/* The global stylesheet must evaluate first: it declares the cascade layer
   order every CSS module then slots into. */
import "#app/styles/app.css";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";
import { Loading, type ParentProps } from "solid-js";
import { pageRoutes } from "virtual:file-routes";
import { SiteFooter } from "#app/components/layout/SiteFooter";
import { SiteHeader } from "#app/components/layout/SiteHeader";
import { ThemeProvider } from "#app/components/layout/ThemeProvider";

const Router = createRouter({ routes: fileRoutes(pageRoutes) });

/**
 * The site shell. Every page renders inside this: skip link, header, main
 * landmark, footer. Pages own their own <h1>, their own reticulate field and their
 * own metadata.
 */
export default function App() {
  return <Router>{(props) => <Shell>{props.children}</Shell>}</Router>;
}

function Shell(props: ParentProps) {
  return (
    <ThemeProvider>
      <div class="relative flex min-h-screen flex-col">
        <a
          class="absolute -top-25 left-4 z-600 rounded-lg border-2 border-line bg-panel px-4 py-3 font-bold no-underline focus:top-4"
          href="#main"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main class="flex-1" id="main" tabindex="-1">
          <Loading fallback={<div class="wrap py-24" />}>{props.children}</Loading>
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
