import "@fontsource-variable/archivo/standard.css";
import "@fontsource/martian-mono/latin-400.css";
import "@fontsource/martian-mono/latin-500.css";
import "@fontsource/martian-mono/latin-600.css";
import "#app/styles/global.css";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";
import { Loading, type ParentProps } from "solid-js";
import { pageRoutes } from "virtual:file-routes";
import { ReticulateField } from "#app/components/layout/ReticulateField";
import { SiteFooter } from "#app/components/layout/SiteFooter";
import { SiteHeader } from "#app/components/layout/SiteHeader";
import { ThemeProvider } from "#app/components/layout/ThemeProvider";
import * as styles from "#app/App.css";

const Router = createRouter({ routes: fileRoutes(pageRoutes) });

export default function App() {
  return <Router>{Shell}</Router>;
}

function Shell(props: ParentProps) {
  return (
    <ThemeProvider>
      <div class={styles.shell}>
        <ReticulateField />
        <a class={styles.skipLink} href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main class={styles.main} id="main" tabindex="-1">
          <Loading fallback={<div class={styles.loading} />}>{props.children}</Loading>
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
