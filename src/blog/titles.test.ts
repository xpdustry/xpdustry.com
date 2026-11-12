import { expect, test } from "vitest";
import { postTitle, topicLabel } from "./titles";

test.each([
  ["Beta 11: Admin panel", "4", "NoHorny 4 Beta 11: Admin panel"],
  ["Beta 3", undefined, "NoHorny Beta 3"],
  ["Say hello to NoHorny v4 beta 1", "4", "Say hello to NoHorny v4 beta 1"],
  ["NOHORNY update", "4", "NOHORNY update"]
])("builds the post title for %s", (title, topicVersion, expected) => {
  expect(postTitle({ title, topic: "NoHorny", topicVersion })).toBe(expected);
});

test.each([
  ["4", "NoHorny 4"],
  [undefined, "NoHorny"],
  ["", "NoHorny"]
])("labels the topic with version %s", (version, expected) => {
  expect(topicLabel("NoHorny", version)).toBe(expected);
});
