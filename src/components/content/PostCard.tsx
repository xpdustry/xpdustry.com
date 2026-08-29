import { CardLink } from "#app/components/system/Pressable";
import { authors } from "#app/content/authors";
import type { BlogPost } from "#app/content/registry";
import { formatDate } from "#app/lib/format";
import * as styles from "#app/components/content/PostCard.css";

export function PostCard(props: { post: BlogPost }) {
  return (
    <CardLink faceClass={styles.face} href={`/blog/${props.post.slug}`}>
      <span class={styles.topic} data-topic={props.post.frontmatter.topic}>
        {props.post.frontmatter.topic}
      </span>
      <span class={styles.title}>{props.post.frontmatter.title}</span>
      <span class={styles.meta}>
        <span class={styles.author}>
          <img
            class={styles.avatar}
            src={authors[props.post.frontmatter.author].avatar}
            alt=""
            width="24"
            height="24"
          />
          <span>{props.post.frontmatter.author}</span>
        </span>
        <time class={styles.date} datetime={props.post.frontmatter.publishedAt}>
          {formatDate(props.post.frontmatter.publishedAt)}
        </time>
      </span>
    </CardLink>
  );
}
