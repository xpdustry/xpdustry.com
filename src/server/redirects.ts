// Public files from the previous site that now have a different URL. The other public URLs
// (including the MP4 and icons) still exist and need no redirect.
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

/** Shared by the app entry and the static-file server, before either handles the request. */
export function requestRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  const media = LEGACY_MEDIA_REDIRECTS.get(url.pathname);
  if (media) {
    return new Response(null, { status: 301, headers: { location: media + url.search } });
  }

  // The router normalizes these to slashless URLs with a default 307. Canonical page URLs
  // are permanent; handle them before routing and preserve the original query encoding.
  if (/^\/blog(?:\/[^/]+)?\/$/.test(url.pathname)) {
    return new Response(null, {
      status: 308,
      headers: { location: url.pathname.slice(0, -1) + url.search },
    });
  }
}
