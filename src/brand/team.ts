import * as v from "valibot";
import data from "./team.json" with { type: "json" };

export const TAGS = ["owner", "developer", "admin", "moderator"] as const;

export type Tag = (typeof TAGS)[number];

type DiscordUserId = string;
type ByLocale = Record<string, string>;

const TagSchema = v.picklist(TAGS);
const Link = v.pipe(v.string(), v.url());
const PublicPath = v.pipe(v.string(), v.startsWith("/"));

const KnownSchema = v.strictObject({
  name: v.optional(v.string()),
  rank: v.optional(TagSchema),
  tags: v.optional(v.array(TagSchema)),
  about: v.optional(v.record(v.string(), v.string())),
  avatar: v.optional(PublicPath),
  github: v.optional(Link),
  website: v.optional(Link),
  hidden: v.optional(v.literal(true))
});

export type Known = v.InferOutput<typeof KnownSchema>;

export const known: Record<DiscordUserId, Known> = v.parse(v.record(v.string(), KnownSchema), data);

export interface Teammate {
  id: DiscordUserId;
  name: string;
  tags: Tag[];
  about?: ByLocale;
  avatar?: string;
  banner?: string;
  accent?: string;
  github?: string;
  website?: string;
}

export const aboutIn = ({ about }: Pick<Teammate, "about">, locale: string, fallback: string) =>
  about?.[locale] ?? about?.[fallback];

export const ranked = (tags: Iterable<Tag>): Tag[] =>
  [...new Set(tags)].sort((one, other) => TAGS.indexOf(one) - TAGS.indexOf(other));

export const byRank = (one: Teammate, other: Teammate) =>
  TAGS.indexOf(one.tags[0]!) - TAGS.indexOf(other.tags[0]!) ||
  one.name.localeCompare(other.name, "en", { sensitivity: "base" });

export const tagsOf = (person: Known, discordRank?: Tag) =>
  ranked([person.rank ?? discordRank, ...(person.tags ?? [])].filter((tag) => tag !== undefined));

export function teammate(
  id: DiscordUserId,
  { name, about, avatar, github, website }: Known,
  tags: Tag[]
) {
  return { id, name: name ?? id, tags, about, avatar, github, website } satisfies Teammate;
}

export const knownTeam: Teammate[] = Object.entries(known)
  .flatMap(([id, person]) => {
    const tags = tagsOf(person);
    return person.name && tags.length > 0 && !person.hidden ? [teammate(id, person, tags)] : [];
  })
  .sort(byRank);
