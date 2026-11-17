import { texture } from "#app/textures/enter";
import { media } from "#app/ui/styles/media";
import source from "./drift.script.ts?raw";
import { inPage, inlineScript } from "./inlineScript";
import * as styles from "./Background.css";

const DRIFT = inlineScript(
  source,
  inPage("document.currentScript.previousElementSibling.firstElementChild"),
  media.motion,
  styles.TILE,
  styles.FAR,
  styles.NEAR
);

export function Background() {
  return (
    <>
      <div className={styles.clip} aria-hidden="true">
        <div className={styles.background} {...texture("backdrop")} suppressHydrationWarning />
      </div>
      <script dangerouslySetInnerHTML={{ __html: DRIFT }} />
      <div className={styles.crown} data-crown="" aria-hidden="true" {...texture("drop")} />
    </>
  );
}
