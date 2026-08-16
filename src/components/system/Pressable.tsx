/** Raised buttons and card links. */

import type { JSX } from "@solidjs/web";
import { omit, type ParentProps } from "solid-js";
import styles from "#app/components/system/Pressable.module.css";

export type ButtonVariant = "accent" | "plain" | "outline" | "ghost" | "signal" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface PressableShape {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  block?: boolean;
  class?: string;
  faceClass?: string;
}

function baseClass(props: PressableShape) {
  return [
    styles.base,
    styles[props.variant ?? "plain"],
    props.class,
    {
      [styles.small]: props.size === "sm",
      [styles.large]: props.size === "lg",
      [styles.icon]: !!props.icon,
      [styles.block]: !!props.block,
    },
  ];
}

export type ButtonProps = ParentProps<
  PressableShape & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class" | "children">
>;

export function Button(props: ButtonProps) {
  const rest = omit(props, "variant", "size", "icon", "block", "class", "faceClass", "children");
  return (
    <button {...rest} class={baseClass(props)}>
      <span class={[styles.face, props.faceClass]}>{props.children}</span>
    </button>
  );
}

export type ButtonLinkProps = ParentProps<
  PressableShape & Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "class" | "children">
>;

export function ButtonLink(props: ButtonLinkProps) {
  const rest = omit(props, "variant", "size", "icon", "block", "class", "faceClass", "children");
  return (
    <a {...rest} class={baseClass(props)}>
      <span class={[styles.face, props.faceClass]}>{props.children}</span>
    </a>
  );
}

export type CardLinkProps = ParentProps<
  Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "class" | "children"> & {
    class?: string;
    faceClass?: string;
  }
>;

export function CardLink(props: CardLinkProps) {
  const rest = omit(props, "class", "faceClass", "children");
  return (
    <a {...rest} class={[styles.base, styles.card, props.class]}>
      <span class={[styles.face, props.faceClass]}>{props.children}</span>
    </a>
  );
}
