import { Link } from "@tanstack/react-router";
import { TopicChip } from "#app/components/blog/TopicChip";
import { Texture } from "#app/components/ui/Texture";
import { heroImage } from "#app/content/hero";
import type { Post } from "#app/content/registry";
import { wave } from "#app/data/textures";
import { formatDate, unitHash } from "#app/lib/format";
import card from "#app/components/ui/Card.module.css";
import styles from "./PostTile.module.css";

const VARIANTS = {
  /** The headline of the news tray. */
  big: { fit: [20, 110], amplitude: 0.06, periods: 0.85 },
  /** A smaller news card: title and date. */
  small: { fit: [16, 70], amplitude: 0.07, periods: 0.8 },
  /** A blog listing card, with the post's description. */
  listing: { fit: [18, 90], amplitude: 0.06, periods: 0.8 },
} as const;

interface PostTileProps {
  post: Post;
  variant: keyof typeof VARIANTS;
  /** h3 inside a tray, h2 on the blog page. */
  heading?: "h2" | "h3";
  className?: string;
}

/** A post over its hero image, which fades into the card in a wave just above the title. */
export function PostTile({ post, variant, heading: Heading = "h3", className }: PostTileProps) {
  const { title, description, topic, author, publishedAt } = post.frontmatter;
  const { fit, amplitude, periods } = VARIANTS[variant];

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} spot ${styles.tile} ${styles[variant]} ${className ?? ""}`}
    >
      <img className={styles.photo} src={heroImage(post)} alt="" />
      <Texture settings={wave(fit, [amplitude, periods, unitHash(post.slug)])} />
      <TopicChip name={topic} className={styles.chip} />
      <Heading className={styles.title}>{title}</Heading>
      {variant === "listing" && <p className={styles.description}>{description}</p>}
      <span className={styles.byline}>
        {variant === "big" && `${author}, `}
        <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      </span>
    </Link>
  );
}
