import { For, Show, createMemo, type Accessor } from "solid-js";
import logo from "#app/assets/logo.svg";
import { PostCard } from "#app/components/content/PostCard";
import { ProjectCard } from "#app/components/content/ProjectCard";
import { ServerCard } from "#app/components/content/ServerCard";
import { PageMeta } from "#app/components/layout/PageMeta";
import { ButtonLink } from "#app/components/system/Pressable";
import { postsBySlug } from "#app/content/registry";
import { projects } from "#app/data/projects";
import { getServerSnapshot } from "#app/data/queries";
import { SITE } from "#app/data/site";
import { POLLING_SERVER_SNAPSHOT, type ServerSnapshot } from "#app/data/snapshots";
import * as styles from "./index.css";

const NEWS_LIMIT = 4;
const orderedProjects = [...projects].sort((a, b) => a.order - b.order);
const recentPosts = [...postsBySlug.values()].slice(0, NEWS_LIMIT);

export default function Home() {
  const servers = createMemo(() => getServerSnapshot());

  return (
    <>
      <PageMeta title={SITE.name} description={SITE.description} path="/" />
      <Hero />
      <div class={styles.content}>
        <div class={styles.sections}>
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
    <section class={styles.hero}>
      <h1 class={styles.hiddenHeading}>{SITE.name}</h1>
      <div class={styles.heroInner}>
        <div class={styles.logoFrame}>
          <img class={styles.logo} src={logo} alt="" width="170" height="170" />
        </div>

        <div class={styles.pitch}>
          <p class={styles.positioning}>&ldquo;{SITE.positioning}&rdquo;</p>
          <p class={styles.introduction}>
            Xpdustry is a small group of developers, building open source tools for the Mindustry
            community since 2019. We also host the Chaotic Neutral Mindustry servers.
            <br />
            Come say hi.
          </p>

          <div class={styles.actions}>
            {/* target="_self" makes sure solid does not prevent
                repeated scrolls when a link is already selected */}
            <ButtonLink variant="accent" href="#projects" target="_self">
              Check out our projects
            </ButtonLink>
            <ButtonLink variant="plain" href="#servers" target="_self">
              Join our Mindustry servers
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectSection() {
  return (
    <section id="projects" tabindex="-1">
      <SectionHead title="Projects" />
      <div class={styles.cardList}>
        <For each={orderedProjects}>{(project) => <ProjectCard project={project} />}</For>
      </div>
    </section>
  );
}

function ServerSection(props: { snapshot: Accessor<ServerSnapshot | undefined> }) {
  const snapshot = () => props.snapshot() ?? POLLING_SERVER_SNAPSHOT;

  return (
    <section id="servers" tabindex="-1">
      <SectionHead title="Servers" />
      <ul class={styles.serverList}>
        <For each={snapshot().servers}>{(server) => <ServerCard server={server} />}</For>
      </ul>

      <Show when={snapshot().servers.every((server) => server.status === "offline")}>
        <p class={styles.outage}>None of the servers are reachable.</p>
      </Show>
    </section>
  );
}

function BlogSection() {
  return (
    <section>
      <SectionHead title="Blog" href="/blog" linkLabel="All posts" />
      <Show when={recentPosts.length > 0} fallback={<EmptyPosts />}>
        <div class={styles.cardList}>
          <For each={recentPosts}>{(post) => <PostCard post={post} />}</For>
        </div>
      </Show>
    </section>
  );
}

function EmptyPosts() {
  return (
    <div class={styles.empty}>
      <span class={styles.emptyTitle}>Nothing published yet</span>
    </div>
  );
}

function SectionHead(props: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div class={styles.sectionHead}>
      <h2 class={styles.sectionTitle}>{props.title}</h2>
      <Show when={props.href}>
        {(href) => (
          <a class={styles.sectionLink} href={href()}>
            {props.linkLabel}
          </a>
        )}
      </Show>
    </div>
  );
}
