import source from "./assets/labyrinth.avif?inline";
import { painting } from "./catalogue.ts";
import { paintTexture, toLabyrinth, type Labyrinth } from "./paint.ts";

/**
 * Paints the site's textures off the main thread, from the one labyrinth tile every texture is
 * made of. The tile comes inside this script, so the worker has it the moment it starts: nothing
 * else is fetched, and nothing has to cross from the page. The page sends the key of each texture
 * it wants and how soon; each comes back as an image, or as nothing when it could not be painted.
 */
interface PainterRequest {
  key: string;
  priority: number;
}
interface PainterResponse {
  key: string;
  image?: Blob;
}

interface Job {
  key: string;
  priority: number;
  order: number;
}

const jobs: Job[] = [];
let received = 0;
let working = false;

/** The tile's pattern: its red channel, as it decodes to an opaque grey. */
async function decode(file: Blob): Promise<Labyrinth> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d")!;
  context.drawImage(bitmap, 0, 0);
  return toLabyrinth(context.getImageData(0, 0, bitmap.width, bitmap.height).data, 4, bitmap.width);
}

const labyrinth: Promise<Labyrinth | undefined> = fetch(source)
  .then((response) => response.blob())
  .then(decode)
  .catch(() => undefined);

async function paint(tile: Labyrinth, key: string): Promise<Blob> {
  const { settings, width, height } = painting(key);
  const painted = paintTexture(tile, settings, width, height);
  const canvas = new OffscreenCanvas(painted.width, painted.height);
  canvas
    .getContext("2d")!
    .putImageData(new ImageData(painted.pixels, painted.width, painted.height), 0, 0);
  return canvas.convertToBlob();
}

/** The most urgent job, the oldest among equals. */
function next(): Job | undefined {
  jobs.sort((a, b) => a.priority - b.priority || a.order - b.order);
  return jobs.shift();
}

async function work() {
  if (working) return;
  working = true;
  const tile = await labyrinth;
  for (let job = next(); job; job = next()) {
    const image = tile && (await paint(tile, job.key).catch(() => undefined));
    postMessage({ key: job.key, image } satisfies PainterResponse);
  }
  working = false;
}

addEventListener("message", ({ data }: MessageEvent<PainterRequest>) => {
  jobs.push({ ...data, order: received++ });
  void work();
});
