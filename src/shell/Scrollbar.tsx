import { media } from "#app/ui/styles/media";
import { inPage, inlineScript } from "./inlineScript";
import source from "./scrollbar.script.ts?raw";
import * as styles from "./Scrollbar.css";

const SCROLLBAR = inlineScript(
  source,
  inPage("document.currentScript.previousElementSibling"),
  styles.THUMB,
  media.fine
);

export function Scrollbar() {
  return (
    <>
      <div className={styles.track} aria-hidden="true" suppressHydrationWarning>
        <div className={styles.thumb} suppressHydrationWarning />
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCROLLBAR }} />
    </>
  );
}
