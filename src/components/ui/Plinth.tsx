import { createLink } from "@tanstack/react-router";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
  ReactNode,
  Ref,
} from "react";
import styles from "./Plinth.module.css";

export interface PlinthStyle {
  /** Teal for the main action, amber for playing, ink for the rest. */
  tone?: "teal" | "amber" | "ink";
  size?: "md" | "sm";
  /** A square button around a single icon; give it an `aria-label`. */
  icon?: boolean;
  /** Teal, as after a copy. */
  done?: boolean;
  className?: string;
}

export function plinthClass({ tone = "teal", size = "md", icon, done, className }: PlinthStyle) {
  return [
    styles.plinth,
    tone !== "teal" && styles[tone],
    size === "sm" && styles.sm,
    icon && styles.icon,
    done && styles.done,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Face({ children }: { children: ReactNode }) {
  return <span className={styles.face}>{children}</span>;
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  PlinthStyle & { ref?: Ref<HTMLAnchorElement> };

/** A plinth leaving the site. */
export function PlinthAnchor({
  tone,
  size,
  icon,
  done,
  className,
  children,
  ...props
}: AnchorProps) {
  return (
    <a className={plinthClass({ tone, size, icon, done, className })} {...props}>
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
  PlinthStyle & { ref?: Ref<HTMLButtonElement> };

export function PlinthButton({
  tone,
  size,
  icon,
  done,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={plinthClass({ tone, size, icon, done, className })} {...props}>
      <Face>{children}</Face>
    </button>
  );
}
