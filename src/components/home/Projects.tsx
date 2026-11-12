import { T, useGT, useMessages } from "gt-tanstack-start";
import type { ReactNode } from "react";
import { Tray } from "#app/components/tray/Tray";
import type { LiveData } from "#app/data/live";
import { projects, repositoryUrl, type Project } from "#app/data/projects";
import { SITE } from "#app/data/site";
import { versionOf } from "#app/lib/format";
import { GitHub, PuzzlePiece } from "#app/lib/icons";
import { PATCHES } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import type { Patches as PatchSet } from "#app/textures/texture";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./Projects.css";

type CardOf<Kind extends Project["card"]["kind"]> = Extract<Project["card"], { kind: Kind }>;

export function Projects({ releases }: { releases: LiveData["releases"] }) {
  const gt = useGT();
  return (
    <Tray
      id="projects"
      icon={PuzzlePiece}
      title={gt("Projects")}
      subtitle={gt("Plugins, mods and tooling we maintain")}
      action={{ href: SITE.github, label: "GitHub" }}
    >
      <div className={styles.projects}>
        {projects.map((project) => {
          const { card } = project;
          return card.kind === "featured" ? (
            <Featured
              key={project.slug}
              project={project}
              card={card}
              release={releases[project.slug]}
            />
          ) : (
            <Item
              key={project.slug}
              project={project}
              card={card}
              release={releases[project.slug]}
            />
          );
        })}
        <Tile href={SITE.github} patches={PATCHES.moreCard} className={styles.more}>
          <GitHub className={styles.symbol} />
          <h3>
            <T>Much more</T>
          </h3>
          <p>
            <T>Everything we make is public on GitHub.</T>
          </p>
        </Tile>
      </div>
    </Tray>
  );
}

function Tile({
  href,
  ground,
  patches,
  className,
  children
}: {
  href: string;
  ground?: string;
  patches: PatchSet;
  className: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={`${card.card} ${className}`} style={{ background: ground }}>
      <Patches patches={patches} />
      {children}
    </a>
  );
}

interface CardProps<Kind extends Project["card"]["kind"]> {
  project: Project;
  card: CardOf<Kind>;
  release?: string;
}

function Version({ tag }: { tag?: string }) {
  return tag ? <span className={styles.version}>{versionOf(tag)}</span> : null;
}

function Featured({ project, card, release }: CardProps<"featured">) {
  const m = useMessages();
  return (
    <Tile
      href={project.website ?? repositoryUrl(project)}
      ground={card.ground}
      patches={card.patches}
      className={styles.featured}
    >
      <span className={styles.top}>
        {project.icon && <img src={project.icon} alt="" />}
        <h3>{project.name}</h3>
        <Version tag={release} />
      </span>
      <p style={{ color: card.muted }}>{m(project.summary)}</p>
      <span className={styles.stage}>
        <img
          className={styles.screenshot}
          src={card.screenshot}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
    </Tile>
  );
}

function Item({ project, card: { symbol: Glyph, ...card }, release }: CardProps<"item">) {
  const m = useMessages();
  return (
    <Tile
      href={project.website ?? repositoryUrl(project)}
      ground={card.ground}
      patches={card.patches}
      className={styles.item}
    >
      <Glyph className={styles.symbol} />
      <h3>{project.name}</h3>
      <p>{m(project.summary)}</p>
      <Version tag={release} />
    </Tile>
  );
}
