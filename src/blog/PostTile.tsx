import { Link } from "@tanstack/react-router";
import { useLocale } from "gt-tanstack-start";
import { formatDate } from "#app/i18n/format";
import { PATCHES } from "#app/textures/cards";
import { texture } from "#app/textures/enter";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import type { Post } from "./content/registry";
import { morphsWithItsPost } from "./morph";
import { PostArt } from "./PostArt";
import { TopicChip } from "./TopicChip";
import * as card from "#app/ui/Card.css";
import * as morph from "./morph.css";
import * as styles from "./PostTile.css";

interface PostTileProps {
  post: Post;
  variant: "big" | "small" | "listing";
  heading?: "h2" | "h3";
  className?: string;
  morphs?: boolean;
}

export function PostTile({
  post,
  variant,
  heading: Heading = "h3",
  className,
  morphs = true
}: PostTileProps) {
  const locale = useLocale();
  const { title, description, topic, author, publishedAt } = post.frontmatter;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${card.card} ${morph.card.className} ${styles.tile} ${styles.variant[variant]} ${className ?? ""}`}
      style={morphs ? morphsWithItsPost(post.slug) : undefined}
    >
      <PostArt post={post} className={styles.photo} />
      <TopicChip name={topic} className={`${styles.chip} ${morph.topic.className}`} />
      <span className={styles.foot} {...texture("rise")}>
        <Patches patches={seeded(PATCHES.tile, post.slug)} />
        <Heading className={`${styles.title} ${morph.title.className}`}>{title}</Heading>
        {variant === "listing" && (
          <p className={`${styles.description} ${morph.description.className}`}>{description}</p>
        )}
        <span className={styles.byline}>
          {variant === "big" && `${author}, `}
          <time dateTime={publishedAt}>{formatDate(publishedAt, locale)}</time>
        </span>
      </span>
    </Link>
  );
}
