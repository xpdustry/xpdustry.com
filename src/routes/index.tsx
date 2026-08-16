import { For, Show, createMemo } from "solid-js";
import logo from "#app/assets/logo.svg";
import { PostCard } from "#app/components/content/PostCard";
import { ProjectCard } from "#app/components/content/ProjectCard";
import { ServerCard } from "#app/components/content/ServerCard";
import {
  BAND_BOTTOM_BLOBS,
  BAND_TOP_BLOBS,
  BAND_WIDE_BLOBS,
  BlobField,
  HERO_BLOBS,
} from "#app/components/layout/BlobField";
import { PageMeta } from "#app/components/layout/PageMeta";
import { DiscordIcon, GitHubIcon, MailIcon } from "#app/components/system/Icons";
import { ButtonLink } from "#app/components/system/Pressable";
import { postsBySlug } from "#app/content/registry";
import { projects } from "#app/data/projects";
import { getServerSnapshot } from "#app/data/queries";
import { SITE } from "#app/data/site";
import { EMPTY_SERVER_SNAPSHOT } from "#app/data/snapshots";
import type { ServerSnapshot } from "#app/data/snapshots";

export default function Home() {
  // Reading through a memo keeps the not-ready state inside the Loading
  // boundary the shell provides, so the page still streams as one document.
  const servers = createMemo(() => getServerSnapshot());

  return (
    <>
      <PageMeta title={SITE.name} description={SITE.description} path="/" />
      <BlobField artwork={HERO_BLOBS} />

      <section class="py-16 text-center sm:pt-24 xl:pt-32">
        <div class="wrap">
          <img class="mx-auto h-auto w-28 sm:w-44" src={logo} alt="" width="170" height="170" />
          <h1 class="mt-6 text-5xl leading-none font-extrabold tracking-tighter stretch-118 sm:text-7xl lg:text-8xl">
            {SITE.name}
          </h1>
          <p class="mx-auto mt-4 max-w-xl text-center text-base text-ink-muted sm:text-lg">
            {SITE.positioning}
          </p>

          <div class="mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink size="lg" variant="plain" href="#servers">
              Join our Mindustry servers
            </ButtonLink>
          </div>
        </div>
      </section>

      <ProjectsBand />
      <NewsBand />
      <ServersBand snapshot={servers} />
      <TeamBand />
    </>
  );
}

function ProjectsBand() {
  // Editorial order, straight from the definitions. Nothing here is polled.
  const ordered = () => [...projects].sort((a, b) => a.order - b.order);

  return (
    <section class={band} id="projects" tabindex="-1">
      <div class="wrap">
        <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class={heading1}>Projects</h2>
          </div>
        </div>

        <div class="project-grid grid auto-rows-fr gap-6">
          <For each={ordered()}>{(project) => <ProjectCard project={project} />}</For>
        </div>
      </div>
    </section>
  );
}

/** One row of cards. The rest are on /blog, which the band head links to. */
const NEWS_LIMIT = 3;

/**
 * Posts only.
 *
 * A raw GitHub release is a changelog, and a changelog is a thing you go
 * looking for rather than something the front page should recite. The
 * repository is where releases are authoritative. What belongs here is the
 * writing.
 */
function NewsBand() {
  const recent = () => [...postsBySlug.values()].slice(0, NEWS_LIMIT);

  return (
    <section class={`${band} bg-page-sunk`}>
      <BlobField artwork={BAND_TOP_BLOBS} />
      <BlobField artwork={BAND_BOTTOM_BLOBS} />
      <div class="wrap">
        <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
          <h2 class={heading1}>Latest news</h2>
          <ButtonLink size="sm" variant="plain" href="/blog">
            All posts
          </ButtonLink>
        </div>

        <Show
          when={recent().length > 0}
          fallback={
            <div class={emptyState}>
              <span class="font-bold text-ink">Nothing published yet</span>
            </div>
          }
        >
          {/* The same card the blog index uses, and the same grid. */}
          <div class="project-grid grid auto-rows-fr gap-6 [&>article]:grid">
            <For each={recent()}>
              {(post) => (
                <article>
                  <PostCard post={post} />
                </article>
              )}
            </For>
          </div>
        </Show>
      </div>
    </section>
  );
}

function ServersBand(props: { snapshot: () => ServerSnapshot | undefined }) {
  const snapshot = () => props.snapshot() ?? EMPTY_SERVER_SNAPSHOT;
  const online = () => snapshot().servers.filter((server) => server.online).length;

  return (
    <section class={band} id="servers" tabindex="-1">
      <div class="wrap">
        <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class={heading1}>Mindustry servers</h2>
          </div>
        </div>

        <ul class="server-grid m-0 grid list-none gap-4 p-0">
          <For each={snapshot().servers}>
            {(server) => <ServerCard server={server} state={snapshot().state} />}
          </For>
        </ul>

        {/* A total outage is a normal state, not an error: the addresses on
            the cards above are still the right ones to connect to. */}
        <Show when={snapshot().state !== "loading" && online() === 0}>
          <p class="mt-6 max-w-prose text-sm text-ink-muted">None of the servers are reachable.</p>
        </Show>
      </div>
    </section>
  );
}

function TeamBand() {
  return (
    <section class={`${band} bg-page-sunk`}>
      <BlobField artwork={BAND_WIDE_BLOBS} />
      <div class="wrap grid justify-items-start gap-6">
        <h2 class="text-3xl font-bold tracking-tight stretch-110 sm:text-4xl">About us</h2>
        <p class="max-w-prose text-base text-ink-muted sm:text-lg">
          Xpdustry is a small group of developers. We have been making tools for the Mindustry
          community and hosted our own servers since 2019.
          <br />
          Any problem with one of our tools? You need help with a project? Come say hi.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <ButtonLink variant="accent" href={SITE.discord} rel="noreferrer">
            <DiscordIcon />
            Discord
          </ButtonLink>
          <ButtonLink variant="outline" href={SITE.github} rel="noreferrer">
            <GitHubIcon />
            GitHub
          </ButtonLink>
          <ButtonLink variant="outline" href={`mailto:${SITE.email}`}>
            <MailIcon />
            Email
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

const band = "relative isolate border-t-2 border-line bg-page py-12 sm:py-16 lg:py-24";
const heading1 = "text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl";
const emptyState =
  "grid justify-items-start gap-3 rounded-2xl border border-dashed border-line-soft bg-panel-sunk px-6 py-8 text-ink-muted";
