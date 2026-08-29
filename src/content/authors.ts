export const authorNames = ["phinner"] as const;

export type AuthorName = (typeof authorNames)[number];

export interface Author {
  avatar: string;
  url: string;
}

export const authors: Record<AuthorName, Author> = {
  phinner: {
    avatar: "/phinner.svg",
    url: "https://github.com/phinner",
  },
};
