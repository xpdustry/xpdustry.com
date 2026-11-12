import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostAside } from "#app/components/blog/PostAside";
import { PostBody } from "#app/components/blog/PostBody";
import { PostCover } from "#app/components/blog/PostCover";
import { PostTile } from "#app/components/blog/PostTile";
import { Tray } from "#app/components/tray/Tray";
import { Newspaper } from "#app/lib/icons";
import { authors } from "#app/content/authors";
import { nearbyPosts, postsBySlug } from "#app/content/registry";
import { postCard, postTitle, seo } from "#app/lib/seo";
import { postStructuredData } from "#app/lib/structuredData";
import * as styles from "#app/components/blog/PostPage.css";
import * as card from "#app/components/ui/Card.css";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = postsBySlug.get(params.slug);
    if (!post) throw notFound();
    return { document: await post.load() };
  },
  head: ({ params }) => {
    const post = postsBySlug.get(params.slug);
    if (!post) return {};
    const { description, publishedAt, updatedAt, author } = post.frontmatter;
    const title = postTitle(post.frontmatter);
    return seo({
      title,
      description,
      path: `/blog/${post.slug}`,
      type: "article",
      image: postCard(post.slug, title),
      publishedAt,
      updatedAt,
      authorUrl: authors[author].url,
      jsonLd: postStructuredData(post),
    });
  },
  component: PostPage,
});

function PostPage() {
  const { slug } = Route.useParams();
  const { document } = Route.useLoaderData();
  const post = postsBySlug.get(slug)!;
  const nearby = nearbyPosts(slug);

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
          title="More posts"
          subtitle="Release notes and updates from the team"
          action={{ to: "/blog", label: "All posts" }}
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
