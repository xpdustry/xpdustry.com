import * as v from "valibot";
import { LenientBooleanSchema } from "#app/lib/schema";

const PortSchema = v.pipe(
  v.optional(v.string(), "3000"),
  v.transform((value) => (value === "" ? "3000" : value)),
  v.toNumber("must be a number"),
  v.integer("must be an integer"),
  v.minValue(1, "must be at least 1"),
  v.maxValue(65_535, "must be at most 65535"),
);

export default {
  server: {
    PORT: PortSchema,
    XPD_DISABLE_STATUS: LenientBooleanSchema,
  },
  client: {},
} as const;
