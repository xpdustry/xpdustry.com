import { useLocation } from "@solidjs/router";
import { For, Show, createEffect, createSignal, onSettled } from "solid-js";
import { ThemeToggle } from "#app/components/layout/ThemeToggle";
import { CloseIcon, DiscordIcon, GitHubIcon, MenuIcon } from "#app/components/system/Icons";
import { Button, ButtonLink } from "#app/components/system/Pressable";
import { NAV_LINKS, SITE } from "#app/data/site";
import * as styles from "#app/components/layout/SiteHeader.css";

export function SiteHeader() {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  const [scrolled, setScrolled] = createSignal(false);
  let burger: HTMLButtonElement | undefined;

  const isCurrent = (href: string) =>
    href === "/"
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(`${href}/`);

  createEffect(
    () => location.pathname,
    () => {
      setOpen(false);
    },
    { defer: true },
  );

  onSettled(() => {
    const syncScroll = () => setScrolled(window.scrollY > 4);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open()) return;
      setOpen(false);
      burger?.focus();
    };

    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("scroll", syncScroll);
      document.removeEventListener("keydown", closeOnEscape);
    };
  });

  const raised = () => scrolled() || open();

  return (
    <header class={styles.header} data-scrolled={raised() ? "true" : "false"}>
      <div class={styles.headerLayout}>
        <a class={styles.brand} href="/" aria-label={`${SITE.name} home`}>
          <span class={styles.headerLogo} aria-hidden="true" />
          <span class={styles.brandName}>{SITE.name}</span>
        </a>

        <nav class={styles.desktopNav} aria-label="Main">
          <For each={NAV_LINKS}>
            {(link) => {
              const current = () => isCurrent(link.href);
              return (
                <a
                  class={styles.navLink}
                  href={link.href}
                  aria-current={current() ? "page" : undefined}
                >
                  {link.label}
                </a>
              );
            }}
          </For>
        </nav>

        <div class={styles.controls}>
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
          <span class={styles.desktopControl}>
            <ThemeToggle />
          </span>

          <span class={styles.mobileControl}>
            <Button
              ref={(element) => {
                burger = element;
              }}
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
          </span>
        </div>
      </div>

      <Show when={open()}>
        <div class={styles.drawer} id="site-drawer">
          <nav class={styles.drawerNav} aria-label="Main">
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
            <ThemeToggle block showLabel />
          </nav>
        </div>
      </Show>
    </header>
  );
}
