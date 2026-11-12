import { msg } from "gt-tanstack-start";
import type { BlogFrontmatter } from "./content/schema";

export const BLOG_TITLE = msg("Xpdustry blog: Mindustry plugin news, guides and release notes");
export const BLOG_TAGLINE = msg("Release notes, guides and articles");
export const BLOG_DESCRIPTION = msg(
  "Release notes, guides and articles about Xpdustry Mindustry mods and plugins."
);

export function postTitle({
  title,
  topic,
  topicVersion
}: Pick<BlogFrontmatter, "title" | "topic" | "topicVersion">): string {
  if (title.toLowerCase().includes(topic.toLowerCase())) return title;
  return `${topicLabel(topic, topicVersion)} ${title}`;
}

/** A topic as its chip names it: "NoHorny 4", or "NoHorny" when the post gives no version. */
export function topicLabel(topic: string, version?: string): string {
  return version ? `${topic} ${version}` : topic;
}
