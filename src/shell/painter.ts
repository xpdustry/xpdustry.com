import { FRAME_PAINTS, PAINT_NAMES } from "#app/textures/catalogue";
import worker from "#app/textures/painter.worker.ts?worker&url";
import { GROWN } from "#app/textures/texture";
import { inlineScript } from "./inlineScript";
import source from "./painter.script.ts?raw";

declare global {
  /** A texture's image once it is painted, or nothing when it cannot be. */
  var paints: ((key: string) => Promise<string | undefined>) | undefined;
}

/**
 * How soon a texture is wanted: the worker paints the lowest first. A blob's grown sprite waits
 * behind everything on show, as it only adds to a blob that is already there.
 */
const ORDER = { frame: 0, shown: 1, named: 2, grown: 3, below: 4 };

/** Where the painter's worker is, for the page to say so: its script carries the labyrinth. */
export const PAINTER_WORKER = worker;

export const PAINTER = inlineScript(source, PAINT_NAMES, FRAME_PAINTS, GROWN, ORDER);
