import type { LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
import { ArrowRight, ArrowUpRight, type Icon } from "#app/lib/icons";
import * as styles from "./Tray.css";

type TrayAction = { label: string } & (
  | { to: LinkComponentProps["to"]; href?: never }
  | { href: string; to?: never }
);

interface TrayProps {
  id: string;
  /** What the tray holds, on its tab. */
  icon: Icon;
  title: string;
  subtitle?: ReactNode;
  /** The tab's button, which the whole tab answers to. */
  action?: TrayAction;
  children: ReactNode;
}

const RISE = 70;
const RUN = 35;
const BEND = 14;
const SLANT = { width: RUN + 2 * BEND, height: RISE + 2 };

const toHundredths = (value: number) => Math.round(value * 100) / 100;

function slantPath(inset: number): string {
  const length = Math.hypot(RUN, RISE);
  const [u, v] = [(RUN / length) * BEND, (RISE / length) * BEND];
  const [x0, x1, i] = [BEND, BEND + RUN, inset];
  return (
    `M0 ${i}Q${x0} ${i} ${toHundredths(x0 + u)} ${toHundredths(i + v)}L${toHundredths(x1 - u)} ${toHundredths(RISE + i - v)}` +
    `Q${x1} ${RISE + i} ${SLANT.width} ${RISE + i}`
  );
}

const SLANT_LINE = slantPath(1);
const SLANT_FACE = `${slantPath(0)}V${SLANT.height}H0Z`;

export function Tray({ id, icon: Icon, title, subtitle, action, children }: TrayProps) {
  return (
    <section id={id} className={`${styles.tray} reveal`}>
      <span className={styles.body} aria-hidden="true" />
      <header className={styles.tab}>
        <svg
          className={styles.slant}
          width={SLANT.width}
          height={SLANT.height}
          viewBox={`0 0 ${SLANT.width} ${SLANT.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className={styles.face} d={SLANT_FACE} />
          <path className={styles.line} d={SLANT_LINE} />
        </svg>
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
