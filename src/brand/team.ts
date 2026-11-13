import { msg } from "gt-tanstack-start";
import * as v from "valibot";
import data from "./team.json" with { type: "json" };

/** What someone does, highest first: a Discord role's, or one Discord cannot know. */
export const TAGS = {
  owner: msg("Owner"),
  developer: msg("Developer"),
  admin: msg("Admin"),
  moderator: msg("Moderator")
};

export type Tag = keyof typeof TAGS;

const ORDER = Object.keys(TAGS) as Tag[];

const TagSchema = v.picklist(ORDER);
const Link = v.pipe(v.string(), v.url());

/** What Discord cannot tell about someone, or what it says that we would rather not. */
const KnownSchema = v.strictObject({
  /** Over their name on the Discord server. */
  name: v.optional(v.string()),
  /** Over the highest tag their Discord roles give. */
  rank: v.optional(TagSchema),
  /** Beside the one their Discord roles give, like `developer`. */
  tags: v.optional(v.array(TagSchema)),
  /** A line on who they are, in each language the site is served in. */
  about: v.optional(v.record(v.string(), v.string())),
  /** In `public`, square: their face before Discord answers, and on the posts they sign. */
  avatar: v.optional(v.string()),
  /** Their GitHub account, which is also where a post they wrote leads. */
  github: v.optional(Link),
  /** A site of their own. */
  website: v.optional(Link),
  /** Left off the team, whatever their roles. */
  hidden: v.optional(v.literal(true))
});

export type Known = v.InferOutput<typeof KnownSchema>;

/** `team.json`: what we know of each teammate, by Discord user ID. */
export const known: Record<string, Known> = v.parse(v.record(v.string(), KnownSchema), data);

/** Someone on the team, as the grid shows them. */
export interface Teammate {
  /** Their Discord user ID. */
  id: string;
  name: string;
  /** Highest first, which colours their name. */
  tags: Tag[];
  /** A line on who they are, by language. */
  about?: Record<string, string>;
  avatar?: string;
  /** The picture atop their Discord profile, over {@link accent}. */
  banner?: string;
  /** The colour atop their Discord profile. */
  accent?: string;
  github?: string;
  website?: string;
}

/** Their line in `locale`, else in `fallback`. */
export const aboutIn = ({ about }: Pick<Teammate, "about">, locale: string, fallback: string) =>
  about?.[locale] ?? about?.[fallback];

/** Each tag once, highest first. */
export const ranked = (tags: Iterable<Tag>): Tag[] =>
  [...new Set(tags)].sort((one, other) => ORDER.indexOf(one) - ORDER.indexOf(other));

/** By highest tag, then by name. */
export const byRank = (one: Teammate, other: Teammate) =>
  ORDER.indexOf(one.tags[0]!) - ORDER.indexOf(other.tags[0]!) ||
  one.name.localeCompare(other.name, "en", { sensitivity: "base" });

/** The tags `team.json` gives someone, over `rank`, the highest Discord's roles give. */
export const tagsOf = (person: Known, rank?: Tag) =>
  ranked([person.rank ?? rank, ...(person.tags ?? [])].filter((tag) => tag !== undefined));

/** Someone as `team.json` has them, before what Discord adds. */
export function teammate(id: string, { name, about, avatar, github, website }: Known, tags: Tag[]) {
  return { id, name: name ?? id, tags, about, avatar, github, website } satisfies Teammate;
}

/** Who `team.json` names and tags, for before Discord answers or without a token to ask it. */
export const knownTeam: Teammate[] = Object.entries(known)
  .flatMap(([id, person]) => {
    const tags = tagsOf(person);
    return person.name && tags.length > 0 && !person.hidden ? [teammate(id, person, tags)] : [];
  })
  .sort(byRank);
