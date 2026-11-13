// The team is whoever holds one of the configured roles on a Discord server, as the server lists
// them, with `team.json` on top, and who has spoken there lately. Discord cannot list a role's
// members, so this pages through every member: one call per thousand, then one per role holder to
// search for a recent message, then one per teammate for their banner. Only the list has to
// succeed: a search or a profile Discord refuses costs that person a detail, not the team a
// refresh.

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
const PAGE = 1000;
/** When Discord counts time from, for the IDs it hands out. */
const DISCORD_EPOCH = 1_420_070_400_000n;
const DAY = 24 * 60 * 60 * 1000;
/** How many times over a call waits out a rate limit before giving up. */
const RETRIES = 3;

export interface TeamConfig {
  token: string;
  guild: string;
  /** Which tag each role ID gives. */
  roles: Map<string, Tag>;
  /** How many days back a message keeps someone on the team; zero keeps everyone. */
  activeDays: number;
}

/**
 * `XPD_DISCORD_TOKEN`, the bot's, and `XPD_DISCORD_GUILD`, the server; then `XPD_TEAM_ROLE_OWNER`,
 * `XPD_TEAM_ROLE_DEVELOPER`, `XPD_TEAM_ROLE_ADMIN` and `XPD_TEAM_ROLE_MODERATOR`, each a list of role
 * IDs, comma separated; and `XPD_TEAM_ACTIVE_DAYS`, how long since their last message someone stays
 * on the team, 90 by default and 0 for always. Without a token or a server, the team is
 * `team.json`'s.
 */
export function teamConfig(env: Record<string, string | undefined>): TeamConfig | undefined {
  const { XPD_DISCORD_TOKEN: token, XPD_DISCORD_GUILD: guild } = env;
  if (!token || !guild) return undefined;
  const roles = new Map(
    (Object.keys(TAGS) as Tag[]).flatMap((tag) =>
      (env[`XPD_TEAM_ROLE_${tag.toUpperCase()}`] ?? "")
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean)
        .map((role) => [role, tag] as const)
    )
  );
  const activeDays = Number(env.XPD_TEAM_ACTIVE_DAYS ?? 90);
  return { token, guild, roles, activeDays: Number.isFinite(activeDays) ? activeDays : 90 };
}

