import { AskCard } from "#app/components/blog/AskCard";
import { CopyButton } from "#app/components/ui/CopyButton";
import { PlinthAnchor } from "#app/components/ui/Plinth";
import type { Post } from "#app/content/registry";
import { projectForTopic } from "#app/data/projects";
import { SITE } from "#app/data/site";
import { parseReleaseId, releaseLabel, releaseUrl } from "#app/lib/releases";
import styles from "./PostAside.module.css";

/** Beside a post: the releases it covers, a link to share, and where to ask about it. */
export function PostAside({ post, className }: { post: Post; className?: string }) {
  const { releases = [], topic, author } = post.frontmatter;
  const project = projectForTopic(topic);
  return (
    <aside className={`${styles.aside} ${className ?? ""}`}>
      {releases.length > 0 && (
        <section className={styles.panel}>
          <h2>This post covers</h2>
          {releases.map((id) => {
            const release = parseReleaseId(id);
            // the tag alone when the release belongs to the post's own project
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
      <section className={`${styles.panel} ${styles.share}`}>
        <h2>Share this post</h2>
        <CopyButton text={`${SITE.origin}/blog/${post.slug}`} label="Copy the link to this post">
          Copy link
        </CopyButton>
      </section>
      <AskCard title="Questions or feedback?" spread={0.55} compact>
        Ask in our Discord, or ping {author} there.
      </AskCard>
    </aside>
  );
}
