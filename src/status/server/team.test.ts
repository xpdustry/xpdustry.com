import { encode } from "fast-png";
import { describe, expect, test, vi } from "vitest";
import { fetchTeam, teamConfig, type TeamConfig } from "./team";

const PHINNER = "330298929331699713";
const MADNESS = "490644943606644737";
const STRANGER = "100000000000000001";
const GUEST = "100000000000000002";
const IDLE = "100000000000000003";

const user = (id: string, extra: object = {}) => ({
  id,
  username: `user${id.slice(-1)}`,
  ...extra
});

const MEMBERS = [
  { user: user(PHINNER, { avatar: "abc" }), nick: "the boss", roles: ["owner-role", "admin-role"] },
  {
    user: user(MADNESS, { global_name: "Madness", avatar: "ghi" }),
    roles: ["admin-role", "mod-role"]
  },
  { user: user(STRANGER, { global_name: "Stranger" }), nick: "Strange", roles: ["mod-role"] },
  { user: user(GUEST), roles: [] },
  { user: user(IDLE, { global_name: "Idle" }), roles: ["admin-role"] }
];

/** How many messages each has written lately: Idle none, and Stranger's are not indexed yet. */
const RECENT: Record<string, number | undefined> = { [PHINNER]: 12, [MADNESS]: 3, [IDLE]: 0 };

const PROFILES: Record<string, object> = {
  [PHINNER]: user(PHINNER, { banner: "def", banner_color: "#123456" }),
  [MADNESS]: user(MADNESS, { avatar: "ghi" }),
  [STRANGER]: user(STRANGER, { accent_color: 0x00ff7f }),
  [IDLE]: user(IDLE)
};

/** A Discord face, in red where it is a teammate's own and blue where it is Discord's default. */
function face(url: URL): Response {
  const colour = url.pathname.startsWith("/embed/") ? [0, 0, 255, 255] : [255, 0, 0, 255];
  if (url.search !== "?size=16" && !url.pathname.startsWith("/embed/")) {
    return new Response(null, { status: 404 });
  }
  const data = new Uint8Array([...colour, ...colour]);
  return new Response(Buffer.from(encode({ width: 2, height: 1, channels: 4, data })));
}

/** Where a fetch was sent. */
const urlOf = (input: RequestInfo | URL) => new URL(input instanceof Request ? input.url : input);

/** The API paths asked of a Discord, in order. */
const asked = (fetchImpl: typeof fetch) =>
  vi
    .mocked(fetchImpl)
    .mock.calls.map(([input]) => urlOf(input))
    .filter((url) => url.host === "discord.com")
    .map((url) => url.pathname.replace("/api/v10", ""));

function discord(answer?: (path: string) => Response | undefined): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = urlOf(input);
    if (url.host === "cdn.discordapp.com") return face(url);
    const path = url.pathname.replace("/api/v10", "");
    const special = answer?.(path);
    if (special) return special;
    if (path === "/guilds/1/members") return Response.json(MEMBERS);
    if (path === "/guilds/1/messages/search") {
      const total = RECENT[url.searchParams.get("author_id")!];
      return total === undefined
        ? Response.json({ message: "Index not yet available", code: 110000 }, { status: 202 })
        : Response.json({ total_results: total, messages: [] });
    }
    const profile = PROFILES[path.replace("/users/", "")];
    return profile ? Response.json(profile) : Response.json({}, { status: 404 });
  });
}

const config: TeamConfig = {
  token: "token",
  guild: "1",
  roles: new Map([
    ["owner-role", "owner"],
    ["admin-role", "admin"],
    ["mod-role", "moderator"]
  ]),
  activeDays: 90
};

const signal = new AbortController().signal;

