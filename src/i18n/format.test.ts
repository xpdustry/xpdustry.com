import { describe, expect, test, vi } from "vitest";
import { formatDate, formatShortDate } from "./format";

const MACHINE_FAR_EAST_OF_UTC = vi.hoisted(() => (process.env.TZ = "Pacific/Kiritimati"));

describe(`date formats, on a machine in ${MACHINE_FAR_EAST_OF_UTC}`, () => {
  test.each([
    ["a long date", () => formatDate("2026-10-07T23:30:00Z"), "7 October 2026"],
    ["a long date in French", () => formatDate("2026-10-07T23:30:00Z", "fr"), "7 octobre 2026"],
    ["a short date", () => formatShortDate("2026-10-07T23:30:00Z", "en"), "07 Oct 2026"],
    ["a short date given without a time", () => formatShortDate("2026-10-07", "en"), "07 Oct 2026"]
  ])("write %s in the page's language, on the day it is in UTC", (_label, format, written) => {
    expect(format()).toBe(written);
  });

  test("write nothing for a date that does not parse", () => {
    expect(formatDate("soon")).toBe("");
    expect(formatShortDate("soon", "ru")).toBe("");
  });
});
