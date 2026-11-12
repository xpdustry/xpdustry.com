import { PostTile } from "#app/components/blog/PostTile";
import { Tray } from "#app/components/tray/Tray";
import { Newspaper } from "#app/lib/icons";
import { posts } from "#app/content/registry";
import * as styles from "./News.css";

/** The latest post as the headline, and the two before it. */
export function News() {
  const [latest, ...earlier] = posts.slice(0, 3);
  if (!latest) return null;
  return (
    <Tray
      id="news"
      icon={Newspaper}
      title="Latest news"
      subtitle="Release notes and updates from the team"
      action={{ to: "/blog", label: "All posts" }}
    >
      <div className={styles.posts}>
        <PostTile post={latest} variant="big" className={styles.big} />
        {earlier.map((post) => (
          <PostTile key={post.slug} post={post} variant="small" className={styles.small} />
        ))}
      </div>
    </Tray>
  );
}
