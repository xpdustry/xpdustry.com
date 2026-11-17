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

interface PlinthLook {
  tone?: "teal" | "amber" | "ink";
  size?: "md" | "sm";
  icon?: boolean;
  copy?: CopyState;
  className?: string;
}

export type PlinthStyle = Pick<PlinthLook, "tone" | "size" | "className"> &
  ({ icon: true; "aria-label": string } | { icon?: false });

const TONE = { teal: undefined, amber: styles.tone.amber, ink: styles.tone.ink };
const SIZE = { md: undefined, sm: styles.sm };
const COPY: Record<CopyState, string | undefined> = {
  idle: undefined,
  copied: styles.done,
  failed: styles.failed
};

function plinthClass({ tone = "teal", size = "md", icon, copy = "idle", className }: PlinthLook) {
  return [styles.plinth, TONE[tone], SIZE[size], icon && styles.icon, COPY[copy], className]
    .filter(Boolean)
    .join(" ");
}

function Face({ children }: { children: ReactNode }) {
  return <span className={styles.face}>{children}</span>;
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  PlinthStyle & { ref?: Ref<HTMLAnchorElement> };

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

type TextAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  Pick<PlinthLook, "tone" | "size" | "className"> & { ref?: Ref<HTMLAnchorElement> };

const TextPlinthAnchor: (props: TextAnchorProps) => ReactNode = PlinthAnchor;

export const PlinthLink = createLink(TextPlinthAnchor);

type SectionLinkProps = Omit<ComponentProps<typeof PlinthLink>, "to" | "hash" | "resetScroll"> & {
  hash: "projects" | "gamemodes" | "team";
};

export function PlinthSectionLink({ hash, ...props }: SectionLinkProps) {
  return (
    <PlinthLink
      {...props}
      to="/"
      hash={hash}
      // The router takes a link to where it already is for a reload, and would put the scroll
      // back where it was.
      resetScroll={false}
      activeOptions={{ exact: true, includeHash: true }}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  PlinthStyle & {
    ref?: Ref<HTMLButtonElement>;
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
