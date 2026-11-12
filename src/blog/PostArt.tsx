import logo from "#app/brand/logo.svg";
import { Patches } from "#app/textures/Patches";
import { seeded } from "#app/textures/texture";
import type { Post } from "./content/registry";
import { topic } from "./topics";
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
