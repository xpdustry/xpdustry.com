import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Teammate } from "#app/brand/team";
import { DEFAULT_FACE_COLOUR, discordCdn, OWN_FACE_COLOUR } from "#tests/support/discordCdn";
import { fakeFetch, requestedUrls, urlOf, type Route } from "#tests/support/fetch";
import { fetchTeam, TEAM_REFRESH_TIMEOUT_MS, teamConfig, type TeamConfig } from "./team";

const PHINNER = "330298929331699713";
const MADNESS = "490644943606644737";
const STRANGER = "100000000020971521";
const GUEST = "100000000000000002";
const IDLE = "100000000000000003";
const HIDDEN = vi.hoisted(() => "100000000000000004");
const LEGACY = "100000000000000007";

vi.mock("#app/brand/team.json", async (importOriginal) => {
  const teamJson = await importOriginal<{ default: Record<string, object> }>();
  return { default: { ...teamJson.default, [HIDDEN]: { name: "Hidden", hidden: true } } };
});

const MIGRATED = "0";

const user = (id: string, extra: object = {}) => ({
  id,
  username: `user${id.slice(-1)}`,
  discriminator: MIGRATED,
  ...extra
});

type FakeMember = { user: { id: string }; nick?: string; roles: string[] };

const MEMBERS: FakeMember[] = [
  { user: user(PHINNER, { avatar: "abc" }), nick: "the boss", roles: ["owner-role", "admin-role"] },
  {
    user: user(MADNESS, { global_name: "Madness", avatar: "ghi" }),
    roles: ["admin-role", "mod-role"]
  },
  { user: user(STRANGER, { global_name: "Stranger" }), nick: "Strange", roles: ["mod-role"] },
  { user: user(GUEST), roles: [] },
  { user: user(IDLE, { global_name: "Idle" }), roles: ["admin-role"] },
  { user: user(HIDDEN, { global_name: "Hidden" }), roles: ["mod-role"] },
  { user: user(LEGACY, { global_name: "Legacy", discriminator: "1337" }), roles: ["mod-role"] }
];

const NOW = new Date("2026-11-17T12:00:00Z");
const CUTOFF_90_DAYS_BEFORE_NOW = "1539604847001600000";
const A_MINUTE_BEFORE_CUTOFF = "1539604595343360000";
const A_MINUTE_AFTER_CUTOFF = "1539605098659840000";

type Message = { id: string; author: string; ageRestricted?: boolean };

const MESSAGES: Message[] = [
  ...[PHINNER, MADNESS, HIDDEN, LEGACY].map((author) => ({ id: A_MINUTE_AFTER_CUTOFF, author })),
  { id: A_MINUTE_BEFORE_CUTOFF, author: IDLE }
];

const UNINDEXED_AUTHORS = new Set([STRANGER]);

const PROFILES: Record<string, object> = {
  [PHINNER]: user(PHINNER, { banner: "def", banner_color: "#123456" }),
  [MADNESS]: user(MADNESS, { avatar: "ghi" }),
  [STRANGER]: user(STRANGER, { accent_color: 0x00ff7f }),
  [IDLE]: user(IDLE),
  [HIDDEN]: user(HIDDEN),
  [LEGACY]: user(LEGACY, { discriminator: "1337" })
};

const apiPath = (url: URL) => url.pathname.replace("/api/v10", "");
const SEARCH = "/guilds/1/messages/search";
/** The calls a fake was asked to the API path. */
const callsTo = (fetchImpl: ReturnType<typeof fakeFetch>, path: string) =>
  requestedUrls(fetchImpl).filter((url) => apiPath(url) === path);

/** Discord refuses a page size outside its range: https://discord.com/developers/docs/resources/guild */
const limitWithin = (url: URL, most: number) => {
  const limit = Number(url.searchParams.get("limit") ?? 1);
  return Number.isInteger(limit) && limit >= 1 && limit <= most ? limit : undefined;
};
const invalidFormBody = () => Response.json({ code: 50035 }, { status: 400 });

function listMembers(url: URL, members: readonly FakeMember[]): Response {
  const limit = limitWithin(url, 1000);
  if (!limit) return invalidFormBody();
  const after = BigInt(url.searchParams.get("after") ?? 0);
  const byId = [...members].sort((a, b) => (BigInt(a.user.id) < BigInt(b.user.id) ? -1 : 1));
  return Response.json(byId.filter((member) => BigInt(member.user.id) > after).slice(0, limit));
}

const notIndexedYet = (retryAfterSeconds = 0.01) =>
  Response.json({ code: 110000, retry_after: retryAfterSeconds }, { status: 202 });

/** Discord's search, as far as the team reads it: how many messages match. */
function searchMessages(url: URL, messages: readonly Message[]): Response {
  if (!limitWithin(url, 25)) return invalidFormBody();
  const after = BigInt(url.searchParams.get("min_id") ?? 0);
  const ageRestrictedToo = url.searchParams.get("include_nsfw") === "true";
  const found = messages.filter(
    ({ id, author, ageRestricted }) =>
      url.searchParams.getAll("author_id").includes(author) &&
      BigInt(id) > after &&
      (ageRestrictedToo || !ageRestricted)
  );
  return Response.json({ total_results: found.length });
}

