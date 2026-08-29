import * as v from "valibot";
import { describe, expect, test } from "vitest";
import EnvSchema from "./env";

const { PORT: PortSchema, XPD_DISABLE_STATUS: DisableStatusSchema } = EnvSchema.server;

describe("environment schemas", () => {
  test.each([
    [undefined, 3000],
    ["", 3000],
    ["6567", 6567],
  ])("parses PORT %j", (input, output) => {
    expect(v.parse(PortSchema, input)).toBe(output);
  });

  test.each(["nope", "0", "65536"])('rejects PORT "%s"', (input) => {
    expect(() => v.parse(PortSchema, input)).toThrow();
  });

  test.each([
    [undefined, false],
    ["", false],
    ["0", false],
    ["1", true],
  ])("parses XPD_DISABLE_STATUS %j", (input, output) => {
    expect(v.parse(DisableStatusSchema, input)).toBe(output);
  });

  test.each(["true", "false", "yes", "2"])('rejects XPD_DISABLE_STATUS "%s"', (input) => {
    expect(() => v.parse(DisableStatusSchema, input)).toThrow();
  });
});
