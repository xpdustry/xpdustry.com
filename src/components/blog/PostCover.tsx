import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { CaretLeft } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import { authors } from "#app/content/authors";
import type { Post } from "#app/content/registry";
import { seeded } from "#app/data/textures";
import { topic } from "#app/data/topics";
import { formatDate } from "#app/lib/format";
import { postTitle } from "#app/lib/seo";
import styles from "./PostCover.module.css";

/** The top of a post page, in its topic's colours: where it is filed, what it is, who wrote it. */
export function PostCover({ post, className }: { post: Post; className?: string }) {
  const { title, description, author, publishedAt, updatedAt } = post.frontmatter;
  const theme = topic(post.frontmatter.topic);
  const profile = authors[author];
  const TopicTag = theme.website ? "a" : "span";
  const topicChip = (
    <TopicTag className={styles.topic} href={theme.website}>
      {theme.icon && <img src={theme.icon} alt="" />}
      {[theme.name, post.frontmatter.topicVersion].filter(Boolean).join(" ")}
    </TopicTag>
  );
  return (
    <header
      className={`${styles.cover} ${className ?? ""}`}
      style={
        {
          background: theme.ground,
          "--muted": theme.muted,
          "--accent": theme.accent,
        } as CSSProperties
      }
    >
      <Patches patches={seeded(theme.patches, post.slug)} />
      {theme.icon && <img className={styles.logo} src={theme.icon} alt="" />}
      <div className={styles.crumbs}>
        <Link to="/blog" activeOptions={{ exact: true }} className={styles.back}>
          <CaretLeft />
          Blog
        </Link>
        {postTitle(post.frontmatter) === title ? (
          <>
            {topicChip}
            <h1 className={styles.title}>{title}</h1>
          </>
        ) : (
          <h1 className={styles.heading}>
            {topicChip} <span className={styles.title}>{title}</span>
          </h1>
        )}
      </div>
      <p className={styles.description}>{description}</p>
      <div className={styles.byline}>
        <a href={profile.url} target="_blank" rel="noreferrer">
          <img src={profile.avatar} alt="" />
          {author}
        </a>
        <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        {updatedAt && (
          <span>
            Updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
          </span>
        )}
      </div>
    </header>
  );
}
