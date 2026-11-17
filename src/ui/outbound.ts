import team from "../brand/team.json" with { type: "json" };

const WEB_ADDRESS = /^https?:\/\//;
const XPDUSTRY_HOST = /^([\w-]+\.)*xpdustry\.com$/;

function owner(href: string): string {
  const [, host = "", account = ""] =
    /^https?:\/\/([^/:?#]+)(?::\d+)?(?:\/([^/?#]+))?/.exec(href.toLowerCase()) ?? [];
  return host === "github.com" && account ? `${host}/${account}` : host;
}

const TEAM_OWNERS = new Set([
  "github.com/xpdustry",
  ...Object.values(team as Record<string, { github?: string; website?: string }>)
    .flatMap(({ github, website }) => [github, website])
    .filter((href) => href !== undefined)
    .map(owner)
]);

const ours = (href: string) => {
  const site = owner(href);
  return XPDUSTRY_HOST.test(site) || TEAM_OWNERS.has(site);
};

export function outbound(href: string | undefined) {
  if (href === undefined || !WEB_ADDRESS.test(href)) return {};
  return {
    target: "_blank",
    rel: ours(href) ? "noopener" : "noreferrer"
  } as const;
}
