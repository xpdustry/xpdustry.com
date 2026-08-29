import type { JSX } from "@solidjs/web";
import { omit, type ParentProps } from "solid-js";
import {
  pressable,
  pressableFace,
  type ButtonFormat,
  type ButtonSize,
  type ButtonVariant,
} from "#app/components/system/Pressable.css";

export type { ButtonFormat, ButtonSize, ButtonVariant } from "#app/components/system/Pressable.css";

interface PressableOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  block?: boolean;
  format?: ButtonFormat;
}

type NativeButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "class" | "classList" | "style" | "children"
>;

type NativeLinkProps = Omit<
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  "class" | "classList" | "style" | "children"
>;

function withClass(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

export type ButtonProps = ParentProps<PressableOptions & NativeButtonProps>;

export function Button(props: ButtonProps) {
  const rest = omit(props, "variant", "size", "icon", "block", "format", "children");
  const faceClass = () =>
    pressableFace({
      size: props.size,
      icon: props.icon,
      format: props.format,
    });

  return (
    <button
      {...rest}
      class={pressable({
        variant: props.variant,
        size: props.size,
        block: props.block,
        disabled: props.disabled === true || props.disabled === "",
      })}
    >
      <span class={faceClass()}>{props.children}</span>
    </button>
  );
}

export type ButtonLinkProps = ParentProps<PressableOptions & NativeLinkProps>;

export function ButtonLink(props: ButtonLinkProps) {
  const rest = omit(props, "variant", "size", "icon", "block", "format", "children");
  const faceClass = () =>
    pressableFace({
      size: props.size,
      icon: props.icon,
      format: props.format,
    });

  return (
    <a
      {...rest}
      class={pressable({
        variant: props.variant,
        size: props.size,
        block: props.block,
        disabled: props["aria-disabled"] === "true",
      })}
    >
      <span class={faceClass()}>{props.children}</span>
    </a>
  );
}

export type CardLinkProps = ParentProps<
  NativeLinkProps & {
    class?: string;
    faceClass?: string;
  }
>;

export function CardLink(props: CardLinkProps) {
  const rest = omit(props, "class", "faceClass", "children");

  return (
    <a {...rest} class={withClass(pressable({ card: true }), props.class)}>
      <span class={withClass(pressableFace({ card: true }), props.faceClass)}>
        {props.children}
      </span>
    </a>
  );
}
