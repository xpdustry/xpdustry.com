import { FRAME_PAINTS, PAINT_NAMES } from "#app/textures/catalogue";
import worker from "#app/textures/painter.worker.ts?worker&url";
import { GROWN } from "#app/textures/texture";
import { inlineScript } from "./inlineScript";
import source from "./painter.script.ts?raw";

declare global {
  var paints: ((key: string) => Promise<string | undefined>) | undefined;
}

const PAINTED_FIRST_TO_LAST = ["frame", "shown", "named", "grown", "below"] as const;

const PRIORITY = Object.fromEntries(
  PAINTED_FIRST_TO_LAST.map((stage, priority) => [stage, priority])
) as Record<(typeof PAINTED_FIRST_TO_LAST)[number], number>;

export const PAINTER_WORKER_URL = worker;

export const PAINTER = inlineScript(source, PAINT_NAMES, FRAME_PAINTS, GROWN, PRIORITY);
