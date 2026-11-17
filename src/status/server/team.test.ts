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

interface Message {
  id: string;
  author: string;
  ageRestricted?: boolean;
}

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

const invalidFormBody = () =>
  Response.json({ message: "Invalid Form Body", code: 50035 }, { status: 400 });

const integerParam = (url: URL, name: string, fallback: number) =>
  Number(url.searchParams.get(name) ?? fallback);

function listMembers(url: URL, members: readonly FakeMember[]): Response {
  const limit = integerParam(url, "limit", 1);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) return invalidFormBody();
  const after = BigInt(url.searchParams.get("after") ?? 0);
  const byId = [...members].sort((a, b) => (BigInt(a.user.id) < BigInt(b.user.id) ? -1 : 1));
  return Response.json(byId.filter((member) => BigInt(member.user.id) > after).slice(0, limit));
}

const notIndexedYet = (retryAfterSeconds = 0.01) =>
  Response.json(
    {
      message: "Index not yet available. Try again later",
      code: 110000,
      documents_indexed: 0,
      retry_after: retryAfterSeconds
    },
    { status: 202 }
  );

const DISCORD_TRUE = new Set(["True", "true", "1"]);

function searchMessages(url: URL, messages: readonly Message[]): Response {
  const limit = integerParam(url, "limit", 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) return invalidFormBody();
  const authors = url.searchParams.getAll("author_id");
  const after = BigInt(url.searchParams.get("min_id") ?? 0);
  const includeAgeRestricted = DISCORD_TRUE.has(url.searchParams.get("include_nsfw") ?? "false");
  const found = messages
    .filter(
      (message) =>
        authors.includes(message.author) &&
        BigInt(message.id) > after &&
        (includeAgeRestricted || !message.ageRestricted)
    )
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? 1 : -1));
  return Response.json({
    total_results: found.length,
    messages: found.slice(0, limit).map((message) => [message])
  });
}