const guild: Route = (url) => {
  if (url.host !== "discord.com") return undefined;
  const path = apiPath(url);
  if (path === "/guilds/1/members") return listMembers(url, MEMBERS);
  if (path === SEARCH) {
    if (UNINDEXED_AUTHORS.has(url.searchParams.get("author_id")!)) return notIndexedYet();
    return searchMessages(url, MESSAGES);
  }
  const profile = PROFILES[path.replace("/users/", "")];
  return profile && Response.json(profile);
};

const discord = (overriding: (path: string, url: URL) => Response | undefined = () => undefined) =>
  fakeFetch(
    (url) => (url.host === "discord.com" ? overriding(apiPath(url), url) : undefined),
    guild,
    discordCdn()
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], shouldAdvanceTime: true, now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

const config: TeamConfig = {
  token: "token",
  guild: "1",
  roles: new Map(
    Object.entries({
      "owner-role": "owner",
      "admin-role": "admin",
      "mod-role": "moderator"
    } as const)
  ),
  activeDays: 90
};

const signal = new AbortController().signal;

const names = (team: Teammate[]) => team.map(({ name }) => name);
const named = (team: Teammate[], name: string) => team.find((teammate) => teammate.name === name);

const TOKEN_AND_GUILD = { XPD_DISCORD_TOKEN: "t", XPD_DISCORD_GUILD: "1" };
const DEFAULTS = { token: "t", guild: "1", roles: new Map(), activeDays: 90 };

test.each([
  ["is absent without a bot token", {}, undefined],
  ["is absent without a server", { XPD_DISCORD_TOKEN: "t" }, undefined],
  ["keeps 90 days of activity", TOKEN_AND_GUILD, DEFAULTS],
  [
    "reads how many days of activity count",
    { ...TOKEN_AND_GUILD, XPD_TEAM_ACTIVE_DAYS: "30" },
    { ...DEFAULTS, activeDays: 30 }
  ],
  [
    "reads the role IDs of each tag, comma separated",
    { ...TOKEN_AND_GUILD, XPD_TEAM_ROLE_ADMIN: "2, 3" },
    { ...DEFAULTS, roles: new Map(["2", "3"].map((id) => [id, "admin"])) }
  ]
])("the team's configuration %s", (_label, env: Record<string, string>, expected) => {
  expect(teamConfig(env)).toEqual(expected);
});

