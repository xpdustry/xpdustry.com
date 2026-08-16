import { Show } from "solid-js";
import { useTheme } from "#app/components/layout/ThemeProvider";
import { MoonIcon, SunIcon } from "#app/components/system/Icons";
import { Button } from "#app/components/system/Pressable";

export interface ThemeToggleProps {
  block?: boolean;
  /** Drawer copy reads better with a word than with a bare icon. */
  showLabel?: boolean;
  class?: string;
}

/**
 * Flips the theme shared by every toggle in the site shell.
 */
export function ThemeToggle(props: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const next = () => (theme() === "dark" ? "light" : "dark");
  const name = () => (theme() === null ? "Switch theme" : `Switch to the ${next()} theme`);

  return (
    <Button
      type="button"
      variant={props.block ? "ghost" : "plain"}
      class={props.class}
      icon={!props.showLabel}
      block={props.block}
      aria-label={props.showLabel ? undefined : name()}
      title={name()}
      onClick={toggleTheme}
    >
      <Show when={theme() === "dark"} fallback={<MoonIcon />}>
        <SunIcon />
      </Show>
      <Show when={props.showLabel}>{name()}</Show>
    </Button>
  );
}
