import { setTimeout as sleep } from "node:timers/promises";
import * as v from "valibot";
import {
  byRank,
  known,
  knownTeam,
  ranked,
  TAGS,
  tagsOf,
  teammate,
  type Tag,
  type Teammate
} from "#app/brand/team";
import { averageColour } from "./colour";

const API = "https://discord.com/api/v10";
const CDN = "https://cdn.discordapp.com";
const MAX_MEMBERS_PER_PAGE = 1000;
const DISCORD_EPOCH_MS = 1_420_070_400_000n;
const SNOWFLAKE_TIMESTAMP_SHIFT = 22n;
const DEFAULT_AVATARS = 6n;
const INDEX_NOT_YET_AVAILABLE = 110000;
const RATE_LIMIT_RETRIES = 3;
const DEFAULT_ACTIVE_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

type RoleId = string;

export interface TeamConfig {
  token: string;
  guild: string;
  roles: Map<RoleId, Tag>;
  activeDays: number;
}

const roleIds = (list = "") =>
  list
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

export function teamConfig(env: Record<string, string | undefined>): TeamConfig | undefined {
  const { XPD_DISCORD_TOKEN: token, XPD_DISCORD_GUILD: guild } = env;
  if (!token || !guild) return undefined;
  const roles = new Map(
    TAGS.flatMap((tag) =>
      roleIds(env[`XPD_TEAM_ROLE_${tag.toUpperCase()}`]).map((role) => [role, tag] as const)
    )
  );
  const activeDays = Number(env.XPD_TEAM_ACTIVE_DAYS ?? DEFAULT_ACTIVE_DAYS);
  return {
    token,
    guild,
    roles,
    activeDays: Number.isFinite(activeDays) ? activeDays : DEFAULT_ACTIVE_DAYS
  };
}

const UserSchema = v.object({
  id: v.string(),
  username: v.string(),
  global_name: v.nullish(v.string()),
  avatar: v.nullish(v.string()),
  banner: v.nullish(v.string()),
  accent_color: v.nullish(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(0xffffff))),
  banner_color: v.nullish(v.pipe(v.string(), v.hexColor()))
});

const MemberSchema = v.object({
  user: UserSchema,
  nick: v.nullish(v.string()),
  avatar: v.nullish(v.string()),
  roles: v.array(v.string())
});

type User = v.InferOutput<typeof UserSchema>;
type Member = v.InferOutput<typeof MemberSchema>;

const SearchSchema = v.union([
  v.object({ total_results: v.number() }),
  v.object({ code: v.literal(INDEX_NOT_YET_AVAILABLE) })
]);

type Search = v.InferOutput<typeof SearchSchema>;

const RateLimitSchema = v.object({ retry_after: v.number() });

type Get = <T>(path: string, schema: v.GenericSchema<unknown, T>) => Promise<T>;

async function cooldownMs(response: Response): Promise<number> {
  if (response.status === 429) {
    return v.parse(RateLimitSchema, await response.json()).retry_after * 1000;
  }
  const spent = response.headers.get("x-ratelimit-remaining") === "0";
  return spent ? Number(response.headers.get("x-ratelimit-reset-after")) * 1000 || 0 : 0;
}

function discordApi(token: string, signal: AbortSignal, fetchImpl: typeof fetch): Get {
  const headers = { authorization: `Bot ${token}`, accept: "application/json" };
  let ready = 0;
  let previous: Promise<unknown> = Promise.resolve();
  const send = async (path: string, retries = RATE_LIMIT_RETRIES): Promise<Response> => {
    await sleep(Math.max(0, ready - Date.now()), undefined, { signal });
    const response = await fetchImpl(`${API}${path}`, { headers, signal });
    ready = Date.now() + (await cooldownMs(response));
    return response.status === 429 && retries > 0 ? send(path, retries - 1) : response;
  };
  return (path, schema) => {
    const call = previous.then(async () => {
      const response = await send(path);
      if (!response.ok) {
        throw new Error(`Discord answered ${response.status} ${response.statusText} for ${path}`);
      }
      return v.parse(schema, await response.json());
    });
    previous = call.catch(() => undefined);
    return call;
  };
}

