import { writeFileSync } from "node:fs";
import { ASSETS, LABYRINTH, encodeLabyrinth } from "./labyrinth.ts";
import { SHAPES, shapesModule } from "./logo-shapes.ts";

const labyrinth = await encodeLabyrinth();
writeFileSync(new URL(LABYRINTH, ASSETS), labyrinth);
writeFileSync(SHAPES, shapesModule());

console.log(`the labyrinth, ${labyrinth.length} bytes, and the logo's shapes`);
