import * as v from "valibot";

export const NonBlankStringSchema = v.pipe(
  v.string(),
  v.regex(/\S/u, "must be a non-empty string"),
);

export const LenientBooleanSchema = v.pipe(
  v.optional(v.string(), "0"),
  v.parseBoolean({ truthy: ["1"], falsy: ["0", ""] }, "must be 0 or 1 when set"),
);
