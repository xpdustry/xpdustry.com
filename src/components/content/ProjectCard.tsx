import { Show } from "solid-js";
import { ArrowRightIcon, GitHubIcon } from "#app/components/system/Icons";
import { CardLink } from "#app/components/system/Pressable";
import { overviewPath, projectIcon, projectUrl, type ProjectDefinition } from "#app/data/projects";

export interface ProjectCardProps {
  project: ProjectDefinition;
}

/**
 * A project, as a card you press.
 *
 * One card, one destination: the pages here if the project has any, its
 * repository if it does not. Two footer buttons made the reader choose
 * between "source" and "docs" before they knew what either held, and the
 * choice was only ever offered on one of the four projects.
 *
 * Everything on the card is editorial and local: no version, and so nothing
 * to poll. The current release is one click away on the repository, which is
 * where it is authoritative anyway.
 */
export function ProjectCard(props: ProjectCardProps) {
  const icon = () => projectIcon(props.project);
  const internal = () => overviewPath(props.project) !== undefined;

  return (
    <CardLink
      class="group h-full"
      faceClass="relative flex flex-col items-stretch justify-start gap-3 overflow-hidden p-6 text-left"
      href={projectUrl(props.project)}
      rel={internal() ? undefined : "noreferrer"}
    >
      <span class="flex items-center gap-4">
        <span class="grid size-14 shrink-0 place-items-center rounded-xl border-2 border-line-soft bg-page-sunk p-2">
          <img
            class={["max-h-full max-w-full", icon().fallback ? "dark:invert" : undefined]}
            src={icon().src}
            alt=""
            width="40"
            height="40"
          />
        </span>
        <span class="text-xl font-bold text-ink sm:text-2xl">{props.project.name}</span>
      </span>

      <span class="text-sm text-ink-muted">{props.project.summary}</span>

      <span class="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-4 font-mono text-data font-medium tracking-tight text-ink-faint">
        <Show
          when={internal()}
          fallback={
            <span class="inline-flex min-w-0 items-center gap-2 wrap-anywhere">
              <GitHubIcon />
              {props.project.repository}
            </span>
          }
        >
          <span class="inline-flex min-w-0 items-center gap-2">Overview</span>
        </Show>
        <ArrowRightIcon class="shrink-0 transition-transform group-hover:translate-x-0.5" />
      </span>
    </CardLink>
  );
}
