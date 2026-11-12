import { useGT, useMessages, useLocale } from "gt-tanstack-start";
import { BLOG_TAGLINE } from "#app/brand/site";
import { PostTile } from "#app/components/blog/PostTile";
import { posts, translated } from "#app/content/registry";
import { Newspaper } from "#app/ui/icons";
import { Tray } from "#app/ui/Tray";
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
