import { createFileRoute, getRouteApi, rootRouteId, useRouter } from "@tanstack/react-router";
import { getLocale, getMessages } from "gt-tanstack-start";
import { useEffect } from "react";
import { SITE } from "#app/brand/site";
import { Cover } from "#app/components/home/Cover";
import { Gamemodes } from "#app/components/home/Gamemodes";
import { News } from "#app/components/home/News";
import { Projects } from "#app/components/home/Projects";
import { seo, siteCard } from "#app/lib/seo";
import { homeStructuredData } from "#app/lib/structuredData";

const REFRESH_MS = 30_000;

const root = getRouteApi(rootRouteId);

export const Route = createFileRoute("/")({
  head: async () => {
    const m = await getMessages();
    const locale = getLocale();
    return seo({
      locale,
      title: m(SITE.title),
      fullTitle: true,
      description: m(SITE.description),
      path: "/",
      image: siteCard(m),
      jsonLd: homeStructuredData(locale)
    });
  },
  component: Home
});

function Home() {
  const { live } = root.useLoaderData();
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