const guild: Route = (url) => {
  if (url.host !== "discord.com") return undefined;
  const path = apiPath(url);
  if (path === "/guilds/1/members") return listMembers(url, MEMBERS);
  if (path === "/guilds/1/messages/search") {
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
      ["Legacy", ["moderator"]],
      ["Strange", ["moderator"]]
    ]);
  });

  test("leaves out a role holder who has not written within the active days", async () => {
    expect(names(await fetchTeam(config, signal, discord()))).not.toContain("Idle");
  });

  test("leaves out whoever team.json hides, whatever role and activity they have", async () => {
    expect(names(await fetchTeam(config, signal, discord()))).not.toContain("Hidden");
    expect(names(await fetchTeam({ ...config, activeDays: 0 }, signal, discord()))).not.toContain(
      "Hidden"
    );
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

  test("lists the members past Discord's first page of a thousand", async () => {
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

    const pages = requestedUrls(listing).filter((url) => apiPath(url) === "/guilds/1/members");
    expect(pages.map((url) => url.searchParams.get("after"))).toEqual(["0", "200000000000000994"]);
    expect(names(team)).toEqual(
      expect.arrayContaining(["Late", "Madness", "Strange", "Legacy", "phinner"])
    );
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
      banner: `https://cdn.discordapp.com/banners/${PHINNER}/def.webp?size=512`,
      github: "https://github.com/phinner"
    });
  });

  test.each([
    ["(id >> 22) % 6 to someone migrated to unique usernames", "Strange", 5],
    ["their discriminator % 5 to someone who still has one", "Legacy", 2]
  ])("gives Discord's default face %s", async (_label, name, index) => {
    const team = await fetchTeam(config, signal, discord());

    expect(named(team, name)?.avatar).toBe(`https://cdn.discordapp.com/embed/avatars/${index}.png`);
  });

  test("names only pictures Discord's CDN serves, in the format each asks for", async () => {
    const team = await fetchTeam(config, signal, discord());
    const pictures = team.flatMap(({ avatar, banner }) => [avatar, banner]).filter(Boolean);
    const cdn = fakeFetch(discordCdn());

    for (const picture of pictures.filter((url) =>
      url!.startsWith("https://cdn.discordapp.com/")
    )) {
      const response = await cdn(picture!);
      const extension = new URL(picture!).pathname.split(".").at(-1);
      expect(response.status, picture).toBe(200);
      expect(response.headers.get("content-type"), picture).toBe(`image/${extension}`);
    }
    expect(requestedUrls(cdn).length).toBeGreaterThanOrEqual(4);
  });

  test("searches for messages since 90 days before now, as a snowflake", async () => {
    const fetchImpl = discord();

    await fetchTeam(config, signal, fetchImpl);

    const searches = requestedUrls(fetchImpl).filter(
      (url) => apiPath(url) === "/guilds/1/messages/search"
    );
    expect(searches.length).toBeGreaterThan(0);
    for (const search of searches) {
      expect(search.searchParams.get("min_id")).toBe(CUTOFF_90_DAYS_BEFORE_NOW);
    }
  });

  test.each([
    ["keeps someone whose last message is a minute after the cutoff", A_MINUTE_AFTER_CUTOFF, true],
    ["leaves out someone whose last message is a minute before it", A_MINUTE_BEFORE_CUTOFF, false]
  ])("%s", async (_label, id, kept) => {
    const writing = discord((path, url) =>
      path === "/guilds/1/messages/search" ? searchMessages(url, [{ id, author: IDLE }]) : undefined
    );

    const team = await fetchTeam(config, signal, writing);

    expect(names(team).includes("Idle")).toBe(kept);
  });

  test("counts a message in an age-restricted channel the bot can read", async () => {
    const writing = discord((path, url) =>
      path === "/guilds/1/messages/search"
        ? searchMessages(url, [{ id: A_MINUTE_AFTER_CUTOFF, author: IDLE, ageRestricted: true }])
        : undefined
    );

    expect(names(await fetchTeam(config, signal, writing))).toContain("Idle");
  });

  test("the search fake answers newest first, as Discord does by default", async () => {
    const search = new URL("https://discord.com/api/v10/guilds/1/messages/search");
    search.searchParams.set("author_id", IDLE);
    search.searchParams.set("limit", "1");
    const messages = [
      { id: A_MINUTE_BEFORE_CUTOFF, author: IDLE },
      { id: A_MINUTE_AFTER_CUTOFF, author: IDLE }
    ];

    const answer = (await searchMessages(search, messages).json()) as {
      total_results: number;
      messages: Message[][];
    };

    expect(answer).toEqual({ total_results: 2, messages: [[messages[1]]] });
  });

  test.each([
    ["keeps someone who wrote", [{ id: A_MINUTE_AFTER_CUTOFF, author: IDLE }], true],
    ["leaves out someone who did not", [], false]
  ])(
    "asks again once Discord has indexed the server, after the delay it gave, and %s",
    async (_label, messages: Message[], kept) => {
      let unindexed = 1;
      const indexing = discord((path, url) => {
        if (path !== "/guilds/1/messages/search") return undefined;
        if (url.searchParams.get("author_id") !== IDLE) return undefined;
        return unindexed-- > 0 ? notIndexedYet(0.05) : searchMessages(url, messages);
      });
      const start = performance.now();

      const team = await fetchTeam(config, signal, indexing);

      const asked = requestedUrls(indexing).filter(
        (url) => url.searchParams.get("author_id") === IDLE
      );
      expect(asked).toHaveLength(2);
      expect(performance.now() - start).toBeGreaterThanOrEqual(45);
      expect(names(team).includes("Idle")).toBe(kept);
    }
  );

  test("keeps someone Discord still cannot search for once it stops asking again", async () => {
    const fetchImpl = discord();

    const team = await fetchTeam(config, signal, fetchImpl);

    const asked = requestedUrls(fetchImpl).filter(
      (url) => url.searchParams.get("author_id") === STRANGER
    );
    expect(asked.length).toBeGreaterThan(1);
    expect(names(team)).toContain("Strange");
  });

  describe("waiting on a guild Discord has not indexed", () => {
    const DOCUMENTED_RETRY_AFTER_S = 2;
    const QUIET_ROLE_HOLDERS = Array.from({ length: 40 }, (_, at) => ({
      user: user(String(150000000000000000n + BigInt(at)), { global_name: `Quiet ${at}` }),
      roles: ["mod-role"]
    }));
    const neverIndexed = () =>
      discord((path, url) => {
        if (path === "/guilds/1/members") return listMembers(url, QUIET_ROLE_HOLDERS);
        return path === "/guilds/1/messages/search"
          ? notIndexedYet(DOCUMENTED_RETRY_AFTER_S)
          : undefined;
      });

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"], now: NOW });
    });

    async function refreshTaking(fetchImpl: typeof fetch) {
      const start = Date.now();
      const refresh = fetchTeam(config, AbortSignal.timeout(TEAM_REFRESH_TIMEOUT_MS), fetchImpl);
      await vi.runAllTimersAsync();
      return { team: await refresh, tookMs: Date.now() - start };
    }

    const searches = (fetchImpl: ReturnType<typeof fakeFetch>) =>
      requestedUrls(fetchImpl).filter((url) => apiPath(url) === "/guilds/1/messages/search");

    test("stops waiting well inside the refresh's time, and keeps everyone", async () => {
      const { team, tookMs } = await refreshTaking(neverIndexed());

      expect(tookMs).toBeLessThan(TEAM_REFRESH_TIMEOUT_MS / 2);
      expect(names(team).filter((name) => name.startsWith("Quiet "))).toHaveLength(40);
    });

    test("waits again in the next refresh", async () => {
      const first = neverIndexed();
      await refreshTaking(first);
      const second = neverIndexed();

      const { tookMs } = await refreshTaking(second);

      expect(searches(second).length).toBeGreaterThan(QUIET_ROLE_HOLDERS.length);
      expect(searches(second).length).toBe(searches(first).length);
      expect(tookMs).toBeGreaterThanOrEqual(DOCUMENTED_RETRY_AFTER_S * 1000);
    });
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

    expect(names(team)).toEqual(["phinner", "ZetaMap", "Maxou", "Madness", "Legacy", "Strange"]);
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
