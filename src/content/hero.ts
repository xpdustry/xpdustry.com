import shot1 from "#app/assets/screenshots/shot1.webp";
import shot2 from "#app/assets/screenshots/shot2.webp";
import shot3 from "#app/assets/screenshots/shot3.webp";
import { posts, type Post } from "#app/content/registry";

const FALLBACKS = [shot3, shot2, shot1] as const;

// Posts without a hero of their own take turns, oldest first, so a new post never reshuffles them.
const fallbacks = new Map(
  posts
    .filter((post) => !post.frontmatter.hero)
    .reverse()
    .map((post, index) => [post.slug, FALLBACKS[index % FALLBACKS.length]!]),
);

/** The image behind a post on its cards: its own `hero`, or a game screenshot. */
export function heroImage(post: Post): string {
  return post.frontmatter.hero ?? fallbacks.get(post.slug)!;
}
