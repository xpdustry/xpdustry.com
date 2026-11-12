import { createFileRoute, notFound } from "@tanstack/react-router";
import { getLocale, getMessages, useGT, useMessages, useLocale } from "gt-tanstack-start";
import { BLOG_TAGLINE } from "#app/brand/site";
import { PostAside } from "#app/components/blog/PostAside";
import { PostBody } from "#app/components/blog/PostBody";
import { PostCover } from "#app/components/blog/PostCover";
import { PostTile } from "#app/components/blog/PostTile";
import { authors } from "#app/content/authors";
import { nearbyPosts, postsBySlug, translated } from "#app/content/registry";
import { postCard, postTitle, seo } from "#app/lib/seo";
import { postStructuredData } from "#app/lib/structuredData";
import { Newspaper } from "#app/ui/icons";
import { fontPreloads } from "#app/ui/styles/fontPreloads";
import { Tray } from "#app/ui/Tray";
import * as styles from "#app/components/blog/PostPage.css";
import * as card from "#app/ui/Card.css";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = postsBySlug.get(params.slug);
    if (!post) throw notFound();
    return { document: await translated(post, getLocale()).load() };
  },
  head: async ({ params }) => {
    const original = postsBySlug.get(params.slug);
    if (!original) return {};
    const locale = getLocale();
    const post = translated(original, locale);
    const { description, publishedAt, updatedAt, author } = post.frontmatter;
    const title = postTitle(post.frontmatter);
    const head = seo({
      locale,
      title,
      description,
      path: `/blog/${post.slug}`,
      type: "article",
      image: postCard(post.slug, title),
      publishedAt,
      updatedAt,
      authorUrl: authors[author].url,
      jsonLd: postStructuredData(post, locale, await getMessages())
    });
    return { ...head, links: [...head.links, ...fontPreloads(["text"], locale)] };
  },
  component: PostPage
});

function PostPage() {
  const { slug } = Route.useParams();
  const { document } = Route.useLoaderData();
  const locale = useLocale();
  const post = translated(postsBySlug.get(slug)!, locale);
  const nearby = nearbyPosts(slug).map((other) => translated(other, locale));
  const gt = useGT();
  const m = useMessages();

  return (
    <main id="main">
      <div className={styles.post}>
        <article className={styles.article}>
          <PostCover post={post} className={`${styles.cover} reveal`} />
          <div className={`${card.card} ${styles.body} reveal`}>
            <PostBody document={document} />
          </div>
        </article>
        <PostAside post={post} className={`${styles.aside} reveal`} />
      </div>
      {nearby.length > 0 && (
        <Tray
          id="more"
          icon={Newspaper}
          title={gt("More posts")}
          subtitle={m(BLOG_TAGLINE)}
          action={{ to: "/blog", label: gt("All posts") }}
        >
          <div className={styles.more}>
            {nearby.map((other) => (
              <PostTile key={other.slug} post={other} variant="small" className={styles.tile} />
            ))}
          </div>
        </Tray>
      )}
    </main>
  );
}
