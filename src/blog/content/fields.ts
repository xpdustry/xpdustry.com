import * as v from "valibot";

export const NonBlankStringSchema = v.pipe(
  v.string(),
  v.regex(/\S/u, "must be a non-empty string")
);

export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

/** A file under `public/blog/`, addressed from the site root, with one of the given extensions. */
export function blogMediaPathSchema(extensions: readonly string[]) {
  return v.pipe(
    v.string(),
    v.check(
      (value) =>
        /^\/blog\/[a-z0-9][a-z0-9._/-]*$/i.test(value) &&
        !value.split("/").includes("..") &&
        extensions.some((extension) => value.toLowerCase().endsWith(extension)),
      "must be a repository-owned blog media path"
    )
  );
}
