import { useLocation } from "@solidjs/router";
import { For, Show, createEffect, createSignal, onSettled } from "solid-js";
import logoMonochrome from "#app/assets/logo-monochrome.svg";
import { ThemeToggle } from "#app/components/layout/ThemeToggle";
import { CloseIcon, DiscordIcon, GitHubIcon, MenuIcon } from "#app/components/system/Icons";
import { Button, ButtonLink } from "#app/components/system/Pressable";
import { NAV_LINKS, SITE } from "#app/data/site";

/**
 * The header, and the drawer that replaces its nav below 900px.
 *
 * The drawer is a disclosure, not a modal: it pushes the page down rather
 * than covering it, so there is nothing to trap focus inside. Escape closes
 * it and returns focus to the button that opened it, and navigating closes it
 * too. A drawer left open over the page you just asked for is a bug.
 */
export function SiteHeader() {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  const [scrolled, setScrolled] = createSignal(false);
  let burger: HTMLButtonElement | undefined;

  const isCurrent = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  // Any navigation closes the drawer, however it was triggered.
  createEffect(
    () => location.pathname,
    () => {
      setOpen(false);
    },
    { defer: true },
  );

  /**
   * The bar only appears once the page has moved under it.
   *
   * Read on mount as well as on scroll: a restored scroll position or a link
   * to a fragment lands mid-page without ever firing an event, and a header
   * that is transparent over the middle of an article is unreadable.
   */
  onSettled(() => {
    const sync = () => setScrolled(window.scrollY > 4);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  });

  onSettled(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open()) return;
      setOpen(false);
      burger?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  return (
    // An open drawer is a solid panel hanging off the bar, so the bar has to
    // be solid too, however little the page has scrolled.
    <header
      class="site sticky top-0 z-50 border-b-2 border-transparent bg-transparent"
      data-scrolled={scrolled() || open() ? "true" : "false"}
    >
      <div class="wrap flex min-h-19 items-center gap-4 py-3">
        <a
          class="inline-flex items-center gap-3 text-inherit no-underline"
          href="/"
          aria-label={`${SITE.name} home`}
        >
          <img class="size-9.5 dark:invert" src={logoMonochrome} alt="" width="38" height="38" />
          <span class="text-2xl leading-none font-extrabold tracking-tight stretch-110">
            {SITE.name}
          </span>
        </a>

        <nav class="ml-4 hidden gap-1 lg:flex" aria-label="Main">
          <For each={NAV_LINKS}>
            {(link) => (
              <a
                class="inline-flex h-8.5 items-center rounded-md px-3 text-sm font-semibold text-ink-muted no-underline transition-colors hover:bg-panel hover:text-ink aria-[current=page]:bg-panel aria-[current=page]:text-ink"
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
              >
                {link.label}
              </a>
            )}
          </For>
        </nav>

        {/* Icon-only at every width, and the burger belongs in here with them:
            it is the third control in the row, and parked outside it picked up
            the header's own gap on one side and the row's on the other, so the
            spacing between three identical squares came out uneven. */}
        <div class="ml-auto flex items-center gap-2">
          <ButtonLink
            variant="accent"
            icon
            href={SITE.github}
            rel="noreferrer"
            aria-label="Xpdustry on GitHub"
            title="GitHub"
          >
            <GitHubIcon />
          </ButtonLink>
          <ButtonLink
            variant="accent"
            icon
            href={SITE.discord}
            rel="noreferrer"
            aria-label="Xpdustry on Discord"
            title="Discord"
          >
            <DiscordIcon />
          </ButtonLink>
          <ThemeToggle class="hidden lg:inline-block" />

          <Button
            ref={(el: HTMLButtonElement) => (burger = el)}
            class="inline-block lg:hidden"
            variant="plain"
            icon
            aria-expanded={open() ? "true" : "false"}
            aria-controls="site-drawer"
            aria-label={open() ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open())}
          >
            <Show when={open()} fallback={<MenuIcon />}>
              <CloseIcon />
            </Show>
          </Button>
        </div>
      </div>

      <Show when={open()}>
        <div class="border-t-2 border-line-soft bg-page lg:hidden" id="site-drawer">
          <nav class="wrap grid gap-3 py-6" aria-label="Main">
            <For each={NAV_LINKS}>
              {(link) => (
                <ButtonLink
                  block
                  variant="plain"
                  href={link.href}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                >
                  {link.label}
                </ButtonLink>
              )}
            </For>
            {/* No GitHub or Discord: the bar above carries both at every
                width, and the drawer is open directly underneath it. */}
            <ThemeToggle block showLabel />
          </nav>
        </div>
      </Show>
    </header>
  );
}