describe("the team on Discord", () => {
  test("reads the role IDs of each tag from the environment", () => {
    expect(teamConfig({})).toBeUndefined();
    expect(
      teamConfig({
        XPD_DISCORD_TOKEN: "token",
        XPD_DISCORD_GUILD: "1",
        XPD_TEAM_ROLE_ADMIN: "2, 3",
        XPD_TEAM_ROLE_MODERATOR: "4"
      })
    ).toEqual({
      token: "token",
      guild: "1",
      roles: new Map([
        ["2", "admin"],
        ["3", "admin"],
        ["4", "moderator"]
      ]),
      activeDays: 90
    });
    expect(
      teamConfig({ XPD_DISCORD_TOKEN: "token", XPD_DISCORD_GUILD: "1", XPD_TEAM_ACTIVE_DAYS: "30" })
    ).toMatchObject({ activeDays: 30 });
  });

  test("lists whoever holds a role and spoke lately by their highest, with team.json on top", async () => {
    const team = await fetchTeam(config, signal, discord());

    expect(team.map(({ name, tags }) => [name, tags])).toEqual([
      ["phinner", ["owner", "developer"]],
      // team.json has people Discord gives no role to, and ranks ZetaMap an owner.
      ["ZetaMap", ["owner", "developer"]],
      ["Maxou", ["developer"]],
      // Madness holds the moderator role too, but shows only the higher one.
      ["Madness", ["admin"]],
      ["Strange", ["moderator"]]
    ]);
    // Idle holds the admin role, but has not written in 90 days.
    expect(team.map(({ name }) => name)).not.toContain("Idle");
    expect(team[0]).toMatchObject({
      avatar: `https://cdn.discordapp.com/avatars/${PHINNER}/abc.webp?size=128`,
      banner: `https://cdn.discordapp.com/banners/${PHINNER}/def.webp?size=480`,
      accent: "#123456",
      github: "https://github.com/phinner"
    });
    // Without a banner or a colour of their own, the colour of their face, or of Discord's.
    expect(team.find(({ name }) => name === "Madness")?.accent).toBe("#ff0000");
    // The colour they chose, which Discord gives as a number.
    expect(team.at(-1)?.accent).toBe("#00ff7f");
    expect(team.at(-1)?.avatar).toMatch(
      /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/\d\.png$/
    );
  });

  test("keeps whoever team.json names and tags, with their roles, however quiet", async () => {
    const fetchImpl = discord((path) =>
      path === "/guilds/1/messages/search" ? Response.json({ total_results: 0 }) : undefined
    );

    const team = await fetchTeam(config, signal, fetchImpl);

    expect(team.map(({ name, tags }) => [name, tags])).toEqual([
      ["phinner", ["owner", "developer"]],
      ["ZetaMap", ["owner", "developer"]],
      ["Maxou", ["developer"]]
    ]);
  });

  test("keeps someone whose search or profile Discord refuses, without what it would add", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = discord((path) =>
      path === `/users/${MADNESS}` || path === `/users/${STRANGER}`
        ? Response.json({}, { status: 500 })
        : undefined
    );

    const team = await fetchTeam(config, signal, fetchImpl);

    expect(team.map(({ name }) => name)).toEqual([
      "phinner",
      "ZetaMap",
      "Maxou",
      "Madness",
      "Strange"
    ]);
    // Their face is on the member list, so its colour still stands in for a banner.
    expect(team.find(({ name }) => name === "Madness")?.accent).toBe("#ff0000");
    expect(team.at(-1)?.accent).toBe("#0000ff");
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.join()).not.toContain(config.token);
    warn.mockRestore();
  });

  test("fails when its time runs out rather than keep half a team", async () => {
    const abort = new AbortController();
    const fetchImpl = discord((path) => {
      if (path === `/users/${MADNESS}`) abort.abort(new Error("out of time"));
      return undefined;
    });

    await expect(fetchTeam(config, abort.signal, fetchImpl)).rejects.toThrow("out of time");
  });

  test("keeps everyone with a role when activity does not count", async () => {
    const team = await fetchTeam({ ...config, activeDays: 0 }, signal, discord());

    expect(team.map(({ name }) => name)).toContain("Idle");
  });

  test("waits out a rate limit, and asks again", async () => {
    let refusals = 2;
    const fetchImpl = discord((path) =>
      path === `/users/${STRANGER}` && refusals-- > 0
        ? Response.json({ retry_after: 0.03 }, { status: 429 })
        : undefined
    );
    const start = performance.now();

    const team = await fetchTeam(config, signal, fetchImpl);

    expect(performance.now() - start).toBeGreaterThanOrEqual(55);
    expect(asked(fetchImpl).filter((path) => path === `/users/${STRANGER}`)).toHaveLength(3);
    expect(team.at(-1)?.accent).toBe("#00ff7f");
  });

  test("waits for the window Discord says a call has used up", async () => {
    const fetchImpl = discord((path) =>
      path === "/guilds/1/members"
        ? Response.json(MEMBERS, {
            headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset-after": "0.05" }
          })
        : undefined
    );
    const start = performance.now();

    await fetchTeam(config, signal, fetchImpl);

    expect(performance.now() - start).toBeGreaterThanOrEqual(45);
  });

  test("reports the status Discord answered with", async () => {
    const fetchImpl = discord(() =>
      Response.json({ message: "401: Unauthorized" }, { status: 401 })
    );

    await expect(fetchTeam(config, signal, fetchImpl)).rejects.toThrow(/401/);
  });
});
