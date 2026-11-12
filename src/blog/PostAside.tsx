import { T, useGT } from "gt-tanstack-start";
import { projectForTopic } from "#app/brand/projects";
import { SITE } from "#app/brand/site";
import { DiscordCard } from "#app/status/DiscordCard";
import { CopyButton } from "#app/ui/copy/CopyButton";
import { PlinthAnchor } from "#app/ui/Plinth";
import type { Post } from "./content/registry";
import { releaseLabel, releaseUrl } from "./releases";
import * as card from "#app/ui/Card.css";
import * as styles from "./PostAside.css";

export function PostAside({ post, className }: { post: Post; className?: string }) {
  const { releases = [], topic, author } = post.frontmatter;
  const project = projectForTopic(topic);
  const gt = useGT();
  return (
    <aside className={`${styles.aside} ${className ?? ""}`}>
      {releases.length > 0 && (
        <section className={`${card.card} ${styles.panel}`} aria-label={gt("This post covers")}>
          <p className={styles.label}>
            <T>This post covers</T>
          </p>
          {releases.map((id) => (
            <div key={id} className={styles.release}>
              <code>{releaseLabel(id, project?.repository)}</code>
              <PlinthAnchor
                tone="ink"
                size="sm"
                href={releaseUrl(id)}
                target="_blank"
                rel="noreferrer"
              >
                <T>Changelog</T>
              </PlinthAnchor>
            </div>
          ))}
        </section>
      )}
      <section
        className={`${card.card} ${styles.panel} ${styles.share}`}
        aria-label={gt("Share this post")}
      >
        <p className={styles.label}>
          <T>Share this post</T>
        </p>
        <CopyButton
          text={`${SITE.origin}/blog/${post.slug}`}
          label={gt("Copy the link to this post")}
        >
          <T>Copy link</T>
        </CopyButton>
      </section>
      <DiscordCard title={gt("Questions or feedback?")} compact>
        {gt("Ask in our Discord, or ping {author} there.", { author })}
      </DiscordCard>
    </aside>
  );
}
