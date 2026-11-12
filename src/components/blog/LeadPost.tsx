import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import logo from "#app/assets/logo.svg";
import { Patches } from "#app/components/ui/Patches";
import { authors } from "#app/content/authors";
import type { Post } from "#app/content/registry";
import { seeded } from "#app/data/textures";
import { topic } from "#app/data/topics";
import { formatDate } from "#app/lib/format";
import card from "#app/components/ui/Card.module.css";
import styles from "./LeadPost.module.css";

/**
 * The newest post, across the whole blog page, in its topic's colours with its hero beside it, or
 * where it has none, its project's logo.
 */
export function LeadPost({ post, className }: { post: Post; className?: string }) {
  const { title, description, author, publishedAt } = post.frontmatter;
  const theme = topic(post.frontmatter.topic);
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} spot ${styles.lead} ${className ?? ""}`}
      style={
        {
          background: theme.ground,
          "--muted": theme.muted,
          "--accent": theme.accent,
          "--accent-ink": theme.chip.color,
        } as CSSProperties
      }
    >
      <Patches patches={seeded(theme.patches, post.slug)} />
      <span className={styles.text}>
        <span className={styles.tags}>
          <span>Latest</span>
          <span>
            {theme.icon && <img src={theme.icon} alt="" />}
            {theme.name}
          </span>
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <span className={styles.byline}>
          <img src={authors[author].avatar} alt="" />
          {author}, <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        </span>
      </span>
      {post.frontmatter.hero ? (
        <span className={styles.shot}>
          <img src={post.frontmatter.hero} alt="" />
        </span>
      ) : (
        <img className={styles.logo} src={theme.icon ?? logo} alt="" />
      )}
    </Link>
  );
}
