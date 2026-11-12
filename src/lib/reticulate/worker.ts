// Renders textures off the main thread: a page asks for a few dozen at load, and again on resize.

import type { TextureSettings } from "#app/data/textures";
import { renderTexture } from "#app/lib/reticulate/field";
import { loadLabyrinth } from "#app/lib/reticulate/labyrinth";

export interface TextureRequest {
  id: number;
  settings: TextureSettings;
  width: number;
  height: number;
}

export type TextureResponse = { id: number; blob: Blob } | { id: number; error: string };

self.addEventListener("message", async (event: MessageEvent<TextureRequest>) => {
  const { id, settings, width, height } = event.data;
  try {
    const { pixels, ...size } = renderTexture(await loadLabyrinth(), settings, width, height);
    const canvas = new OffscreenCanvas(size.width, size.height);
    canvas.getContext("2d")!.putImageData(new ImageData(pixels, size.width, size.height), 0, 0);
    const blob = await canvas.convertToBlob();
    self.postMessage({ id, blob } satisfies TextureResponse);
  } catch (error) {
    self.postMessage({ id, error: String(error) } satisfies TextureResponse);
  }
});
