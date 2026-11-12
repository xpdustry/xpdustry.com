import { createFileRoute } from "@tanstack/react-router";
import { getLocale, getMessages, T, useGT, useMessages, useLocale } from "gt-tanstack-start";
import { LeadPost } from "#app/components/blog/LeadPost";
import { PostTile } from "#app/components/blog/PostTile";
import { DiscordCard } from "#app/components/site/DiscordCard";
import { Patches } from "#app/components/ui/Patches";
import { posts, translated } from "#app/content/registry";
import { PATCHES } from "#app/data/patches";
import { BLOG_DESCRIPTION, BLOG_TITLE } from "#app/data/site";
import { blogCard, seo } from "#app/lib/seo";
import * as styles from "#app/components/blog/BlogIndex.css";
import * as card from "#app/components/ui/Card.css";
import { grid } from "#app/styles/layout.css";

export const Route = createFileRoute("/blog/")({
  head: async () => {
    const m = await getMessages();
    return seo({
      locale: getLocale(),
      title: m(BLOG_TITLE),
      fullTitle: true,
      description: m(BLOG_DESCRIPTION),
      path: "/blog",
      image: blogCard(m)
    });
  },
  component: BlogIndex
});

function BlogIndex() {
  const gt = useGT();
  const m = useMessages();
  const locale = useLocale();
  const [latest, ...earlier] = posts.map((post) => translated(post, locale));
  return (
    <main id="main" className={grid}>
      <section className={`${card.card} ${styles.intro} reveal`}>
        <Patches patches={PATCHES.blogIntro} />
        <h1>
          <T>Blog</T>
        </h1>
        <p>{m(BLOG_DESCRIPTION)}</p>
      </section>
      <DiscordCard title={gt("Questions about a release?")} className={`${styles.ask} reveal`}>
        <T>Ask in our Discord.</T>
      </DiscordCard>
      {latest ? (
        <LeadPost post={latest} className={`${styles.wide} reveal`} />
      ) : (
        <p className={styles.empty}>
          <T>Nothing published yet.</T>
        </p>
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
