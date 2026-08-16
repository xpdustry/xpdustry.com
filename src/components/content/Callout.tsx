import type { ParentProps } from "solid-js";

export type CalloutVariant = "note" | "warn" | "danger";

/**
 * A flat aside with a coloured rail. Note keeps the neutral line colour: the
 * accent owns pressable surfaces, and an aside is not one.
 */
export function Callout(props: ParentProps<{ variant?: CalloutVariant; label?: string }>) {
  const variant = () => props.variant ?? "note";
  const badgeClass = () =>
    variant() === "danger"
      ? "border-danger-wall bg-danger text-white"
      : variant() === "warn"
        ? "border-signal-wall bg-signal text-on-signal"
        : "border-line-soft bg-page-sunk text-ink-muted";

  return (
    <aside
      class={[
        "grid justify-items-start gap-3 rounded-lg border border-l-4 border-line-soft border-l-line bg-panel px-6 py-4",
        {
          "callout--warn": variant() === "warn",
          "callout--danger": variant() === "danger",
        },
      ]}
    >
      <span
        class={[
          "inline-flex items-center gap-2 rounded-sm border px-3 py-0.75 font-mono text-xs leading-normal font-semibold tracking-tight whitespace-nowrap",
          badgeClass(),
        ]}
      >
        {props.label ?? "Note"}
      </span>
      {props.children}
    </aside>
  );
}
