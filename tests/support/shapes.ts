import type { Page } from "playwright/test";

/**
 * What a browser without `shape()` keeps of a stylesheet: it drops each declaration that uses an
 * unknown function, and its `@supports` test for one fails. Renaming the function does both.
 */
const SHAPE_FUNCTION = /(?<![\w-])shape\(/g;

export const withoutShapes = (page: Page) =>
  page.route(/\.css(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const css = (await response.text()).replaceAll(SHAPE_FUNCTION, "unknown-shape(");
    await route.fulfill({ response, body: css });
  });
