import { known, tagsOf, teammate, type Teammate } from "../../brand/team.ts";

export type AuthorName = string;

export type Author = Teammate & Required<Pick<Teammate, "avatar" | "github">>;

const signing = Object.entries(known).flatMap(([id, person]) => {
  const { name, avatar, github } = person;
  return name && avatar && github
    ? [[name, { ...teammate(id, person, tagsOf(person)), avatar, github }] as const]
    : [];
});

export const authorNames = signing.map(([name]) => name) as [AuthorName, ...AuthorName[]];

export const authors: Record<AuthorName, Author> = Object.fromEntries(signing);

export const authorProfile = (author: AuthorName, team: Teammate[]): Teammate =>
  team.find(({ id }) => id === authors[author].id) ?? authors[author];
