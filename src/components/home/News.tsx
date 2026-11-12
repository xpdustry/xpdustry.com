import { useGT, useMessages, useLocale } from "gt-tanstack-start";
import { PostTile } from "#app/components/blog/PostTile";
import { Tray } from "#app/components/tray/Tray";
import { posts, translated } from "#app/content/registry";
import { BLOG_TAGLINE } from "#app/data/site";
import { Newspaper } from "#app/lib/icons";
import * as styles from "./News.css";

export function News() {
  const gt = useGT();
  const m = useMessages();
  const locale = useLocale();
  const [latest, ...earlier] = posts.slice(0, 3).map((post) => translated(post, locale));
  if (!latest) return null;
  return (
    <Tray
      id="news"
      icon={Newspaper}
      title={gt("Latest news")}
      subtitle={m(BLOG_TAGLINE)}
      action={{ to: "/blog", label: gt("All posts") }}
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
