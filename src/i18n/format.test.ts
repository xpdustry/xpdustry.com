import { describe, expect, test } from "vitest";
import { formatDate, formatShortDate } from "./format";

describe("date formats", () => {
  test("write a date in the page's language, on the same day everywhere", () => {
    expect(formatDate("2026-10-07T23:30:00Z")).toBe("7 October 2026");
    expect(formatDate("2026-10-07T23:30:00Z", "fr")).toBe("7 octobre 2026");
    expect(formatShortDate("2026-10-07", "en")).toBe("07 Oct 2026");
  });

  test("write nothing for a date that does not parse", () => {
    expect(formatDate("soon")).toBe("");
    expect(formatShortDate("soon", "ru")).toBe("");
  });
});
