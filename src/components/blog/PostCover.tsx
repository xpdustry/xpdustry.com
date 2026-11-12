import { Link } from "@tanstack/react-router";
import { T, useLocale, Var } from "gt-tanstack-start";
import { Patches } from "#app/components/ui/Patches";
import { authors } from "#app/content/authors";
import type { Post } from "#app/content/registry";
import { topic } from "#app/data/topics";
import { formatDate } from "#app/lib/format";
import { CaretLeft } from "#app/lib/icons";
import { postTitle } from "#app/lib/seo";
import { seeded } from "#app/lib/textures";
import { themed } from "./themed";
import { TopicChip } from "./TopicChip";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./PostCover.css";
import { avatar, pill } from "./themed.css";

export function PostCover({ post, className }: { post: Post; className?: string }) {
  const locale = useLocale();
  const { title, description, author, publishedAt, updatedAt, topicVersion } = post.frontmatter;
  const theme = topic(post.frontmatter.topic);
  const profile = authors[author];
  const chip = (
    <TopicChip
      name={theme.name}
      version={topicVersion}
      tone="cover"
      linked
      className={styles.topic}
    />
  );
  return (
    <header className={`${card.card} ${styles.cover} ${className ?? ""}`} style={themed(theme)}>
      <Patches patches={seeded(theme.patches, post.slug)} priority />
      {theme.icon && <img className={styles.logo} src={theme.icon} alt="" />}
      <div className={styles.crumbs}>
        <Link to="/blog" activeOptions={{ exact: true }} className={`${pill} ${styles.back}`}>
          <CaretLeft />
          <T>Blog</T>
        </Link>
        {postTitle(post.frontmatter) === title ? (
          <>
            {chip}
            <h1 className={styles.title}>{title}</h1>
          </>
        ) : (
          <h1 className={styles.heading}>
            {chip} <span className={styles.title}>{title}</span>
          </h1>
        )}
      </div>
      <p className={styles.description}>{description}</p>
      <div className={styles.byline}>
        <a className={pill} href={profile.url} target="_blank" rel="noreferrer">
          <img className={avatar} src={profile.avatar} alt="" />
          {author}
        </a>
        <time className={pill} dateTime={publishedAt}>
          {formatDate(publishedAt, locale)}
        </time>
        {updatedAt && (
          <span className={pill}>
            <T>
              Updated{" "}
              <time dateTime={updatedAt}>
                <Var>{formatDate(updatedAt, locale)}</Var>
              </time>
            </T>
          </span>
        )}
      </div>
    </header>
  );
}
