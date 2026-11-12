import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ChevronLeft } from "#app/components/ui/Icons";
import { Texture } from "#app/components/ui/Texture";
import { authors } from "#app/content/authors";
import type { Post } from "#app/content/registry";
import { topic } from "#app/data/topics";
import { formatDate } from "#app/lib/format";
import styles from "./PostCover.module.css";

/** The top of a post page, in its topic's colours: where it is filed, what it is, who wrote it. */
export function PostCover({ post, className }: { post: Post; className?: string }) {
  const { title, description, author, publishedAt, updatedAt } = post.frontmatter;
  const theme = topic(post.frontmatter.topic);
  const profile = authors[author];
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
      <Texture settings={theme.texture} />
      {theme.icon && <img className={styles.logo} src={theme.icon} alt="" />}
      <div className={styles.crumbs}>
        <Link to="/blog" className={styles.back}>
          <ChevronLeft />
          Blog
        </Link>
        <span className={styles.topic}>
          {theme.icon && <img src={theme.icon} alt="" />}
          {theme.name}
        </span>
      </div>
      <h1>{title}</h1>
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
