import { Link } from "@tanstack/react-router";
import { T, useLocale } from "gt-tanstack-start";
import logo from "#app/brand/logo.svg";
import { formatDate } from "#app/i18n/format";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import { authors } from "./content/authors";
import type { Post } from "./content/registry";
import { morphsWithItsPost } from "./morph";
import { TopicChip } from "./TopicChip";
import { topic } from "./topics";
import { themed } from "./topicTheme";
import * as card from "#app/ui/Card.css";
import * as styles from "./LeadPost.css";
import * as morph from "./morph.css";
import * as themedStyles from "./topicTheme.css";

export function LeadPost({ post, className }: { post: Post; className?: string }) {
  const locale = useLocale();
  const { title, description, author, publishedAt, hero } = post.frontmatter;
  const theme = topic(post.frontmatter.topic);
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} ${morph.card.className} ${styles.lead} ${className ?? ""}`}
      style={{ ...themed(theme), ...morphsWithItsPost(post.slug) }}
    >
      <Patches patches={seeded(theme.patches, post.slug)} />
      <span className={styles.text}>
        <span className={styles.tags}>
          <span className={`${themedStyles.pill} ${themedStyles.solid}`}>
            <T>Latest</T>
          </span>
          <TopicChip name={theme.name} tone="cover" className={morph.topic.className} />
        </span>
        <h2 className={morph.title.className}>{title}</h2>
        <p className={morph.description.className}>{description}</p>
        <span className={styles.byline}>
          <img className={themedStyles.avatar} src={authors[author].avatar} alt="" />
          {author}, <time dateTime={publishedAt}>{formatDate(publishedAt, locale)}</time>
        </span>
      </span>
      {hero ? (
        <span className={styles.shot}>
          <img src={hero} alt="" />
        </span>
      ) : (
        <img className={`${styles.logo} ${morph.art.className}`} src={theme.icon ?? logo} alt="" />
      )}
    </Link>
  );
}
