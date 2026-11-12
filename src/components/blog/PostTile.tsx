import { Link } from "@tanstack/react-router";
import { TopicChip } from "#app/components/blog/TopicChip";
import { Patches } from "#app/components/ui/Patches";
import { heroImage } from "#app/content/hero";
import type { Post } from "#app/content/registry";
import { PATCHES } from "#app/data/patches";
import { seeded } from "#app/data/textures";
import { formatDate } from "#app/lib/format";
import card from "#app/components/ui/Card.module.css";
import styles from "./PostTile.module.css";

interface PostTileProps {
  post: Post;
  /** The headline of the news tray, a smaller news card, or a blog listing card with the description. */
  variant: "big" | "small" | "listing";
  /** h3 inside a tray, h2 on the blog page. */
  heading?: "h2" | "h3";
  className?: string;
}

/** A post over its hero image, which fades into the card just above the title. */
export function PostTile({ post, variant, heading: Heading = "h3", className }: PostTileProps) {
  const { title, description, topic, author, publishedAt } = post.frontmatter;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} spot ${styles.tile} ${styles[variant]} ${className ?? ""}`}
    >
      <img className={styles.photo} src={heroImage(post)} alt="" loading="lazy" decoding="async" />
      <Patches patches={seeded(PATCHES.tile, post.slug)} />
      <TopicChip name={topic} className={styles.chip} />
      <Heading className={`${styles.title} ${card.fade}`}>{title}</Heading>
      {variant === "listing" && <p className={styles.description}>{description}</p>}
      <span className={styles.byline}>
        {variant === "big" && `${author}, `}
        <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      </span>
    </Link>
  );
}
