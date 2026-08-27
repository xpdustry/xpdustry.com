import logoMonochrome from "#app/assets/logo-monochrome.svg";
import { SITE } from "#app/data/site";

export function SiteFooter() {
  return (
    <footer class="relative border-t-2 border-line bg-page py-16">
      <div class="footer-layout wrap grid gap-12">
        <div class="flex flex-col items-start justify-between gap-8">
          <a
            class="inline-flex items-center gap-3 text-inherit no-underline"
            href="/"
            aria-label={`${SITE.name} home`}
          >
            <img class="size-8.5 dark:invert" src={logoMonochrome} alt="" width="34" height="34" />
            <span class="text-lg leading-none font-extrabold tracking-tight stretch-110">
              {SITE.name}
            </span>
          </a>
          <small class="block text-sm text-ink-faint">© 2026 {SITE.name}</small>
        </div>

        {/* Two groups, split by what the link does: pages on this site, and
            ways to reach the people behind it. The old third column held one
            mailto under a heading that said "Contact" next to a heading that
            said "Elsewhere", which named nothing a reader was looking for. */}
        <div class="footer-nav-grid grid content-start gap-x-8 gap-y-6">
          <div class="grid content-start gap-2">
            <h2 class={footerHeading}>Site</h2>
            <a class={footerLink} href="/">
              Home
            </a>
            <a class={footerLink} href="/blog">
              Blog
            </a>
          </div>
          <div class="grid content-start gap-2">
            <h2 class={footerHeading}>Contact</h2>
            <a class={footerLink} href={SITE.discord} rel="noreferrer">
              Discord
            </a>
            <a class={footerLink} href={SITE.github} rel="noreferrer">
              GitHub
            </a>
            {/* The address itself, not the word "Email": one fewer click to
                find out where a mail would go. */}
            <a class={footerLink} href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerHeading =
  "mb-1 font-mono text-data font-medium tracking-wider text-ink-faint uppercase";
const footerLink =
  "inline-flex min-h-6.5 items-center text-sm font-semibold text-ink-muted no-underline hover:text-ink hover:underline hover:underline-offset-3";
