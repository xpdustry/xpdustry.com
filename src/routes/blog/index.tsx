import { createFileRoute } from "@tanstack/react-router";
import { AskCard } from "#app/components/blog/AskCard";
import { LeadPost } from "#app/components/blog/LeadPost";
import { PostTile } from "#app/components/blog/PostTile";
import { Texture } from "#app/components/ui/Texture";
import { posts } from "#app/content/registry";
import { BLOG_DESCRIPTION } from "#app/data/site";
import { patches } from "#app/data/textures";
import { BLOG_CARD, seo } from "#app/lib/seo";
import styles from "#app/components/blog/BlogIndex.module.css";
import card from "#app/components/ui/Card.module.css";

const INTRO_TEXTURE = patches("#86d8cf", "#a6e7e0", [
  [0.92, 0.5, 0.34, 1],
  [0.5, 1.08, 0.12, 1],
]);

export const Route = createFileRoute("/blog/")({
  head: () =>
    seo({ title: "Blog", description: BLOG_DESCRIPTION, path: "/blog", image: BLOG_CARD }),
  component: BlogIndex,
});

function BlogIndex() {
  const [latest, ...earlier] = posts;
  return (
    <main id="main" className={styles.blog}>
      <section className={`${card.card} spot ${styles.intro}`}>
        <Texture settings={INTRO_TEXTURE} drift />
        <h1>Blog</h1>
        <p>{BLOG_DESCRIPTION}</p>
      </section>
      <AskCard title="Questions about a release?" className={styles.ask} drift>
        Ask in our Discord.
      </AskCard>
      {latest ? (
        <LeadPost post={latest} className={styles.lead} />
      ) : (
        <p className={styles.empty}>Nothing published yet.</p>
      )}
      {earlier.map((post) => (
        <PostTile
          key={post.slug}
          post={post}
          variant="listing"
          heading="h2"
          className={styles.tile}
        />
      ))}
    </main>
  );
}
