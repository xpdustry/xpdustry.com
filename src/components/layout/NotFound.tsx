import { BlobField, SPARSE_BLOBS } from "#app/components/layout/BlobField";
import { HttpStatus } from "#app/components/layout/HttpStatus";
import { PageMeta } from "#app/components/layout/PageMeta";
import { ButtonLink } from "#app/components/system/Pressable";

/**
 * The branded 404, and the only one on the site.
 *
 * The catch-all route renders it for a path nothing matches. A dynamic route
 * renders it for a slug that matched the pattern but names no content, which
 * the catch-all never sees: /blog/no-such-post is a blog route as far as the
 * router is concerned. Same page either way, because to a reader who followed
 * a stale link the difference does not exist.
 */
export function NotFound() {
  return (
    <>
      <HttpStatus code={404} />
      <PageMeta
        title="Page not found"
        description="That page does not exist on the Xpdustry site."
        path="/404"
      />
      <BlobField artwork={SPARSE_BLOBS} />
      <div class="wrap py-32 text-center">
        <p class="font-mono text-5xl leading-none font-bold tracking-tighter text-ink-faint sm:text-8xl">
          404
        </p>
        <h1 class="mt-4 text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl">
          Oh no, this page does not exist
        </h1>
        <p class="mx-auto mt-4 max-w-prose text-base text-ink-muted sm:text-lg">
          Here's the way back.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink variant="accent" href="/">
            Home
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
