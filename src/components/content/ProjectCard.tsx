import { Show } from "solid-js";
import { CardLink } from "#app/components/system/Pressable";
import { repositoryUrl, type ProjectDefinition } from "#app/data/projects";
import * as styles from "#app/components/content/ProjectCard.css";

export interface ProjectCardProps {
  project: ProjectDefinition;
}

export function ProjectCard(props: ProjectCardProps) {
  return (
    <CardLink
      faceClass={styles.face}
      href={repositoryUrl(props.project)}
      target="_blank"
      rel="noreferrer"
    >
      <span class={styles.heading}>
        <span class={styles.mark}>
          <Show
            when={props.project.icon}
            fallback={<span class={styles.fallbackImage} aria-hidden="true" />}
          >
            {(icon) => <img class={styles.image} src={icon()} alt="" width="40" height="40" />}
          </Show>
        </span>
        <span class={styles.title}>{props.project.name}</span>
      </span>
      <span class={styles.summary}>{props.project.summary}</span>
    </CardLink>
  );
}
