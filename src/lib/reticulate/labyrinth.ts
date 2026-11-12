import labyrinthUrl from "#app/assets/reticulate.png?url";
import type { Labyrinth } from "#app/lib/reticulate/field";

let loading: Promise<Labyrinth> | undefined;

/**
 * The reaction-diffusion tile (`pnpm pattern` regenerates it), decoded to alpha in 0..1.
 * Works on the main thread and in workers alike.
 */
export function loadLabyrinth(): Promise<Labyrinth> {
  loading ??= (async () => {
    const response = await fetch(labyrinthUrl);
    const bitmap = await createImageBitmap(await response.blob());
    const size = bitmap.width;
    const context = new OffscreenCanvas(size, size).getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const rgba = context.getImageData(0, 0, size, size).data;

    let max = 0;
    for (let i = 3; i < rgba.length; i += 4) max = Math.max(max, rgba[i]!);
    const data = new Float32Array(size * size);
    for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3]! / max;
    return { data, size };
  })();
  return loading;
}
