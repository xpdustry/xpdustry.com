import { createLink } from "@tanstack/react-router";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
  ReactNode,
  Ref
} from "react";
import type { CopyState } from "./copy/useCopy";
import { outbound } from "./outbound";
import * as styles from "./Plinth.css";

export interface PlinthStyle {
  /** Teal for the main action, amber for playing, ink for the rest. */
  tone?: "teal" | "amber" | "ink";
  size?: "md" | "sm";
  /** A square button around a single icon; give it an `aria-label`. */
  icon?: boolean;
  className?: string;
}

const TONE = { teal: undefined, amber: styles.tone.amber, ink: styles.tone.ink };
const SIZE = { md: undefined, sm: styles.sm };
/** Teal and still once a copy landed, red and still when the browser refused it. */
const COPY: Record<CopyState, string | undefined> = {
  idle: undefined,
  copied: styles.done,
  failed: styles.failed
};

function plinthClass({
  tone = "teal",
  size = "md",
  icon,
  copy = "idle",
  className
}: PlinthStyle & { copy?: CopyState }) {
  return [styles.plinth, TONE[tone], SIZE[size], icon && styles.icon, COPY[copy], className]
    .filter(Boolean)
    .join(" ");
}

function Face({ children }: { children: ReactNode }) {
  return <span className={styles.face}>{children}</span>;
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  PlinthStyle & { ref?: Ref<HTMLAnchorElement> };

/** A plinth to an address: one that leaves the site opens in a new tab. */
export function PlinthAnchor({ tone, size, icon, className, children, ...props }: AnchorProps) {
  return (
    <a
      className={plinthClass({ tone, size, icon, className })}
      {...outbound(props.href)}
      {...props}
    >
      <Face>{children}</Face>
    </a>
  );
}

/** A plinth to a page of the site, with the router's typed `to`, preloading and active state. */
export const PlinthLink = createLink(PlinthAnchor);

type SectionLinkProps = Omit<ComponentProps<typeof PlinthLink>, "to" | "hash" | "resetScroll"> & {
  hash: "projects" | "gamemodes";
};

/**
 * A plinth to a section of the home page. It goes straight to the section, even from the home
 * page with the section already in the address: the router takes a link to where it already is
 * for a reload, and would put the scroll back where it was.
 */
export function PlinthSectionLink({ hash, ...props }: SectionLinkProps) {
  return (
    <PlinthLink
      {...props}
      to="/"
      hash={hash}
      resetScroll={false}
      activeOptions={{ exact: true, includeHash: true }}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  PlinthStyle & {
    ref?: Ref<HTMLButtonElement>;
    /** How the copy the button made went. */
    copy?: CopyState;
  };

export function PlinthButton({
  tone,
  size,
  icon,
  copy,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={plinthClass({ tone, size, icon, copy, className })} {...props}>
      <Face>{children}</Face>
    </button>
  );
}
