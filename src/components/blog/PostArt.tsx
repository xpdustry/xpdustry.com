import logo from "#app/assets/logo.svg";
import { Patches } from "#app/components/ui/Patches";
import type { Post } from "#app/content/registry";
import { topic } from "#app/data/topics";
import { seeded } from "#app/lib/textures";
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
