import { createFileRoute, getRouteApi, rootRouteId, useRouter } from "@tanstack/react-router";
import { getLocale, getMessages } from "gt-tanstack-start";
import { useEffect } from "react";
import { SITE } from "#app/brand/site";
import { Cover } from "#app/landing/Cover";
import { Gamemodes } from "#app/landing/Gamemodes";
import { News } from "#app/landing/News";
import { Projects } from "#app/landing/Projects";
import { Team } from "#app/landing/Team";
import { seo, siteCard } from "#app/seo/meta";
import { homeStructuredData } from "#app/seo/structuredData";
import { getTeam } from "#app/status/team.functions";

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
  loader: async () => ({ team: await getTeam() }),
  component: Home
});

function Home() {
  const { live } = root.useLoaderData();
  const { team } = Route.useLoaderData();
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
      <Team team={team} />
    </main>
  );
}
