/**
 * Copy-to-clipboard with an outcome the user can actually see.
 *
 * The Clipboard API needs a secure context and a permission that can be
 * refused, so the failure path is not exotic. It is what happens over plain
 * HTTP. When it fails the button says so and the text stays selectable, and
 * a polite live region announces either outcome to assistive technology.
 */

import type { JSX } from "@solidjs/web";
import { createSignal, onSettled, Show } from "solid-js";
import { CheckIcon } from "#app/components/system/Icons";
import { Button, type ButtonSize, type ButtonVariant } from "#app/components/system/Pressable";

export interface CopyButtonProps {
  /** The exact text to copy. */
  value: string;
  label?: string;
  /** What the live region says on success, e.g. `Copied survival.md.xpdustry.com`. */
  announcement?: string;
  /**
   * Square, with the label carried as the accessible name instead of set in
   * type. The outcome still shows: the glyph becomes a tick on success, so
   * the button reports it without a word of layout.
   */
  icon?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  class?: string;
  children?: JSX.Element;
}

type Outcome = "idle" | "copied" | "failed";

const RESET_DELAY_MS = 2400;

export function CopyButton(props: CopyButtonProps) {
  const [outcome, setOutcome] = createSignal<Outcome>("idle");
  const [message, setMessage] = createSignal("");

  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  onSettled(() => () => clearTimeout(resetTimer));

  const settle = (next: Outcome, announced: string) => {
    setOutcome(next);
    setMessage(announced);
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
        class={props.class}
        aria-label={props.icon ? label() : undefined}
        title={props.icon ? label() : undefined}
        onClick={() => void copy()}
      >
        <Show when={props.icon && outcome() === "copied"} fallback={props.children}>
          <CheckIcon />
        </Show>
        <Show when={!props.icon}>{label()}</Show>
      </Button>
      {/* Off-screen rather than hidden: a display:none region is not announced. */}
      <span class="sr-only" role="status" aria-live="polite">
        {message()}
      </span>
    </>
  );
}
