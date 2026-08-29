import type { JSX } from "@solidjs/web";
import { children, createSignal, onSettled, Show } from "solid-js";
import { CheckIcon } from "#app/components/system/Icons";
import {
  Button,
  type ButtonFormat,
  type ButtonSize,
  type ButtonVariant,
} from "#app/components/system/Pressable";
import { status } from "#app/components/system/CopyButton.css";

export interface CopyButtonProps {
  value: string;
  label?: string;
  announcement?: string;
  icon?: boolean;
  block?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  format?: ButtonFormat;
  children?: JSX.Element;
}

type Outcome = "idle" | "copied" | "failed";
const RESET_DELAY_MS = 2400;

export function CopyButton(props: CopyButtonProps) {
  const content = children(() => props.children);
  const [outcome, setOutcome] = createSignal<Outcome>("idle");
  const [message, setMessage] = createSignal("");
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  onSettled(() => () => clearTimeout(resetTimer));

  const settle = (next: Outcome, announcement: string) => {
    setOutcome(next);
    setMessage(announcement);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      setOutcome("idle");
      setMessage("");
    }, RESET_DELAY_MS);
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(props.value);
      settle("copied", props.announcement ?? `Copied ${props.value}`);
    } catch {
      settle("failed", `Could not copy. Select ${props.value} and copy it manually.`);
    }
  };

  const label = () => {
    if (outcome() === "copied") return "Copied";
    if (outcome() === "failed") return "Copy failed";
    return props.label ?? "Copy";
  };

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? "plain"}
        size={props.size ?? "sm"}
        icon={props.icon}
        block={props.block}
        format={props.format}
        aria-label={props.icon || props.label !== undefined ? label() : undefined}
        title={props.icon ? label() : undefined}
        onClick={() => void copy()}
      >
        <Show
          when={props.icon}
          fallback={
            <Show when={outcome() === "idle" && content() !== undefined} fallback={label()}>
              {content()}
            </Show>
          }
        >
          <Show when={outcome() === "copied"} fallback={content()}>
            <CheckIcon />
          </Show>
        </Show>
      </Button>
      <span class={status} role="status" aria-live="polite">
        {message()}
      </span>
    </>
  );
}
