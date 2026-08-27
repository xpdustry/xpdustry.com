import { ArrowRightIcon } from "#app/components/system/Icons";
import { CardLink } from "#app/components/system/Pressable";
import { projectIcon, repositoryUrl, type ProjectDefinition } from "#app/data/projects";

export interface ProjectCardProps {
  project: ProjectDefinition;
  /** The one-line row the home page stacks in a column. */
  compact?: boolean;
}

/**
 * A project, as a card you press.
 *
 * One card, one destination: the repository on GitHub. Everything on the card
 * is editorial and local: no version, and so nothing to poll. The current
 * release is one click away on the repository, which is where it is
 * authoritative anyway.
 */
export function ProjectCard(props: ProjectCardProps) {
  const icon = () => projectIcon(props.project);

  const mark = (size: string) => (
    <span
      class={`grid ${size} shrink-0 place-items-center rounded-xl border-2 border-line-soft bg-page-sunk p-2`}
    >
      <img
        class={["max-h-full max-w-full", icon().fallback ? "dark:invert" : undefined]}
        src={icon().src}
        alt=""
        width="40"
        height="40"
      />
    </span>
  );

  if (props.compact) {
    return (
      <CardLink
        class="group block h-full"
        faceClass="flex items-center gap-3 p-4 text-left"
        href={repositoryUrl(props.project)}
        rel="noreferrer"
      >
        {mark("size-11")}
        <span class="grid min-w-0 gap-0.5">
          <span class="text-base font-bold text-ink">{props.project.name}</span>
          <span class="text-sm text-ink-muted">{props.project.summary}</span>
        </span>
        <ArrowRightIcon class="ml-auto shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
      </CardLink>
    );
  }

  return (
    <CardLink
      class="group h-full"
      faceClass="relative flex flex-col items-stretch justify-start gap-3 overflow-hidden p-6 text-left"
      href={repositoryUrl(props.project)}
      rel="noreferrer"
    >
      <span class="flex items-center gap-4">
        {mark("size-14")}
        <span class="text-xl font-bold text-ink sm:text-2xl">{props.project.name}</span>
      </span>

      <span class="text-sm text-ink-muted">{props.project.summary}</span>
    </CardLink>
  );
}
