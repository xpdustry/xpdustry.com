import type { ReactNode } from "react";
import { Patches } from "#app/components/ui/Patches";
import { PATCHES } from "#app/data/patches";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./Message.css";

/** A page that is only a message, such as a 404: a status code, what happened, a way on. */
export function Message({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className={`${card.card} ${styles.message} reveal`}>
      <Patches patches={PATCHES.message} />
      <p className={styles.code}>{code}</p>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.body}>{children}</div>
    </main>
  );
}
