import type { ReactNode } from "react";
import { Texture } from "#app/components/ui/Texture";
import { patches } from "#app/data/textures";
import card from "#app/components/ui/Card.module.css";
import styles from "./Message.module.css";

const TEXTURE = patches("#86d8cf", "#a6e7e0", [
  [0.92, 0.5, 0.34, 1],
  [0.5, 1.08, 0.12, 1],
]);

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
    <main id="main" className={`${card.card} ${styles.message}`}>
      <Texture settings={TEXTURE} drift />
      <p className={styles.code}>{code}</p>
      <h1>{title}</h1>
      <div className={styles.body}>{children}</div>
    </main>
  );
}
