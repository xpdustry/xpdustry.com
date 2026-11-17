import { withoutLocale } from "#app/i18n/localePath.ts";

const convertedBlogImages = [
  "nohorny-admin-overview-dark",
  "nohorny-admin-requests-dark",
  "nohorny-discord-alert",
  "nohorny-request-dark",
  "nohorny-site-hero-dark"
];

export const LEGACY_MEDIA_REDIRECTS: ReadonlyMap<string, string> = new Map([
  ...convertedBlogImages.map((name): [string, string] => [
    `/blog/${name}.png`,
    `/blog/${name}.webp`
  ]),
  ["/blog/nohorny-showcase-poster.jpg", "/blog/nohorny-showcase-poster.webp"],
  ["/og.png", "/og/home.png"]
]);

const BLOG_WITH_TRAILING_SLASH = /^\/blog(?:\/[^/]+)?\/$/;

export function requestRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  const media = LEGACY_MEDIA_REDIRECTS.get(url.pathname);
  if (media) {
    return new Response(null, { status: 301, headers: { location: media + url.search } });
  }

  // TanStack Router's own canonical redirect is always a 307 (router-core `load-server.ts`).
  if (BLOG_WITH_TRAILING_SLASH.test(withoutLocale(url.pathname))) {
    return new Response(null, {
      status: 308,
      headers: { location: url.pathname.slice(0, -1) + url.search }
    });
  }
}
