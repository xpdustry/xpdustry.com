import { Show } from "solid-js";
import { useTheme } from "#app/components/layout/ThemeProvider";
import { MoonIcon, SunIcon } from "#app/components/system/Icons";
import { Button } from "#app/components/system/Pressable";

export interface ThemeToggleProps {
  block?: boolean;
  showLabel?: boolean;
}

export function ThemeToggle(props: ThemeToggleProps) {
  const { resolved, toggle } = useTheme();
  const next = () => (resolved() === "dark" ? "light" : "dark");
  const name = () => `Switch to the ${next()} theme`;

  return (
    <Button
      type="button"
      variant={props.block ? "ghost" : "plain"}
      icon={!props.showLabel}
      block={props.block}
      aria-label={props.showLabel ? undefined : name()}
      title={name()}
      onClick={toggle}
    >
      <Show when={resolved() === "dark"} fallback={<MoonIcon />}>
        <SunIcon />
      </Show>
      <Show when={props.showLabel}>{name()}</Show>
    </Button>
  );
}
