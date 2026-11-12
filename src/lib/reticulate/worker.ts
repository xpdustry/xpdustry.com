// Renders one texture at a time off the main thread; `textures.ts` keeps a few of these busy.

import type { TextureSettings } from "#app/data/textures";
import { renderTexture } from "#app/lib/reticulate/field";
import { loadLabyrinth } from "#app/lib/reticulate/labyrinth";

export interface TextureRequest {
  settings: TextureSettings;
  width: number;
  height: number;
}

export type TextureResponse = { blob: Blob } | { error: string };

self.addEventListener("message", async (event: MessageEvent<TextureRequest>) => {
  const { settings, width, height } = event.data;
  try {
    const { pixels, ...size } = renderTexture(await loadLabyrinth(), settings, width, height);
    const canvas = new OffscreenCanvas(size.width, size.height);
    canvas.getContext("2d")!.putImageData(new ImageData(pixels, size.width, size.height), 0, 0);
    self.postMessage({ blob: await canvas.convertToBlob() } satisfies TextureResponse);
  } catch (error) {
    self.postMessage({ error: String(error) } satisfies TextureResponse);
  }
});
