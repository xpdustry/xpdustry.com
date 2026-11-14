import type { ReactNode } from "react";
import { SITE } from "#app/brand/site";
import * as styles from "./ErrorPage.css";

export function ErrorPage({
  code,
  message,
  details,
  actions
}: {
  code: number;
  message: string;
  details: ReactNode;
  actions: ReactNode;
}) {
  return (
    <>
      <title>{`${code} - ${message} - ${SITE.name}`}</title>
      <meta name="robots" content="noindex" />
      <main id="main" className={`${styles.message} reveal`}>
        <p className={styles.code}>{code}</p>
        <h1 className={styles.title}>{message}</h1>
        <div className={styles.body}>
          <p>{details}</p>
          <div className={styles.actions}>{actions}</div>
        </div>
      </main>
    </>
  );
}
