import mender from "#app/assets/mindustry/mender.png";
import { PostTile } from "#app/components/blog/PostTile";
import { Tray } from "#app/components/tray/Tray";
import { posts } from "#app/content/registry";
import styles from "./News.module.css";

/** The latest post as the headline, and the two before it. */
export function News() {
  const [latest, ...earlier] = posts.slice(0, 3);
  if (!latest) return null;
  return (
    <Tray
      id="news"
      icon={mender}
      title="Latest news"
      subtitle="Release notes and updates from the team"
      action={{ to: "/blog", label: "All posts" }}
    >
      <div className={styles.grid}>
        <PostTile post={latest} variant="big" className={styles.big} />
        {earlier.map((post) => (
          <PostTile key={post.slug} post={post} variant="small" className={styles.small} />
        ))}
      </div>
    </Tray>
  );
}
