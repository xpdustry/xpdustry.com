import logicProcessor from "#app/assets/mindustry/logic-processor.png";
import { Tray } from "#app/components/tray/Tray";
import { GitHub } from "#app/components/ui/Icons";
import { MazePiece, mazeGrid, useMaze, type MazeAnchor } from "#app/components/ui/Maze";
import { PlinthAnchor } from "#app/components/ui/Plinth";
import type { LiveData } from "#app/data/live";
import { projects, repositoryUrl, type Project } from "#app/data/projects";
import { SITE } from "#app/data/site";
import { versionOf } from "#app/lib/format";
import card from "#app/components/ui/Card.module.css";
import styles from "./Projects.module.css";

/**
 * Where the grid's labyrinth fuses into patches: mostly on corners where cards meet, so one patch
 * shows a piece on each, and always clear of the cards' text.
 */
const ANCHORS: readonly MazeAnchor[] = [
  // wide, where four cards meet; narrower, beside the next card down
  { at: "claj", corner: [1, 1], radius: 92 },
  { at: "nohorny", corner: [0.9, -0.08], radius: 105 },
  { at: "nohorny", corner: [1, 1], radius: 70 },
  { at: "nohorny", corner: [0, 0.6], radius: 60 },
  { at: "toxopid", corner: [1, 0], radius: 66, media: "(min-width: 1101px)" },
  { at: "toxopid", corner: [1, 1], radius: 70, media: "(max-width: 1100px)" },
  { at: "more", corner: [1, 1], radius: 80 },
];

export function Projects({ releases }: { releases: LiveData["releases"] }) {
  const items = projects.filter((project) => project.card.kind === "item");
  const grid = useMaze(ANCHORS);
  return (
    <Tray
      id="projects"
      icon={logicProcessor}
      title="Projects"
      subtitle="Plugins, mods and tooling we maintain"
      action={{ href: SITE.github, label: "GitHub" }}
    >
      <div ref={grid} className={`${styles.grid} ${mazeGrid}`}>
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
          <MazePiece id="more" color="#104643" inner="#0c3c39" />
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
  const { ground, piece, muted, screenshot } = project.card;
  return (
    <a
      href={repositoryUrl(project)}
      className={`${card.card} spot ${styles.featured}`}
      style={{ background: ground }}
    >
      <MazePiece id={project.slug} color={piece[0]} inner={piece[1]} />
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
  const { ground, piece, item } = project.card;
  return (
    <a
      href={repositoryUrl(project)}
      className={`${card.card} spot ${styles.item} ${className ?? ""}`}
      style={{ background: ground }}
    >
      <MazePiece id={project.slug} color={piece[0]} inner={piece[1]} />
      <img className={`sprite ${styles.sprite}`} src={item} alt="" />
      <h3>{project.name}</h3>
      <p>{project.summary}</p>
      <Version tag={release} className={styles.version} />
    </a>
  );
}
