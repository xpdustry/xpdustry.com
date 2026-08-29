import { useLocation } from "@solidjs/router";
import { HttpStatus } from "#app/components/layout/HttpStatus";
import { PageMeta } from "#app/components/layout/PageMeta";
import { ButtonLink } from "#app/components/system/Pressable";
import * as styles from "#app/components/layout/NotFound.css";

export function NotFound() {
  const location = useLocation();

  return (
    <>
      <HttpStatus code={404} />
      <PageMeta
        title="Page not found"
        description="That page does not exist on the Xpdustry site."
        path={location.pathname}
      />
      <div class={styles.page}>
        <p class={styles.code}>404</p>
        <h1 class={styles.title}>Oh no, this page does not exist</h1>
        <p class={styles.message}>Here's the way back.</p>
        <div class={styles.actions}>
          <ButtonLink variant="accent" href="/">
            Home
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
