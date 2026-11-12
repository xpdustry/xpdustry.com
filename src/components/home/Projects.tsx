import { Tray } from "#app/components/tray/Tray";
import { GitHub, PuzzlePiece } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import type { LiveData } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { projects, repositoryUrl, type Project } from "#app/data/projects";
import { SITE } from "#app/data/site";
import { versionOf } from "#app/lib/format";
import card from "#app/components/ui/Card.module.css";
import styles from "./Projects.module.css";

export function Projects({ releases }: { releases: LiveData["releases"] }) {
  const items = projects.filter((project) => project.card.kind === "item");
  return (
    <Tray
      id="projects"
      icon={PuzzlePiece}
      title="Projects"
      subtitle="Plugins, mods and tooling we maintain"
      action={{ href: SITE.github, label: "GitHub" }}
    >
      <div className={styles.grid}>
        {projects.map((project) =>
          project.card.kind === "featured" ? (
            <Featured key={project.slug} project={project} release={releases[project.slug]} />
          ) : (
            <Item
              key={project.slug}
              project={project}
              release={releases[project.slug]}
              // between tablet and desktop the first item spans the row, the rest pair up
              className={project === items[0] ? styles.lead : undefined}
            />
          ),
        )}
        <a href={SITE.github} className={`${card.card} spot ${styles.more}`}>
          <Patches patches={PATCHES.moreCard} />
          <GitHub className={styles.symbol} />
          <h3>Much more</h3>
          <p>Everything we make is public on GitHub.</p>
        </a>
      </div>
    </Tray>
  );
}

function Version({ tag, className }: { tag?: string; className: string }) {
  return tag ? <span className={className}>{versionOf(tag)}</span> : null;
}

function Featured({ project, release }: { project: Project; release?: string }) {
  if (project.card.kind !== "featured") return null;
  const { ground, patches, muted, screenshot } = project.card;
  return (
    <a
      href={project.website ?? repositoryUrl(project)}
      className={`${card.card} spot ${styles.featured}`}
      style={{ background: ground }}
    >
      <Patches patches={patches} />
      <span className={styles.top}>
        {project.icon && <img src={project.icon} alt="" />}
        <h3>{project.name}</h3>
        <Version tag={release} className={styles.version} />
      </span>
      <p style={{ color: muted }}>{project.summary}</p>
      <img className={styles.screenshot} src={screenshot} alt="" loading="lazy" decoding="async" />
    </a>
  );
}

function Item({
  project,
  release,
  className,
}: {
  project: Project;
  release?: string;
  className?: string;
}) {
  if (project.card.kind !== "item") return null;
  const { ground, patches, symbol: Glyph } = project.card;
  return (
    <a
      href={project.website ?? repositoryUrl(project)}
      className={`${card.card} spot ${styles.item} ${className ?? ""}`}
      style={{ background: ground }}
    >
      <Patches patches={patches} />
      <Glyph className={styles.symbol} />
      <h3>{project.name}</h3>
      <p>{project.summary}</p>
      <Version tag={release} className={styles.version} />
    </a>
  );
}
