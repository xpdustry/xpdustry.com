import source from "./enter.script.ts?raw";
import { inlineScript } from "./inlineScript";
import { faceFrom, riseFrom } from "#app/textures/enter.css";

export const ENTER = inlineScript(source, faceFrom, riseFrom);