describe("the team on Discord", () => {
  test("is team.json's people, then whoever holds a role and spoke lately, by their highest tag", async () => {
    const fetchImpl = discord();

    const team = await fetchTeam(config, signal, fetchImpl);

    expect(team.map(({ name, tags, accent }) => [name, tags, accent])).toEqual([
      ["phinner", ["owner", "developer"], "#123456"],
      ["ZetaMap", ["owner", "developer"], undefined],
      [".json", ["developer"], undefined],
      ["Maxou", ["developer"], undefined],
      ["Madness", ["admin"], OWN_FACE_COLOUR],
      ["Legacy", ["moderator"], DEFAULT_FACE_COLOUR],
      ["Strange", ["moderator"], "#00ff7f"]
    ]);
    expect(team[0]).toMatchObject({
      avatar: `https://cdn.discordapp.com/avatars/${PHINNER}/abc.webp?size=128`,
      banner: `https://cdn.discordapp.com/banners/${PHINNER}/def.webp?size=512`,
      github: "https://github.com/phinner"
    });
    // Discord's default faces: (id >> 22) % 6 once migrated, the discriminator % 5 before.
    expect(named(team, "Strange")?.avatar).toBe("https://cdn.discordapp.com/embed/avatars/5.png");
    expect(named(team, "Legacy")?.avatar).toBe("https://cdn.discordapp.com/embed/avatars/2.png");
    expect(
      new Set(callsTo(fetchImpl, SEARCH).map((url) => url.searchParams.get("min_id")))
    ).toEqual(new Set([CUTOFF_90_DAYS_BEFORE_NOW]));
  });

  test("asks Discord one thing at a time, each once the last is answered", async () => {
    const answering = discord();
    let inFlight = 0;
    let mostInFlight = 0;
    const slowly = vi.fn<typeof fetch>(async (input, init) => {
      const api = urlOf(input).host === "discord.com";
      if (api) mostInFlight = Math.max(mostInFlight, ++inFlight);
      try {
        await new Promise((answered) => setTimeout(answered, 1));
        return await answering(input, init);
      } finally {
        if (api) inFlight--;
      }
    });

    await fetchTeam(config, signal, slowly);

    expect(
      requestedUrls(answering).filter((url) => url.host === "discord.com").length
    ).toBeGreaterThan(5);
    expect(mostInFlight).toBe(1);
  });

  test("lists the members past Discord's first page of a thousand, everyone with a role when activity does not count", async () => {
    const LATE = "300000000000000001";
    const crowd = Array.from({ length: 1000 }, (_, at) => ({
      user: user(String(200000000000000000n + BigInt(at))),
      roles: []
    }));
    const everyone = [
      ...MEMBERS,
      ...crowd,
      { user: user(LATE, { global_name: "Late" }), roles: ["mod-role"] }
    ];
    const listing = discord((path, url) =>
      path === "/guilds/1/members" ? listMembers(url, everyone) : undefined
    );

    const team = await fetchTeam({ ...config, activeDays: 0 }, signal, listing);

    const pages = callsTo(listing, "/guilds/1/members");
    expect(pages.map((url) => url.searchParams.get("after"))).toEqual(["0", "200000000000000994"]);
    // When activity does not count, everyone with a role but whoever team.json hides.
    expect(names(team)).toEqual(
      expect.arrayContaining(["Late", "Idle", "Madness", "Strange", "Legacy", "phinner"])
    );
    expect(names(team)).not.toContain("Hidden");
  });

  test("keeps whoever team.json names and tags, however quiet", async () => {
    const silent = discord((path) =>
      path === SEARCH ? Response.json({ total_results: 0 }) : undefined
    );

    const team = await fetchTeam(config, signal, silent);

    expect(team.map(({ name, tags }) => [name, tags])).toEqual([
      ["phinner", ["owner", "developer"]],
      ["ZetaMap", ["owner", "developer"]],
      [".json", ["developer"]],
      ["Maxou", ["developer"]]
    ]);
  });

  test.each([
    ["a minute after the cutoff keeps", A_MINUTE_AFTER_CUTOFF, false, true],
    ["a minute before it leaves out", A_MINUTE_BEFORE_CUTOFF, false, false],
    ["in an age-restricted channel the bot reads keeps", A_MINUTE_AFTER_CUTOFF, true, true]
  ])("a last message %s its writer", async (_label, id, ageRestricted, kept) => {
    const writing = discord((path, url) =>
      path === SEARCH ? searchMessages(url, [{ id, author: IDLE, ageRestricted }]) : undefined
    );

    expect(names(await fetchTeam(config, signal, writing)).includes("Idle")).toBe(kept);
  });

  test("asks again once Discord has indexed the server, after the delay it gave", async () => {
    let unindexed = 1;
    const indexing = discord((path, url) => {
      if (path !== SEARCH) return undefined;
      if (url.searchParams.get("author_id") !== IDLE) return undefined;
      return unindexed-- > 0
        ? notIndexedYet(0.05)
        : searchMessages(url, [{ id: A_MINUTE_AFTER_CUTOFF, author: IDLE }]);
    });
    const start = performance.now();

    const team = await fetchTeam(config, signal, indexing);

    const asked = requestedUrls(indexing).filter(
      (url) => url.searchParams.get("author_id") === IDLE
    );
    expect(asked).toHaveLength(2);
    expect(performance.now() - start).toBeGreaterThanOrEqual(45);
    expect(names(team)).toContain("Idle");
  });

  test("waits on a guild Discord has not indexed well inside each refresh's time, and keeps everyone", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"], now: NOW });
    const DOCUMENTED_RETRY_AFTER_S = 2;
    const QUIET_ROLE_HOLDERS = Array.from({ length: 40 }, (_, at) => ({
      user: user(String(150000000000000000n + BigInt(at)), { global_name: `Quiet ${at}` }),
      roles: ["mod-role"]
    }));
    const refresh = async () => {
      const fetchImpl = discord((path, url) => {
        if (path === "/guilds/1/members") return listMembers(url, QUIET_ROLE_HOLDERS);
        return path === SEARCH ? notIndexedYet(DOCUMENTED_RETRY_AFTER_S) : undefined;
      });
      const start = Date.now();
      const team = fetchTeam(config, AbortSignal.timeout(TEAM_REFRESH_TIMEOUT_MS), fetchImpl);
      await vi.runAllTimersAsync();
      const searches = callsTo(fetchImpl, SEARCH).length;
      return { team: await team, tookMs: Date.now() - start, searches };
    };

    const first = await refresh();
    const second = await refresh();

    for (const { team, tookMs, searches } of [first, second]) {
      expect(tookMs).toBeLessThan(TEAM_REFRESH_TIMEOUT_MS / 2);
      expect(tookMs).toBeGreaterThanOrEqual(DOCUMENTED_RETRY_AFTER_S * 1000);
      expect(searches).toBeGreaterThan(QUIET_ROLE_HOLDERS.length);
      expect(names(team).filter((name) => name.startsWith("Quiet "))).toHaveLength(40);
    }
    expect(second.searches).toBe(first.searches);
  });

  test("keeps someone whose profile Discord refuses, coloured by their face", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const refusing = discord((path) =>
      path === `/users/${MADNESS}` || path === `/users/${STRANGER}`
        ? Response.json({}, { status: 500 })
        : undefined
    );

    const team = await fetchTeam(config, signal, refusing);

    expect(names(team)).toEqual([
      "phinner",
      "ZetaMap",
      ".json",
      "Maxou",
      "Madness",
      "Legacy",
      "Strange"
    ]);
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
    expect(callsTo(fetchImpl, `/users/${STRANGER}`)).toHaveLength(3);
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
