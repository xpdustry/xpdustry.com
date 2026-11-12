import { Link } from "@tanstack/react-router";
import { T, useLocale, Var } from "gt-tanstack-start";
import { formatDate } from "#app/i18n/format";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import { CaretLeft } from "#app/ui/icons";
import { authors } from "./content/authors";
import type { Post } from "./content/registry";
import { postTitle } from "./titles";
import { TopicChip } from "./TopicChip";
import { topic } from "./topics";
import { themed } from "./topicTheme";
import * as card from "#app/ui/Card.css";
import * as styles from "./PostCover.css";
import { avatar, pill } from "./topicTheme.css";

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
