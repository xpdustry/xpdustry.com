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
  return (
    <aside className={`${styles.aside} ${className ?? ""}`}>
      {releases.length > 0 && (
        <section className={`${card.card} ${styles.panel}`} aria-label="This post covers">
          <p className={styles.label}>This post covers</p>
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
                  Changelog
                </PlinthAnchor>
              </div>
            );
          })}
        </section>
      )}
      <section
        className={`${card.card} ${styles.panel} ${styles.share}`}
        aria-label="Share this post"
      >
        <p className={styles.label}>Share this post</p>
        <CopyButton text={`${SITE.origin}/blog/${post.slug}`} label="Copy the link to this post">
          Copy link
        </CopyButton>
      </section>
      <DiscordCard title="Questions or feedback?" compact>
        Ask in our Discord, or ping {author} there.
      </DiscordCard>
    </aside>
  );
}
