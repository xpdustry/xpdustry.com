/**
 * Icons, from the two libraries that own them.
 *
 * Lucide for interface glyphs and Simple Icons for brand marks: Lucide
 * dropped brands years ago, and a hand-traced GitHub logo is someone else's
 * trademark drifting out of date in our repository.
 *
 * Both come in through their framework-agnostic entry points, which hand over
 * path data rather than components. `lucide-solid` is compiled against Solid
 * 1 and this project runs the Solid 2 beta, so its components are not
 * something to bet the site's chrome on. Path data has no such problem, and
 * one small renderer for each family is the whole cost.
 *
 * `aria-hidden` on all of them: every one sits next to a label or inside a
 * control that carries its own accessible name.
 */

import { Dynamic, type JSX } from "@solidjs/web";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Mail,
  Menu,
  Moon,
  Sun,
  X,
  type IconNode,
} from "lucide";
import { siDiscord, siGithub } from "simple-icons";
import { For, omit } from "solid-js";

export type IconProps = JSX.SvgSVGAttributes<SVGSVGElement>;

/** Lucide's own defaults. Size is left to CSS, which overrides them anyway. */
const STROKE_ATTRIBUTES = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
} as const;

/** A Lucide glyph: a list of stroked shapes in a 24-unit box. */
function StrokeIcon(props: IconProps & { node: IconNode }) {
  const rest = omit(props, "node");
  return (
    <svg {...STROKE_ATTRIBUTES} {...rest} aria-hidden="true">
      <For each={props.node}>
        {([tag, attributes]) => <Dynamic component={tag} {...attributes} />}
      </For>
    </svg>
  );
}

/** A Simple Icons brand mark: one filled path, no stroke. */
function BrandIcon(props: IconProps & { path: string }) {
  const rest = omit(props, "path");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...rest}
      aria-hidden="true"
    >
      <path d={props.path} />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return <BrandIcon {...props} path={siGithub.path} />;
}

export function DiscordIcon(props: IconProps) {
  return <BrandIcon {...props} path={siDiscord.path} />;
}

export function MenuIcon(props: IconProps) {
  return <StrokeIcon {...props} node={Menu} />;
}

export function CloseIcon(props: IconProps) {
  return <StrokeIcon {...props} node={X} />;
}

export function ChevronDownIcon(props: IconProps) {
  return <StrokeIcon {...props} node={ChevronDown} />;
}

export function SunIcon(props: IconProps) {
  return <StrokeIcon {...props} node={Sun} />;
}

export function MoonIcon(props: IconProps) {
  return <StrokeIcon {...props} node={Moon} />;
}

export function ArrowRightIcon(props: IconProps) {
  return <StrokeIcon {...props} node={ArrowRight} />;
}

export function CopyIcon(props: IconProps) {
  return <StrokeIcon {...props} node={Copy} />;
}

export function CheckIcon(props: IconProps) {
  return <StrokeIcon {...props} node={Check} />;
}

export function MailIcon(props: IconProps) {
  return <StrokeIcon {...props} node={Mail} />;
}
