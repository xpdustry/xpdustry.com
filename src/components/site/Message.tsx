import type { ReactNode } from "react";
import { PATCHES } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./Message.css";

export function Message({
  code,
  title,
  children
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
