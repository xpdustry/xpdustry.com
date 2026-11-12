import { Link } from "@tanstack/react-router";
import { useGT } from "gt-tanstack-start";
import logo from "#app/assets/logo.svg";
import { Patches } from "#app/components/ui/Patches";
import { authors } from "#app/content/authors";
import type { Post } from "#app/content/registry";
import { topic } from "#app/data/topics";
import { formatDate } from "#app/lib/format";
import { seeded } from "#app/lib/textures";
import { themed } from "./themed";
import { TopicChip } from "./TopicChip";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./LeadPost.css";
import * as themedStyles from "./themed.css";

export function LeadPost({ post, className }: { post: Post; className?: string }) {
  const { title, description, author, publishedAt, hero } = post.frontmatter;
  const theme = topic(post.frontmatter.topic);
  const gt = useGT();
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} spot ${styles.lead} ${className ?? ""}`}
      style={themed(theme)}
    >
      <Patches patches={seeded(theme.patches, post.slug)} />
      <span className={styles.text}>
        <span className={styles.tags}>
          <span className={`${themedStyles.pill} ${themedStyles.solid}`}>{gt("Latest")}</span>
          <TopicChip name={theme.name} tone="cover" />
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <span className={styles.byline}>
          <img className={themedStyles.avatar} src={authors[author].avatar} alt="" />
          {author}, <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        </span>
      </span>
      {hero ? (
        <span className={styles.shot}>
          <img src={hero} alt="" />
        </span>
      ) : (
        <img className={styles.logo} src={theme.icon ?? logo} alt="" />
      )}
    </Link>
  );
}
