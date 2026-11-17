import { media } from "#app/ui/styles/media";
import { inPage, inlineScript } from "./inlineScript";
import source from "./scrollbar.script.ts?raw";
import * as styles from "./Scrollbar.css";

const SCROLLBAR = inlineScript(
  source,
  inPage("document.currentScript.previousElementSibling"),
  styles.INSET,
  styles.SHORTEST,
  styles.IDLE,
  styles.REACH,
  media.fine
);

/** The page's scrollbar, drawn over it so that it never narrows the layout. */
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
