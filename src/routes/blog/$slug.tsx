import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostAside } from "#app/components/blog/PostAside";
import { PostBody } from "#app/components/blog/PostBody";
import { PostCover } from "#app/components/blog/PostCover";
import { PostTile } from "#app/components/blog/PostTile";
import { Tray } from "#app/components/tray/Tray";
import { Newspaper } from "#app/components/ui/Icons";
import { authors } from "#app/content/authors";
import { nearbyPosts, postsBySlug } from "#app/content/registry";
import { postCard, seo } from "#app/lib/seo";
import styles from "#app/components/blog/PostPage.module.css";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = postsBySlug.get(params.slug);
    if (!post) throw notFound();
    return { document: await post.load() };
  },
  head: ({ params }) => {
    const post = postsBySlug.get(params.slug);
    if (!post) return {};
    const { title, description, publishedAt, updatedAt, author } = post.frontmatter;
    return seo({
      title,
      description,
      path: `/blog/${post.slug}`,
      type: "article",
      image: postCard(post.slug, title),
      publishedAt,
      updatedAt,
      authorUrl: authors[author].url,
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
    <>
      <main id="main" className={styles.post}>
        <PostCover post={post} className={`${styles.cover} reveal`} />
        <article className={`${styles.article} reveal`}>
          <PostBody document={document} />
        </article>
        <PostAside post={post} className="reveal" />
      </main>
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
    </>
  );
}
