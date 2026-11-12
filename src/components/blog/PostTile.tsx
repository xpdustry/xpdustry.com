import { Link } from "@tanstack/react-router";
import { useLocale } from "gt-tanstack-start";
import { PostArt } from "#app/components/blog/PostArt";
import { TopicChip } from "#app/components/blog/TopicChip";
import type { Post } from "#app/content/registry";
import { formatDate } from "#app/i18n/format";
import { PATCHES } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import * as card from "#app/ui/Card.css";
import * as styles from "./PostTile.css";

interface PostTileProps {
  post: Post;
  variant: "big" | "small" | "listing";
  heading?: "h2" | "h3";
  className?: string;
}

export function PostTile({ post, variant, heading: Heading = "h3", className }: PostTileProps) {
  const locale = useLocale();
  const { title, description, topic, author, publishedAt } = post.frontmatter;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} ${styles.tile} ${styles.variant[variant]} ${className ?? ""}`}
    >
      <PostArt post={post} className={styles.photo} />
      <TopicChip name={topic} className={styles.chip} />
      <span className={styles.foot}>
        <Patches patches={seeded(PATCHES.tile, post.slug)} />
        <Heading className={styles.title}>{title}</Heading>
        {variant === "listing" && <p className={styles.description}>{description}</p>}
        <span className={styles.byline}>
          {variant === "big" && `${author}, `}
          <time dateTime={publishedAt}>{formatDate(publishedAt, locale)}</time>
        </span>
      </span>
    </Link>
  );
}
