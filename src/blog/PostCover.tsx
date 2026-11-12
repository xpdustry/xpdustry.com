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
  const theme = topic(post.frontmatter.topic);
  return (
    <header className={`${card.card} ${styles.cover} ${className ?? ""}`} style={themed(theme)}>
      <Patches patches={seeded(theme.patches, post.slug)} priority />
      {theme.icon && <img className={styles.logo} src={theme.icon} alt="" />}
      <div className={styles.crumbs}>
        <Link to="/blog" activeOptions={{ exact: true }} className={`${pill} ${styles.back}`}>
          <CaretLeft />
          <T>Blog</T>
        </Link>
        <CoverTitle frontmatter={post.frontmatter} />
      </div>
      <p className={styles.description}>{post.frontmatter.description}</p>
      <Byline frontmatter={post.frontmatter} />
    </header>
  );
}

/**
 * The heading reads as the post's full title: a title that does not name its topic takes the topic
 * chip inside the heading, and one that does leaves the chip beside it.
 */
function CoverTitle({ frontmatter }: { frontmatter: Post["frontmatter"] }) {
  const { title, topic, topicVersion } = frontmatter;
  const chip = (
    <TopicChip name={topic} version={topicVersion} tone="cover" linked className={styles.topic} />
  );
  if (postTitle(frontmatter) === title) {
    return (
      <>
        {chip}
        <h1 className={styles.title}>{title}</h1>
      </>
    );
  }
  return (
    <h1 className={styles.heading}>
      {chip} <span className={styles.title}>{title}</span>
    </h1>
  );
}

function Byline({ frontmatter }: { frontmatter: Post["frontmatter"] }) {
  const locale = useLocale();
  const { author, publishedAt, updatedAt } = frontmatter;
  const profile = authors[author];
  return (
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
  );
}
