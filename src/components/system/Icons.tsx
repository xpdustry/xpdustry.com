import type { JSX } from "@solidjs/web";
import { siDiscord, siGithub } from "simple-icons";
import { omit, type ParentProps } from "solid-js";

export type IconProps = JSX.SvgSVGAttributes<SVGSVGElement>;

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

// Keep these paths as static JSX. Rendering Lucide's node arrays with
// <For>/<Dynamic> shifts Solid 2 hydration keys and leaves the shell unclaimed.
function StrokeIcon(props: ParentProps<IconProps>) {
  const rest = omit(props, "children");
  return (
    <svg {...STROKE_ATTRIBUTES} {...rest} aria-hidden="true">
      {props.children}
    </svg>
  );
}

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

// from lucide: https://lucide.dev/icons/menu
export function MenuIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/x
export function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/chevron-down
export function ChevronDownIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/sun
export function SunIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/moon
export function MoonIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/arrow-right
export function ArrowRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/copy
export function CopyIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/check
export function CheckIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </StrokeIcon>
  );
}

// from lucide: https://lucide.dev/icons/mail
export function MailIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </StrokeIcon>
  );
}
