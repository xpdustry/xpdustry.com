import type { ParsedLocation } from "@tanstack/react-router";
import { expect, test } from "vitest";
import { transitionTypes } from "./viewTransition";

const at = (pathname: string, index: number) =>
  ({ pathname, state: { __TSR_index: index } }) as ParsedLocation;

const types = (from: ParsedLocation | undefined, to: ParsedLocation) =>
  transitionTypes({
    fromLocation: from,
    toLocation: to,
    pathChanged: from?.pathname !== to.pathname
  });

const POST = "/blog/nohorny-4-beta-8";

test.each([
  ["the first render", undefined, at("/", 0), false],
  ["a move within the page", at("/", 0), at("/", 1), false],
  ["home to the blog", at("/", 0), at("/blog", 1), ["deeper"]],
  ["the blog to home, by a link", at("/blog", 1), at("/", 2), ["shallower"]],
  ["a list to a post", at("/blog", 1), at(POST, 2), ["deeper", "post"]],
  ["a post to a list", at(POST, 2), at("/", 3), ["shallower", "post"]],
  ["a post to the next, by a link", at(POST, 2), at("/blog/other", 3), ["deeper"]],
  ["a post to the one before, by Back", at("/blog/other", 3), at(POST, 2), ["shallower"]]
] as const)("%s", (_, from, to, expected) => {
  expect(types(from, to)).toEqual(expected);
});
