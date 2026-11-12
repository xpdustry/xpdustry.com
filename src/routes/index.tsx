import { createFileRoute, getRouteApi, rootRouteId, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Cover } from "#app/components/home/Cover";
import { Gamemodes } from "#app/components/home/Gamemodes";
import { News } from "#app/components/home/News";
import { Projects } from "#app/components/home/Projects";
import { SITE } from "#app/data/site";
import { seo } from "#app/lib/seo";

/** How often an open home page catches up with the servers, as often as they are polled. */
const REFRESH_MS = 30_000;

const root = getRouteApi(rootRouteId);

export const Route = createFileRoute("/")({
  head: () => seo({ title: SITE.name, description: SITE.description, path: "/" }),
  component: Home,
});

function Home() {
  const live = root.useLoaderData();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void router.invalidate();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <main id="main">
      <Cover live={live} />
      <Gamemodes snapshot={live.servers} />
      <News />
      <Projects releases={live.releases} />
    </main>
  );
}
