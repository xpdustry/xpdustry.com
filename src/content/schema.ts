/** Build-time validation for repository content. */

import * as v from "valibot";

const nonEmptyStringSchema = v.pipe(
  v.string(),
  v.check((value) => value.trim() !== "", "must be a non-empty string"),
);

const dateSchema = v.pipe(
  v.union([
    v.pipe(v.string(), v.isoDate("must be an ISO date")),
    v.pipe(
      v.date(),
      v.check((value) => !Number.isNaN(value.getTime()), "must be a valid date"),
    ),
  ]),
  v.transform((value) => new Date(value).toISOString()),
);

const releaseIdSchema = v.pipe(
  v.string(),
  v.regex(/^[\w.-]+\/[\w.-]+@\S+$/, "must be owner/repo@tag"),
);

export const blogFrontmatterSchema = v.object(
  {
    title: nonEmptyStringSchema,
    description: nonEmptyStringSchema,
    publishedAt: dateSchema,
    updatedAt: v.optional(dateSchema),
    author: nonEmptyStringSchema,
    pfp: v.optional(nonEmptyStringSchema),
    topic: nonEmptyStringSchema,
    hero: v.optional(nonEmptyStringSchema),
    releases: v.optional(
      v.pipe(
        v.array(releaseIdSchema),
        v.check((ids) => new Set(ids).size === ids.length, "contains a duplicate id"),
      ),
    ),
  },
  "frontmatter is missing or is not a mapping",
);

export type BlogFrontmatter = v.InferOutput<typeof blogFrontmatterSchema>;

export class ContentError extends Error {
  constructor(file: string, message: string, options?: ErrorOptions) {
    super(`${file}: ${message}`, options);
    this.name = "ContentError";
  }
}

export function parseBlogFrontmatter(file: string, value: unknown): BlogFrontmatter {
  return parseFrontmatter(blogFrontmatterSchema, file, value);
}

function parseFrontmatter<TSchema extends v.GenericSchema>(
  schema: TSchema,
  file: string,
  value: unknown,
): v.InferOutput<TSchema> {
  try {
    return v.parse(schema, value);
  } catch (error) {
    if (v.isValiError(error)) {
      throw new ContentError(file, v.summarize(error.issues), { cause: error });
    }
    throw error;
  }
}
