import { createFileRoute } from "@tanstack/react-router";
import { getMessages, useGT, useMessages } from "gt-tanstack-start";
import { LeadPost } from "#app/components/blog/LeadPost";
import { PostTile } from "#app/components/blog/PostTile";
import { DiscordCard } from "#app/components/site/DiscordCard";
import { Patches } from "#app/components/ui/Patches";
import { posts } from "#app/content/registry";
import { PATCHES } from "#app/data/patches";
import { BLOG_DESCRIPTION, BLOG_TITLE } from "#app/data/site";
import { BLOG_CARD, seo } from "#app/lib/seo";
import * as styles from "#app/components/blog/BlogIndex.css";
import * as card from "#app/components/ui/Card.css";
import { grid } from "#app/styles/layout.css";

export const Route = createFileRoute("/blog/")({
  head: async () => {
    const m = await getMessages();
    return seo({
      title: m(BLOG_TITLE),
      fullTitle: true,
      description: m(BLOG_DESCRIPTION),
      path: "/blog",
      image: BLOG_CARD,
    });
  },
  component: BlogIndex,
});

function BlogIndex() {
  const gt = useGT();
  const m = useMessages();
  const [latest, ...earlier] = posts;
  return (
    <main id="main" className={grid}>
      <section className={`${card.card} spot ${styles.intro} reveal`}>
        <Patches patches={PATCHES.blogIntro} />
        <h1>{gt("Blog")}</h1>
        <p>{m(BLOG_DESCRIPTION)}</p>
      </section>
      <DiscordCard title={gt("Questions about a release?")} className={`${styles.ask} reveal`}>
        {gt("Ask in our Discord.")}
      </DiscordCard>
      {latest ? (
        <LeadPost post={latest} className={`${styles.wide} reveal`} />
      ) : (
        <p className={styles.empty}>{gt("Nothing published yet.")}</p>
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
