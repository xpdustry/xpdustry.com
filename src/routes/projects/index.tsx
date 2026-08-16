import { For } from "solid-js";
import { ProjectCard } from "#app/components/content/ProjectCard";
import { BlobField, PAGE_HEAD_BLOBS } from "#app/components/layout/BlobField";
import { PageMeta } from "#app/components/layout/PageMeta";
import { projects } from "#app/data/projects";

/**
 * Every project, in editorial order.
 *
 * The parent of /projects/<slug>, and the page the header tab points at. The
 * home page shows the same cards, the way it shows the three latest posts:
 * one card design, one destination per project, wherever you meet it.
 */
export default function ProjectsIndex() {
  const ordered = () => [...projects].sort((a, b) => a.order - b.order);

  return (
    <>
      <PageMeta title="Projects" description="Our best open source tools." path="/projects" />
      <BlobField artwork={PAGE_HEAD_BLOBS} />

      <div class="wrap py-12 pb-24">
        <header class="mb-16 max-w-prose">
          <h1 class="text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl">Projects</h1>
          <p class="mt-4 max-w-prose text-base text-ink-muted sm:text-lg">
            Our best open source tools.
          </p>
        </header>

        <div class="project-grid grid auto-rows-fr gap-6">
          <For each={ordered()}>{(project) => <ProjectCard project={project} />}</For>
        </div>
      </div>
    </>
  );
}
