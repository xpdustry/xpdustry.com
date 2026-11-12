import { Link } from "@tanstack/react-router";
import { PostArt } from "#app/components/blog/PostArt";
import { TopicChip } from "#app/components/blog/TopicChip";
import { Patches } from "#app/components/ui/Patches";
import type { Post } from "#app/content/registry";
import { PATCHES } from "#app/data/patches";
import { seeded } from "#app/data/textures";
import { formatDate } from "#app/lib/format";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./PostTile.css";

interface PostTileProps {
  post: Post;
  /** The headline of the news tray, a smaller news card, or a blog listing card with the description. */
  variant: "big" | "small" | "listing";
  /** h3 inside a tray, h2 on the blog page. */
  heading?: "h2" | "h3";
  className?: string;
}

/**
 * A post over its hero image, or its art, with the card rising over it in a frayed edge from just
 * above the title. The card's patches keep to the card: they never spread up into the photo.
 */
export function PostTile({ post, variant, heading: Heading = "h3", className }: PostTileProps) {
  const { title, description, topic, author, publishedAt } = post.frontmatter;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} spot ${styles.tile} ${styles.variant[variant]} ${className ?? ""}`}
    >
      <PostArt post={post} className={styles.photo} />
      <TopicChip name={topic} className={styles.chip} />
      <span className={styles.foot}>
        <Patches patches={seeded(PATCHES.tile, post.slug)} />
        <Heading className={styles.title}>{title}</Heading>
        {variant === "listing" && <p className={styles.description}>{description}</p>}
        <span className={styles.byline}>
          {variant === "big" && `${author}, `}
          <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        </span>
      </span>
    </Link>
  );
}
