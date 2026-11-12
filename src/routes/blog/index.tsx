import { createFileRoute } from "@tanstack/react-router";
import { LeadPost } from "#app/components/blog/LeadPost";
import { PostTile } from "#app/components/blog/PostTile";
import { DiscordCard } from "#app/components/site/DiscordCard";
import { Patches } from "#app/components/ui/Patches";
import { posts } from "#app/content/registry";
import { PATCHES } from "#app/data/patches";
import { BLOG_DESCRIPTION, BLOG_TITLE } from "#app/data/site";
import { BLOG_CARD, seo } from "#app/lib/seo";
import styles from "#app/components/blog/BlogIndex.module.css";
import card from "#app/components/ui/Card.module.css";

export const Route = createFileRoute("/blog/")({
  head: () =>
    seo({
      title: BLOG_TITLE,
      fullTitle: true,
      description: BLOG_DESCRIPTION,
      path: "/blog",
      image: BLOG_CARD,
    }),
  component: BlogIndex,
});

function BlogIndex() {
  const [latest, ...earlier] = posts;
  return (
    <main id="main" className={styles.blog}>
      <section className={`${card.card} spot ${styles.intro} reveal`}>
        <Patches patches={PATCHES.blogIntro} />
        <h1>Blog</h1>
        <p>{BLOG_DESCRIPTION}</p>
      </section>
      <DiscordCard title="Questions about a release?" className={`${styles.ask} reveal`}>
        Ask in our Discord.
      </DiscordCard>
      {latest ? (
        <LeadPost post={latest} className={`${styles.lead} reveal`} />
      ) : (
        <p className={styles.empty}>Nothing published yet.</p>
      )}
      {earlier.map((post) => (
        <PostTile
          key={post.slug}
          post={post}
          variant="listing"
          heading="h2"
          className={`${styles.tile} reveal`}
        />
      ))}
    </main>
  );
}
