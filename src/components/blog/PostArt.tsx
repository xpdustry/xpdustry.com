import logo from "#app/assets/logo.svg";
import type { Post } from "#app/content/registry";
import { topic } from "#app/data/topics";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import * as styles from "./PostArt.css";

export function PostArt({ post, className }: { post: Post; className?: string }) {
  const { hero, topic: name } = post.frontmatter;
  if (hero) {
    return <img className={className} src={hero} alt="" loading="lazy" decoding="async" />;
  }
  const theme = topic(name);
  return (
    <span className={`${styles.art} ${className ?? ""}`} style={{ background: theme.ground }}>
      <Patches patches={seeded(theme.patches, post.slug)} />
      <img className={styles.logo} src={theme.icon ?? logo} alt="" />
    </span>
  );
}
