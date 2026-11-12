import logicProcessor from "#app/assets/mindustry/logic-processor.png";
import { Tray } from "#app/components/tray/Tray";
import { GitHub } from "#app/components/ui/Icons";
import { PlinthAnchor } from "#app/components/ui/Plinth";
import { Texture } from "#app/components/ui/Texture";
import type { LiveData } from "#app/data/live";
import { projects, repositoryUrl, type Project } from "#app/data/projects";
import { SITE } from "#app/data/site";
import { patches } from "#app/data/textures";
import { versionOf } from "#app/lib/format";
import card from "#app/components/ui/Card.module.css";
import styles from "./Projects.module.css";

const MORE_TEXTURE = patches("#104643", "#0c3c39", [
  [1.02, 1, 0.42, 1],
  [0.12, 0.02, 0.12, 1],
]);

export function Projects({ releases }: { releases: LiveData["releases"] }) {
  const items = projects.filter((project) => project.card.kind === "item");
  return (
    <Tray
      id="projects"
      icon={logicProcessor}
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
        <section className={`${card.card} spot ${styles.more}`}>
          <Texture settings={MORE_TEXTURE} drift />
          <h3>Much more</h3>
          <p>Everything we make is public.</p>
          <PlinthAnchor size="sm" className={styles.browse} href={SITE.github}>
            <GitHub />
            Browse on GitHub
          </PlinthAnchor>
        </section>
      </div>
    </Tray>
  );
}

function Version({ tag, className }: { tag?: string; className: string }) {
  return tag ? <span className={className}>{versionOf(tag)}</span> : null;
}

function Featured({ project, release }: { project: Project; release?: string }) {
  if (project.card.kind !== "featured") return null;
  const { ground, texture, muted, screenshot } = project.card;
  return (
    <a
      href={repositoryUrl(project)}
      className={`${card.card} spot ${styles.featured}`}
      style={{ background: ground }}
    >
      <Texture settings={texture} drift />
      <span className={styles.top}>
        {project.icon && <img src={project.icon} alt="" />}
        <h3>{project.name}</h3>
        <Version tag={release} className={styles.version} />
      </span>
      <p style={{ color: muted }}>{project.summary}</p>
      <img className={styles.screenshot} src={screenshot} alt="" />
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
  const { ground, texture, item } = project.card;
  return (
    <a
      href={repositoryUrl(project)}
      className={`${card.card} spot ${styles.item} ${className ?? ""}`}
      style={{ background: ground }}
    >
      <Texture settings={texture} drift />
      <img className={`sprite ${styles.sprite}`} src={item} alt="" />
      <h3>{project.name}</h3>
      <p>{project.summary}</p>
      <Version tag={release} className={styles.version} />
    </a>
  );
}
