/** Site-wide constants: one place to change a URL or a description. */

export const SITE = {
  name: "Xpdustry",
  /** The one sentence the whole site exists to say. */
  positioning: "Pretty cool Mindustry tools.",
  description:
    "We build open-source software for Mindustry, and also run the Chaotic Neutral Mindustry servers.",
  github: "https://github.com/xpdustry",
  discord: "https://discord.xpdustry.com",
  email: "contact@xpdustry.com",
  /** Absolute base for canonical links and social metadata. */
  origin: "https://www.xpdustry.com",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
] as const;
