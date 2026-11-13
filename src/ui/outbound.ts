/**
 * Where Xpdustry and its staff read who sent their visitors: its own sites and GitHub
 * organisation, and the GitHub accounts of its staff. They may know a visitor came from this
 * site.
 */
const OURS = [/^([\w-]+\.)*xpdustry\.com$/, /^github\.com\/(xpdustry|phinner|zetamap)$/];

/** The host of an address, with the account for a site that hosts many, in lower case. */
function owner(href: string): string {
  const [, host = "", account = ""] =
    /^https?:\/\/([^/:?#]+)(?::\d+)?(?:\/([^/?#]+))?/.exec(href.toLowerCase()) ?? [];
  return host === "github.com" && account ? `${host}/${account}` : host;
}

/**
 * What a link needs when it leaves the site: it opens in a new tab, so the visitor keeps their
 * place, and the page it opens gets no hold on this one. Any other site is not told where the
 * visitor came from either. Spread it on the anchor. A link within the site, to a section or to
 * a mail address gets nothing.
 */
export function outbound(href: string | undefined) {
  if (!/^https?:\/\//.test(href ?? "")) return {};
  return {
    target: "_blank",
    rel: OURS.some((ours) => ours.test(owner(href!))) ? "noopener" : "noreferrer"
  } as const;
}
