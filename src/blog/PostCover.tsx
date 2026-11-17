import { Link } from "@tanstack/react-router";
import { T, useGT, useLocale, Var } from "gt-tanstack-start";
import type { Teammate } from "#app/brand/team";
import { formatDate } from "#app/i18n/format";
import { ProfileButton } from "#app/status/Profile";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import { CaretLeft } from "#app/ui/icons";
import type { Post } from "./content/registry";
import { postTitle } from "./titles";
import { TopicChip } from "./TopicChip";
import { topic } from "./topics";
import { themed } from "./topicTheme";
import * as card from "#app/ui/Card.css";
import * as styles from "./PostCover.css";
import { avatar, pill } from "./topicTheme.css";

export function PostCover({
  post,
  author,
  className
}: {
  post: Post;
  author: Teammate;
  className?: string;
}) {
  const theme = topic(post.frontmatter.topic);
  return (
    <header className={`${card.card} ${styles.cover} ${className ?? ""}`} style={themed(theme)}>
      <Patches patches={seeded(theme.patches, post.slug)} />
      {theme.icon && <img className={styles.logo} src={theme.icon} alt="" />}
      <div className={styles.crumbs}>
        <Link to="/blog" activeOptions={{ exact: true }} className={`${pill} ${styles.back}`}>
          <CaretLeft />
          <T>Blog</T>
        </Link>
        <CoverTitle frontmatter={post.frontmatter} />
      </div>
      <p className={styles.description}>{post.frontmatter.description}</p>
      <Byline frontmatter={post.frontmatter} author={author} />
    </header>
  );
}

function CoverTitle({ frontmatter }: { frontmatter: Post["frontmatter"] }) {
  const { title, topic, topicVersion } = frontmatter;
  const chip = (
    <TopicChip name={topic} version={topicVersion} tone="cover" linked className={styles.topic} />
  );
  const namesItsTopic = postTitle(frontmatter) === title;
  if (namesItsTopic) {
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

function Byline({
  frontmatter: { publishedAt, updatedAt },
  author
}: {
  frontmatter: Post["frontmatter"];
  author: Teammate;
}) {
  const locale = useLocale();
  const gt = useGT();
  return (
    <div className={styles.byline}>
      <ProfileButton
        member={author}
        className={pill}
        label={gt("{name}, open profile", { name: author.name })}
      >
        {author.avatar && <img className={avatar} src={author.avatar} alt="" />}
        {author.name}
      </ProfileButton>
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
