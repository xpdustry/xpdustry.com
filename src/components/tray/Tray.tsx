import type { LinkComponentProps } from "@tanstack/react-router";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { measureShell, shellPath } from "#app/components/tray/shell";
import { ArrowRight, ArrowUpRight } from "#app/components/ui/Icons";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
import styles from "./Tray.module.css";

type TrayAction = { label: string } & (
  | { to: LinkComponentProps["to"]; href?: never }
  | { href: string; to?: never }
);

interface TrayProps {
  id: string;
  /** A Mindustry sprite on the tab. */
  icon: string;
  title: string;
  subtitle?: ReactNode;
  /** The tab's button, which the whole tab answers to. */
  action?: TrayAction;
  className?: string;
  children: ReactNode;
}

/**
 * A folder of cards: a tray with a tab on its top-left. Until the shell is drawn (and without
 * JavaScript) it is a flat tray; `Trays` then outlines it.
 */
export function Tray({ id, icon, title, subtitle, action, className, children }: TrayProps) {
  return (
    <section id={id} className={`${styles.tray} ${className ?? ""}`} data-tray="">
      <svg className={styles.shell} aria-hidden="true">
        <path className={styles.face} />
        <path className={styles.line} />
      </svg>
      <header className={styles.tab} data-tray-tab="">
        <span className={styles.icon}>
          <img className="sprite" src={icon} alt="" />
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

/**
 * Lays out the trays inside: every tab gets the widest tab's width, so the buttons line up, then
 * each tray's shell is drawn around its tab. Redone whenever the page resizes.
 */
export function Trays({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const redraw = () => {
      const trays = [...root.current!.querySelectorAll<HTMLElement>("[data-tray]")];
      const tabs = trays.map((tray) => tray.querySelector<HTMLElement>("[data-tray-tab]")!);
      for (const tab of tabs) tab.style.width = "";
      const widest = Math.max(...tabs.map((tab) => tab.getBoundingClientRect().width));
      for (const tab of tabs) tab.style.width = `${widest}px`;

      trays.forEach((tray, index) => drawShell(tray, tabs[index]!));
    };

    redraw();
    void document.fonts.ready.then(redraw);
    const observer = new ResizeObserver(redraw);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return <div ref={root}>{children}</div>;
}

/** How far below the shell's face its wall reaches, so the outline's bottom is never clipped. */
const WALL = 8;

function drawShell(tray: HTMLElement, tab: HTMLElement): void {
  const geometry = measureShell(tray, tab);
  const svg = tray.querySelector<SVGSVGElement>(":scope > svg")!;
  const [face, line] = svg.querySelectorAll("path");
  svg.style.top = `${-geometry.rise}px`;
  svg.setAttribute("width", String(geometry.width));
  svg.setAttribute("height", String(geometry.height + geometry.rise + WALL));
  face!.setAttribute("d", shellPath(geometry));
  line!.setAttribute("d", shellPath(geometry, 1));
  tray.dataset.shell = "";
}
