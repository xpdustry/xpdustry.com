import { For, Show, createMemo } from "solid-js";
import logo from "#app/assets/logo.svg";
import { PostCard } from "#app/components/content/PostCard";
import { ProjectCard } from "#app/components/content/ProjectCard";
import { ServerCard } from "#app/components/content/ServerCard";
import { BAND_WIDE_BLOBS, BlobField, HERO_BLOBS } from "#app/components/layout/BlobField";
import { PageMeta } from "#app/components/layout/PageMeta";
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

      <Hero />

      {/* Everything the site has to show, one section after another. Each
          section owns the full width, and its card grid runs at most three
          per row, so no card ever stretches into a strip. The hero and the
          sections share one continuous background: a sunk band under the
          hero read as a seam, not as structure. The hero's bottom padding
          plus this top padding sums to the hero's own top padding, so the
          nav, the hero and the projects sit on one even rhythm. */}
      <div class="relative isolate pt-8 pb-12 sm:pb-16">
        <BlobField artwork={BAND_WIDE_BLOBS} />
        <div class="wrap grid gap-12">
          <ProjectSection />
          <BlogSection />
          <ServerSection snapshot={servers} />
        </div>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section class="pt-12 pb-8 sm:pt-16">
      {/* Off-screen: the page still has one h1, the canvas just does not
          repeat the name the header is already carrying. */}
      <h1 class="sr-only">{SITE.name}</h1>
      {/* Mark on the left, pitch on the right. A centered stack spent its
          height on padding rather than content; side by side, the hero is one
          short band instead of a screen of its own. The mark needs no name
          beside it here: the header one inch up already says Xpdustry. */}
      <div class="wrap flex flex-col items-center gap-8 sm:gap-10 lg:flex-row lg:items-center lg:gap-x-12">
        <div class="flex shrink-0 justify-center lg:w-1/4">
          <img class="h-auto w-28 sm:w-40" src={logo} alt="" width="170" height="170" />
        </div>

        <div class="min-w-0 lg:flex-1">
          <p class="text-xl font-bold text-ink-muted sm:text-2xl">
            &ldquo;{SITE.positioning}&rdquo;
          </p>
          <p class="mt-5 max-w-prose text-base text-ink-muted">
            Xpdustry is a small group of developers, building open source tools for the Mindustry
            community since 2019. We also host the Chaotic Neutral Mindustry servers.
            <br />
            Come say hi.
          </p>

          <div class="mt-7 flex flex-wrap gap-3">
            <ButtonLink variant="accent" href="#projects">
              Check out our projects
            </ButtonLink>
            <ButtonLink variant="plain" href="#servers">
              Join our Mindustry servers
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectSection() {
  // Editorial order, straight from the definitions. Nothing here is polled.
  const ordered = () => [...projects].sort((a, b) => a.order - b.order);

  return (
    <section id="projects" tabindex="-1">
      <SectionHead title="Projects" />
      <div class="home-list grid auto-rows-fr gap-3">
        <For each={ordered()}>{(project) => <ProjectCard project={project} />}</For>
      </div>
    </section>
  );
}

function ServerSection(props: { snapshot: () => ServerSnapshot | undefined }) {
  const snapshot = () => props.snapshot() ?? EMPTY_SERVER_SNAPSHOT;
  const online = () => snapshot().servers.filter((server) => server.online).length;

  return (
    <section id="servers" tabindex="-1">
      <SectionHead title="Servers" />
      <ul class="home-list m-0 grid list-none gap-3 p-0">
        <For each={snapshot().servers}>
          {(server) => <ServerCard server={server} state={snapshot().state} />}
        </For>
      </ul>

      {/* A total outage is a normal state, not an error: the addresses on
          the cards above are still the right ones to connect to. */}
      <Show when={snapshot().state !== "loading" && online() === 0}>
        <p class="mt-4 text-sm text-ink-muted">None of the servers are reachable.</p>
      </Show>
    </section>
  );
}

/** One column of cards. The rest are on /blog, which the column head links to. */
const NEWS_LIMIT = 4;

/**
 * Posts only.
 *
 * A raw GitHub release is a changelog, and a changelog is a thing you go
 * looking for rather than something the front page should recite. The
 * repository is where releases are authoritative. What belongs here is the
 * writing.
 */
function BlogSection() {
  const recent = () => [...postsBySlug.values()].slice(0, NEWS_LIMIT);

  return (
    <section>
      <SectionHead title="Blog" href="/blog" linkLabel="All posts" />
      <Show
        when={recent().length > 0}
        fallback={
          <div class="grid justify-items-start gap-3 rounded-2xl border border-dashed border-line-soft bg-panel-sunk px-5 py-6 text-ink-muted">
            <span class="font-bold text-ink">Nothing published yet</span>
          </div>
        }
      >
        <div class="home-list grid auto-rows-fr gap-3">
          <For each={recent()}>{(post) => <PostCard post={post} />}</For>
        </div>
      </Show>
    </section>
  );
}

/** The same head on all three columns: a title, and the page that holds more. */
function SectionHead(props: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div class="mb-4 flex items-baseline justify-between gap-3 border-b-2 border-line pb-3">
      <h2 class="text-2xl font-extrabold tracking-tight stretch-110">{props.title}</h2>
      <Show when={props.href}>
        {(href) => (
          <a
            class="font-mono text-data font-medium tracking-tight text-ink-faint no-underline hover:text-ink hover:underline hover:underline-offset-3"
            href={href()}
          >
            {props.linkLabel}
          </a>
        )}
      </Show>
    </div>
  );
}
