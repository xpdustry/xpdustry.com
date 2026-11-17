import { known } from "../../brand/team.ts";

export type AuthorName = string;

export interface Author {
  avatar: string;
  url: string;
}

const signing = Object.values(known).flatMap(({ name, avatar, github }) =>
  name && avatar && github ? [[name, { avatar, url: github }] as const] : []
);

export const authorNames = signing.map(([name]) => name) as [AuthorName, ...AuthorName[]];

export const authors: Record<AuthorName, Author> = Object.fromEntries(signing);