const UserSchema = v.object({
  id: v.string(),
  username: v.string(),
  global_name: v.nullish(v.string()),
  avatar: v.nullish(v.string()),
  banner: v.nullish(v.string()),
  /** The colour atop their profile, as Discord documents it and as it also answers it. */
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

/** A search Discord has yet to index answers without a count. */
const SearchSchema = v.object({ total_results: v.optional(v.number()) });

const RateLimitSchema = v.object({ retry_after: v.number() });

type Get = <T>(path: string, schema: v.GenericSchema<unknown, T>) => Promise<T>;

/**
 * How long Discord wants before the next call, in milliseconds: what a refusal says to wait, or
 * what is left of the window once a call has used it up.
 */
async function cooldown(response: Response): Promise<number> {
  if (response.status === 429) {
    return v.parse(RateLimitSchema, await response.json()).retry_after * 1000;
  }
  const spent = response.headers.get("x-ratelimit-remaining") === "0";
  return spent ? Number(response.headers.get("x-ratelimit-reset-after")) * 1000 || 0 : 0;
}

/**
 * A GET on the API as the bot, one call at a time. It waits where Discord says the next call
 * would be refused, and waits out a refusal a few times before giving up.
 */
function client(token: string, signal: AbortSignal, fetchImpl: typeof fetch): Get {
  const headers = { authorization: `Bot ${token}`, accept: "application/json" };
  let ready = 0;
  const request = async (path: string, retries = RETRIES): Promise<Response> => {
    await sleep(Math.max(0, ready - Date.now()), undefined, { signal });
    const response = await fetchImpl(`${API}${path}`, { headers, signal });
    ready = Date.now() + (await cooldown(response));
    return response.status === 429 && retries > 0 ? request(path, retries - 1) : response;
  };
  return async (path, schema) => {
    const response = await request(path);
    if (!response.ok) {
      throw new Error(`Discord answered ${response.status} ${response.statusText} for ${path}`);
    }
    return v.parse(schema, await response.json());
  };
}

/**
 * What Discord says of one person, or `fallback` where it will not: the rest of the team should
 * not go without for it. A refresh that ran out of time still fails.
 */
async function soft<T>(lookup: Promise<T>, fallback: T, signal: AbortSignal): Promise<T> {
  try {
    return await lookup;
  } catch (error) {
    signal.throwIfAborted();
    console.warn(`[team] ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

/** Every member of the server, a page at a time. */
async function members(get: Get, guild: string): Promise<Member[]> {
  const all: Member[] = [];
  for (let after = "0"; ;) {
    const page = await get(
      `/guilds/${guild}/members?limit=${PAGE}&after=${after}`,
      v.array(MemberSchema)
    );
    all.push(...page);
    if (page.length < PAGE) return all;
    after = page.at(-1)!.user.id;
  }
}

/** The highest tag a member's roles give, if any. */
function rankOf(member: Member, roles: Map<string, Tag>): Tag | undefined {
  return ranked(member.roles.flatMap((role) => roles.get(role) ?? []))[0];
}

/** The first message ID Discord could have given on `date`, to search from. */
const since = (date: number) => ((BigInt(date) - DISCORD_EPOCH) << 22n).toString();

/**
 * Whether they wrote on the server after `after`, in a channel the bot can read. Until Discord
 * has indexed the server, everyone is.
 */
async function active(get: Get, guild: string, id: string, after: string): Promise<boolean> {
  const { total_results: total } = await get(
    `/guilds/${guild}/messages/search?author_id=${id}&min_id=${after}&limit=1`,
    SearchSchema
  );
  return total === undefined || total > 0;
}

/** Their face on this server, else on Discord, else `team.json`'s, else Discord's default. */
function avatarOf({ user, avatar }: Member, guild: string, fallback?: string): string {
  if (avatar) return `${CDN}/guilds/${guild}/users/${user.id}/avatars/${avatar}.webp?size=128`;
  if (user.avatar) return `${CDN}/avatars/${user.id}/${user.avatar}.webp?size=128`;
  return fallback ?? `${CDN}/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png`;
}

/**
 * The colour atop a profile without a banner or a colour of its own: their face's, on average,
 * read off a small copy. Nothing when Discord does not serve it, as for a face from `team.json`.
 */
async function faceColour(
  avatar: string | undefined,
  signal: AbortSignal,
  fetchImpl: typeof fetch
) {
  if (!avatar?.startsWith(CDN)) return undefined;
  try {
    const small = avatar.replace(/\.webp\?size=\d+$/, ".png?size=16");
    const response = await fetchImpl(small, { signal });
    return response.ok ? averageColour(new Uint8Array(await response.arrayBuffer())) : undefined;
  } catch {
    return undefined;
  }
}

/** A colour as Discord numbers it, as CSS writes it. */
const hexOf = (colour: number) => `#${colour.toString(16).padStart(6, "0")}`;

/** The colour atop their profile, if they chose one. */
function accentOf({ banner_color, accent_color }: User): string | undefined {
  if (banner_color) return banner_color;
  return typeof accent_color === "number" ? hexOf(accent_color) : undefined;
}

/** A member with a tag, with what `team.json` and their Discord profile add. */
function enrich(member: Member, profile: User, rank: Tag, guild: string): Teammate {
  const person = known[member.user.id] ?? {};
  const name = person.name ?? member.nick ?? member.user.global_name ?? member.user.username;
  return {
    ...teammate(member.user.id, { ...person, name }, tagsOf(person, rank)),
    avatar: avatarOf(member, guild, person.avatar),
    banner: profile.banner
      ? `${CDN}/banners/${profile.id}/${profile.banner}.webp?size=480`
      : undefined,
    accent: accentOf(profile)
  };
}

/**
 * `team.json`'s team first of all: whoever it names and tags stays whatever Discord says, with the
 * roles Discord gives them. The others who hold a role stay while they write.
 */
export async function fetchTeam(
  { token, guild, roles, activeDays }: TeamConfig,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<Teammate[]> {
  const get = client(token, signal, fetchImpl);
  const staff = (await members(get, guild)).flatMap((member) => {
    const rank = rankOf(member, roles);
    return rank && !known[member.user.id]?.hidden ? [{ member, rank }] : [];
  });
  const after = since(Date.now() - activeDays * DAY);
  const always = new Set(knownTeam.map((person) => person.id));
  const stays = async (id: string) =>
    activeDays <= 0 || always.has(id) || soft(active(get, guild, id, after), true, signal);
  const team: Teammate[] = [];
  // One by one: Discord limits how fast a bot may search and read profiles.
  for (const { member, rank } of staff) {
    const { id } = member.user;
    if (!(await stays(id))) continue;
    const profile = await soft(get(`/users/${id}`, UserSchema), member.user, signal);
    const person = enrich(member, profile, rank, guild);
    if (!person.banner && !person.accent) {
      person.accent = await faceColour(person.avatar, signal, fetchImpl);
    }
    team.push(person);
  }
  const listed = new Set(team.map((person) => person.id));
  return [...team, ...knownTeam.filter((person) => !listed.has(person.id))].sort(byRank);
}
