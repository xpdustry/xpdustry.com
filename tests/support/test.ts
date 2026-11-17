import { test as base } from "playwright/test";

export { expect } from "playwright/test";
export type { CDPSession, Locator, Page } from "playwright/test";

interface Options {
  /**
   * Whether the painter's worker may paint the procedural textures. Painting is most of what a
   * page load costs, and only the entrance and the spreads look at a texture: elsewhere the worker
   * is refused, the painter gives up at once and every texture shows unpainted, as the stall
   * deadline would show it. Textures are backgrounds and masks, so no text or control moves.
   */
  paintsTextures: boolean;
}

export const test = base.extend<Options>({
  paintsTextures: [false, { option: true }],
  context: async ({ context, paintsTextures }, use) => {
    if (!paintsTextures) await context.route(/painter\.worker/, (route) => route.abort());
    await use(context);
  }
});