async function orFallback<T>(lookup: Promise<T>, fallback: T, signal: AbortSignal): Promise<T> {
  try {
    return await lookup;
  } catch (error) {
    signal.throwIfAborted();
    console.warn(`[team] ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

// Discord counts a role's members but cannot list them:
// https://discord.com/developers/docs/resources/guild#get-guild-role-member-counts
async function allMembers(get: Get, guild: string): Promise<Member[]> {
  const all: Member[] = [];
  for (let after = "0"; ;) {
    const page = await get(
      `/guilds/${guild}/members?limit=${MAX_MEMBERS_PER_PAGE}&after=${after}`,
      v.array(MemberSchema)
    );
    all.push(...page);
    if (page.length < MAX_MEMBERS_PER_PAGE) return all;
    after = page.at(-1)!.user.id;
  }
}

const rankOf = (member: Member, roles: Map<RoleId, Tag>): Tag | undefined =>
  ranked(member.roles.flatMap((role) => roles.get(role) ?? []))[0];

const isHidden = (id: string) => known[id]?.hidden === true;

const firstSnowflakeAt = (ms: number) =>
  ((BigInt(ms) - DISCORD_EPOCH_MS) << SNOWFLAKE_TIMESTAMP_SHIFT).toString();

const indexed = (search: Search) => "total_results" in search;

async function wroteSince(get: Get, guild: string, id: string, since: string): Promise<boolean> {
  const search = await get(
    `/guilds/${guild}/messages/search?author_id=${id}&min_id=${since}&limit=1`,
    SearchSchema
  );
  return !indexed(search) || search.total_results > 0;
}

interface Face {
  url: string;
  pngThumbnail?: string;
}

function uploadedFace({ user, avatar }: Member, guild: string): string | undefined {
  if (avatar) return `${CDN}/guilds/${guild}/users/${user.id}/avatars/${avatar}`;
  if (user.avatar) return `${CDN}/avatars/${user.id}/${user.avatar}`;
  return undefined;
}

function faceOf(member: Member, guild: string, fromTeamJson?: string): Face {
  const uploaded = uploadedFace(member, guild);
  if (uploaded)
    return { url: `${uploaded}.webp?size=128`, pngThumbnail: `${uploaded}.png?size=16` };
  if (fromTeamJson) return { url: fromTeamJson };
  const index = (BigInt(member.user.id) >> SNOWFLAKE_TIMESTAMP_SHIFT) % DEFAULT_AVATARS;
  const builtIn = `${CDN}/embed/avatars/${index}.png`;
  return { url: builtIn, pngThumbnail: builtIn };
}

async function averageFaceColour(
  { pngThumbnail }: Face,
  signal: AbortSignal,
  fetchImpl: typeof fetch
): Promise<string | undefined> {
  if (!pngThumbnail) return undefined;
  try {
    const response = await fetchImpl(pngThumbnail, { signal });
    return response.ok ? averageColour(new Uint8Array(await response.arrayBuffer())) : undefined;
  } catch {
    signal.throwIfAborted();
    return undefined;
  }
}

const cssHex = (colour: number) => `#${colour.toString(16).padStart(6, "0")}`;

function chosenAccent({ banner_color, accent_color }: User): string | undefined {
  if (banner_color) return banner_color;
  return typeof accent_color === "number" ? cssHex(accent_color) : undefined;
}

export async function fetchTeam(
  { token, guild, roles, activeDays }: TeamConfig,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<Teammate[]> {
  const get = discordApi(token, signal, fetchImpl);
  const members = await allMembers(get, guild);
  const activityCounts = activeDays > 0;
  const since = firstSnowflakeAt(Date.now() - activeDays * DAY_MS);
  const alwaysOnTeam = new Set(knownTeam.map((person) => person.id));
  const isActive = async (id: string) =>
    !activityCounts ||
    alwaysOnTeam.has(id) ||
    orFallback(wroteSince(get, guild, id, since), true, signal);

  const onTeam = async (member: Member, rank: Tag): Promise<Teammate> => {
    const { id } = member.user;
    const person = known[id] ?? {};
    const name = person.name ?? member.nick ?? member.user.global_name ?? member.user.username;
    const profile = await orFallback(get(`/users/${id}`, UserSchema), member.user, signal);
    const face = faceOf(member, guild, person.avatar);
    return {
      ...teammate(id, { ...person, name }, tagsOf(person, rank)),
      avatar: face.url,
      banner: profile.banner ? `${CDN}/banners/${id}/${profile.banner}.webp?size=480` : undefined,
      accent:
        chosenAccent(profile) ??
        (profile.banner ? undefined : await averageFaceColour(face, signal, fetchImpl))
    };
  };

  const team: Teammate[] = [];
  for (const member of members) {
    const rank = rankOf(member, roles);
    if (!rank || isHidden(member.user.id) || !(await isActive(member.user.id))) continue;
    team.push(await onTeam(member, rank));
  }
  const listed = new Set(team.map((person) => person.id));
  return [...team, ...knownTeam.filter((person) => !listed.has(person.id))].sort(byRank);
}
