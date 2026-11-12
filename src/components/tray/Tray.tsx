import type { LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, type Icon } from "#app/components/ui/Icons";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
import styles from "./Tray.module.css";

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
  className?: string;
  children: ReactNode;
}

// The tab's right side slants down to the tray's top, its bends softened: a fixed piece, as
// the tab is always as tall. In px.
const RISE = 70;
const RUN = 35;
const BEND = 14;
const SLANT = { width: RUN + 2 * BEND, height: RISE + 2 };

/**
 * The slant's outline, inset by `inset` px (half the stroke, for the line). Rounded, as engines
 * print floats differently and the server's path must match the browser's.
 */
function slantPath(inset: number): string {
  const length = Math.hypot(RUN, RISE);
  const [u, v] = [(RUN / length) * BEND, (RISE / length) * BEND];
  const [x0, x1, i] = [BEND, BEND + RUN, inset];
  const n = (value: number) => Math.round(value * 100) / 100;
  return (
    `M0 ${i}Q${x0} ${i} ${n(x0 + u)} ${n(i + v)}L${n(x1 - u)} ${n(RISE + i - v)}` +
    `Q${x1} ${RISE + i} ${SLANT.width} ${RISE + i}`
  );
}

const SLANT_LINE = slantPath(1);
const SLANT_FACE = `${slantPath(0)}V${SLANT.height}H0Z`;

/**
 * A folder of cards: a tray with a tab on its top-left, drawn in CSS around the tab's fixed
 * width, so it is whole before any script runs.
 */
export function Tray({ id, icon: Icon, title, subtitle, action, className, children }: TrayProps) {
  return (
    <section id={id} className={`${styles.tray} reveal ${className ?? ""}`}>
      <span className={styles.body} aria-hidden="true" />
      <header className={styles.tab}>
        <svg className={styles.slant} width={SLANT.width} height={SLANT.height} aria-hidden="true">
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
        {action?.to !== undefined && (
          <PlinthLink
            tone="ink"
            size="sm"
            className={styles.action}
            to={action.to}
            activeOptions={{ exact: true }}
            aria-label={action.label}
          >
            <ArrowRight />
          </PlinthLink>
        )}
        {action?.href !== undefined && (
          <PlinthAnchor
            tone="ink"
            size="sm"
            className={styles.action}
            href={action.href}
            aria-label={action.label}
          >
            <ArrowUpRight />
          </PlinthAnchor>
        )}
      </header>
      {children}
    </section>
  );
}
