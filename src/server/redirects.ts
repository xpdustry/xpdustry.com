const convertedBlogImages = [
  "nohorny-admin-overview-dark",
  "nohorny-admin-requests-dark",
  "nohorny-discord-alert",
  "nohorny-request-dark",
  "nohorny-site-hero-dark",
];

export const LEGACY_MEDIA_REDIRECTS: ReadonlyMap<string, string> = new Map([
  ...convertedBlogImages.map((name): [string, string] => [
    `/blog/${name}.png`,
    `/blog/${name}.webp`,
  ]),
  ["/blog/nohorny-showcase-poster.jpg", "/blog/nohorny-showcase-poster.webp"],
  ["/og.png", "/og/home.png"],
]);

export function requestRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  const media = LEGACY_MEDIA_REDIRECTS.get(url.pathname);
  if (media) {
    return new Response(null, { status: 301, headers: { location: media + url.search } });
  }

  // TanStack Router would answer these with its default 307; canonical URLs are permanent.
  if (/^\/blog(?:\/[^/]+)?\/$/.test(url.pathname)) {
    return new Response(null, {
      status: 308,
      headers: { location: url.pathname.slice(0, -1) + url.search },
    });
  }
}
