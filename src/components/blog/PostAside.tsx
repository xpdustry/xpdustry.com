import { useGT } from "gt-tanstack-start";
import { DiscordCard } from "#app/components/site/DiscordCard";
import { CopyButton } from "#app/components/ui/CopyButton";
import { PlinthAnchor } from "#app/components/ui/Plinth";
import type { Post } from "#app/content/registry";
import { projectForTopic } from "#app/data/projects";
import { SITE } from "#app/data/site";
import { parseReleaseId, releaseLabel, releaseUrl } from "#app/lib/releases";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./PostAside.css";

export function PostAside({ post, className }: { post: Post; className?: string }) {
  const { releases = [], topic, author } = post.frontmatter;
  const project = projectForTopic(topic);
  const gt = useGT();
  return (
    <aside className={`${styles.aside} ${className ?? ""}`}>
      {releases.length > 0 && (
        <section className={`${card.card} ${styles.panel}`} aria-label={gt("This post covers")}>
          <p className={styles.label}>{gt("This post covers")}</p>
          {releases.map((id) => {
            const release = parseReleaseId(id);
            const label =
              release && release.repository === project?.repository
                ? release.tag
                : releaseLabel(id);
            return (
              <div key={id} className={styles.release}>
                <code>{label}</code>
                <PlinthAnchor
                  tone="ink"
                  size="sm"
                  href={releaseUrl(id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {gt("Changelog")}
                </PlinthAnchor>
              </div>
            );
          })}
        </section>
      )}
      <section
        className={`${card.card} ${styles.panel} ${styles.share}`}
        aria-label={gt("Share this post")}
      >
        <p className={styles.label}>{gt("Share this post")}</p>
        <CopyButton
          text={`${SITE.origin}/blog/${post.slug}`}
          label={gt("Copy the link to this post")}
        >
          {gt("Copy link")}
        </CopyButton>
      </section>
      <DiscordCard title={gt("Questions or feedback?")} compact>
        {gt("Ask in our Discord, or ping {author} there.", { author })}
      </DiscordCard>
    </aside>
  );
}
