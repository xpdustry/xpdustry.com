import { describe, expect, test, vi } from "vitest";
import type { Teammate } from "#app/brand/team";
import { DEFAULT_FACE_COLOUR, discordCdn, OWN_FACE_COLOUR } from "#tests/support/discordCdn";
import { fakeFetch, requestedUrls, type Route } from "#tests/support/fetch";
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

const NOT_INDEXED_YET = undefined;

const RECENT_MESSAGES: Record<string, number | undefined> = {
  [PHINNER]: 12,
  [MADNESS]: 3,
  [IDLE]: 0,
  [STRANGER]: NOT_INDEXED_YET
};

const PROFILES: Record<string, object> = {
  [PHINNER]: user(PHINNER, { banner: "def", banner_color: "#123456" }),
  [MADNESS]: user(MADNESS, { avatar: "ghi" }),
  [STRANGER]: user(STRANGER, { accent_color: 0x00ff7f }),
  [IDLE]: user(IDLE)
};

const apiPath = (url: URL) => url.pathname.replace("/api/v10", "");

const guild: Route = (url) => {
  if (url.host !== "discord.com") return undefined;
  const path = apiPath(url);
  if (path === "/guilds/1/members") return Response.json(MEMBERS);
  if (path === "/guilds/1/messages/search") {
    const total = RECENT_MESSAGES[url.searchParams.get("author_id")!];
    return total === NOT_INDEXED_YET
      ? Response.json({ message: "Index not yet available", code: 110000 }, { status: 202 })
      : Response.json({ total_results: total, messages: [] });
  }
  const profile = PROFILES[path.replace("/users/", "")];
  return profile && Response.json(profile);
};

const discord = (overriding: (path: string) => Response | undefined = () => undefined) =>
  fakeFetch(
    (url) => (url.host === "discord.com" ? overriding(apiPath(url)) : undefined),
    guild,
    discordCdn()
  );

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

const names = (team: Teammate[]) => team.map(({ name }) => name);
const named = (team: Teammate[], name: string) => team.find((teammate) => teammate.name === name);

describe("the team's configuration", () => {
  test("is absent without a bot token and a server", () => {
    expect(teamConfig({})).toBeUndefined();
    expect(teamConfig({ XPD_DISCORD_TOKEN: "token" })).toBeUndefined();
  });

  test("reads the role IDs of each tag, comma separated, and keeps 90 days of activity", () => {
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
  });

  test("reads how many days of activity keep someone on the team", () => {
    expect(
      teamConfig({ XPD_DISCORD_TOKEN: "token", XPD_DISCORD_GUILD: "1", XPD_TEAM_ACTIVE_DAYS: "30" })
    ).toMatchObject({ activeDays: 30 });
  });
});

describe("the team on Discord", () => {
  test("is team.json's people, then whoever holds a role and spoke lately, by their highest tag", async () => {
    const team = await fetchTeam(config, signal, discord());

    expect(team.map(({ name, tags }) => [name, tags])).toEqual([
      ["phinner", ["owner", "developer"]],
      ["ZetaMap", ["owner", "developer"]],
      ["Maxou", ["developer"]],
      ["Madness", ["admin"]],
      ["Strange", ["moderator"]]
    ]);
  });

  test("leaves out a role holder who has not written within the active days", async () => {
    expect(names(await fetchTeam(config, signal, discord()))).not.toContain("Idle");
  });

  test("keeps everyone with a role when activity does not count", async () => {
    const team = await fetchTeam({ ...config, activeDays: 0 }, signal, discord());

    expect(names(team)).toContain("Idle");
  });

  test("keeps whoever team.json names and tags, however quiet", async () => {
    const silent = discord((path) =>
      path === "/guilds/1/messages/search" ? Response.json({ total_results: 0 }) : undefined
    );

    const team = await fetchTeam(config, signal, silent);

    expect(team.map(({ name, tags }) => [name, tags])).toEqual([
      ["phinner", ["owner", "developer"]],
      ["ZetaMap", ["owner", "developer"]],
      ["Maxou", ["developer"]]
    ]);
  });

  test("shows each teammate's Discord face and banner, and team.json's links", async () => {
    const [phinner] = await fetchTeam(config, signal, discord());

    expect(phinner).toMatchObject({
      avatar: `https://cdn.discordapp.com/avatars/${PHINNER}/abc.webp?size=128`,
      banner: `https://cdn.discordapp.com/banners/${PHINNER}/def.webp?size=480`,
      github: "https://github.com/phinner"
    });
  });

  test("gives someone without a face of their own one of Discord's", async () => {
    const team = await fetchTeam(config, signal, discord());

    expect(named(team, "Strange")?.avatar).toMatch(
      /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/[0-5]\.png$/
    );
  });

  test.each([
    ["the colour of their banner", "phinner", "#123456"],
    ["the colour they chose", "Strange", "#00ff7f"],
    ["without either, the colour of their face", "Madness", OWN_FACE_COLOUR]
  ])("colours a teammate's card with %s", async (_label, name, accent) => {
    expect(named(await fetchTeam(config, signal, discord()), name)?.accent).toBe(accent);
  });

  test("keeps someone whose profile Discord refuses, coloured by their face", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const refusing = discord((path) =>
      path === `/users/${MADNESS}` || path === `/users/${STRANGER}`
        ? Response.json({}, { status: 500 })
        : undefined
    );

    const team = await fetchTeam(config, signal, refusing);

    expect(names(team)).toEqual(["phinner", "ZetaMap", "Maxou", "Madness", "Strange"]);
    expect(named(team, "Madness")?.accent).toBe(OWN_FACE_COLOUR);
    expect(named(team, "Strange")?.accent).toBe(DEFAULT_FACE_COLOUR);
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
    const asked = requestedUrls(fetchImpl).filter((url) => apiPath(url) === `/users/${STRANGER}`);
    expect(asked).toHaveLength(3);
    expect(named(team, "Strange")?.accent).toBe("#00ff7f");
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
    const unauthorized = discord(() =>
      Response.json({ message: "401: Unauthorized" }, { status: 401 })
    );

    await expect(fetchTeam(config, signal, unauthorized)).rejects.toThrow(/401/);
  });
});
