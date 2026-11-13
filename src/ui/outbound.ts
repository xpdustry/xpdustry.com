import team from "../brand/team.json" with { type: "json" };

/**
 * Where Xpdustry and its team read who sent their visitors: its own sites and GitHub
 * organisation, and the GitHub account and site `team.json` gives each teammate. They may know a
 * visitor came from this site.
 */
const XPDUSTRY = /^([\w-]+\.)*xpdustry\.com$/;

/** The host of an address, with the account for a site that hosts many, in lower case. */
function owner(href: string): string {
  const [, host = "", account = ""] =
    /^https?:\/\/([^/:?#]+)(?::\d+)?(?:\/([^/?#]+))?/.exec(href.toLowerCase()) ?? [];
  return host === "github.com" && account ? `${host}/${account}` : host;
}

const TEAM = new Set([
  "github.com/xpdustry",
  ...Object.values(team as Record<string, { github?: string; website?: string }>)
    .flatMap(({ github, website }) => [github, website])
    .filter((href) => href !== undefined)
    .map(owner)
]);

const ours = (href: string) => {
  const site = owner(href);
  return XPDUSTRY.test(site) || TEAM.has(site);
};

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
    rel: ours(href!) ? "noopener" : "noreferrer"
  } as const;
}
