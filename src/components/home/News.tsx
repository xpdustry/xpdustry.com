import { PostTile } from "#app/components/blog/PostTile";
import { Tray } from "#app/components/tray/Tray";
import { posts } from "#app/content/registry";
import { BLOG_TAGLINE } from "#app/data/site";
import { Newspaper } from "#app/lib/icons";
import * as styles from "./News.css";

export function News() {
  const [latest, ...earlier] = posts.slice(0, 3);
  if (!latest) return null;
  return (
    <Tray
      id="news"
      icon={Newspaper}
      title="Latest news"
      subtitle={BLOG_TAGLINE}
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
