import * as v from "valibot";
import { authorNames } from "#app/content/authors";
import { NonBlankStringSchema } from "#app/lib/schema";

const IsoCalendarDateSchema = v.pipe(
  v.string(),
  v.isoDate("must be an ISO date"),
  v.check(isCalendarDate, "must be a valid calendar date"),
);

const BlogFrontmatterDateSchema = v.pipe(
  v.union([
    v.pipe(
      IsoCalendarDateSchema,
      v.transform((value) => new Date(`${value}T00:00:00.000Z`)),
    ),
    v.date("must be a valid date"),
  ]),
  v.transform((value) => value.toISOString()),
);

const ReleaseIdSchema = v.pipe(
  v.string(),
  v.regex(/^[\w.-]+\/[\w.-]+@\S+$/, "must be owner/repo@tag"),
);

export const BlogFrontmatterSchema = v.strictObject(
  {
    title: NonBlankStringSchema,
    description: NonBlankStringSchema,
    publishedAt: BlogFrontmatterDateSchema,
    updatedAt: v.optional(BlogFrontmatterDateSchema),
    author: v.picklist(authorNames, "must be a known author"),
    topic: NonBlankStringSchema,
    hero: v.optional(NonBlankStringSchema),
    releases: v.optional(
      v.pipe(
        v.array(ReleaseIdSchema),
        v.checkItems((id, index, ids) => ids.indexOf(id) === index, "contains a duplicate id"),
      ),
    ),
  },
  "frontmatter is missing or is not a mapping",
);

export type BlogFrontmatter = v.InferOutput<typeof BlogFrontmatterSchema>;

export class ContentError extends Error {
  constructor(file: string, message: string, options?: ErrorOptions) {
    super(`${file}: ${message}`, options);
    this.name = "ContentError";
  }
}

export function parseBlogFrontmatter(file: string, value: unknown): BlogFrontmatter {
  const result = v.safeParse(BlogFrontmatterSchema, value);
  if (result.success) return result.output;
  throw new ContentError(file, v.summarize(result.issues));
}

function isCalendarDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
