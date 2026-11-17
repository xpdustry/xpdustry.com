import type { LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, type Icon } from "./icons";
import { PlinthAnchor, PlinthLink } from "./Plinth";
import * as styles from "./Tray.css";

type TrayAction = { label: string } & (
  | { to: LinkComponentProps["to"]; href?: never }
  | { href: string; to?: never }
);

interface TrayProps {
  id: string;
  icon: Icon;
  title: string;
  subtitle?: ReactNode;
  action?: TrayAction;
  children: ReactNode;
}

export function Tray({ id, icon: Icon, title, subtitle, action, children }: TrayProps) {
  return (
    <section id={id} className={`${styles.tray} reveal`}>
      <span className={styles.body} aria-hidden="true" />
      <header className={styles.tab}>
        <span className={styles.icon}>
          <Icon />
        </span>
        <span className={styles.titles}>
          <h2>{title}</h2>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
        {action && <TabAction action={action} />}
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}

function TabAction({ action }: { action: TrayAction }) {
  const plinth = {
    tone: "ink",
    size: "sm",
    className: styles.action,
    "aria-label": action.label
  } as const;
  return action.to !== undefined ? (
    <PlinthLink {...plinth} to={action.to} activeOptions={{ exact: true }}>
      <ArrowRight />
    </PlinthLink>
  ) : (
    <PlinthAnchor {...plinth} href={action.href}>
      <ArrowUpRight />
    </PlinthAnchor>
  );
}
