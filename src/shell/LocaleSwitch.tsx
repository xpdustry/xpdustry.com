import { useLocation } from "@tanstack/react-router";
import { useGT, useLocale, useSetLocale } from "gt-tanstack-start";
import { useId, type MouseEvent } from "react";
import { withLocale } from "#app/i18n/localePath";
import { LOCALES, localeInfo } from "#app/i18n/locales";
import { Check } from "#app/ui/icons";
import { PlinthButton } from "#app/ui/Plinth";
import { moving } from "./usePopovers";
import * as styles from "./LocaleSwitch.css";

/** The page's language as a button, opening the list of the languages the site is served in. */
export function LocaleSwitch({ className }: { className?: string }) {
  const gt = useGT();
  const locale = useLocale();
  const list = useId();

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <PlinthButton
        tone="ink"
        className={styles.button}
        aria-label={gt("Language: {language}", { language: localeInfo(locale).name })}
        popoverTarget={list}
      >
        {locale}
      </PlinthButton>
      <LocaleList id={list} popover className={styles.panel} />
    </div>
  );
}

/**
 * A click the page may handle itself: the main button with no modifier, which would ask the browser
 * for a new tab, a new window or a download.
 */
export function isPlainClick(
  event: Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">
): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * Every language the site is served in, by its own name; the page's is marked. Each is a link to
 * this page in that language, which is all a browser without JavaScript has. Once hydrated, a
 * choice also goes through `setLocale`, which records it before leaving.
 */
export function LocaleList({
  id,
  popover,
  className
}: {
  id?: string;
  popover?: boolean;
  className?: string;
}) {
  const gt = useGT();
  const current = useLocale();
  const setLocale = useSetLocale();
  const { pathname, searchStr } = useLocation();
  return (
    <ul
      id={id}
      popover={popover ? "auto" : undefined}
      className={`${styles.list} ${className ?? ""}`}
      aria-label={gt("Language")}
      {...(popover ? moving : {})}
    >
      {LOCALES.map((locale) => (
        <li key={locale}>
          <LocaleOption
            locale={locale}
            href={withLocale(pathname, locale) + searchStr}
            current={locale === current}
            choose={setLocale}
          />
        </li>
      ))}
    </ul>
  );
}

function LocaleOption({
  locale,
  href,
  current,
  choose
}: {
  locale: string;
  href: string;
  current: boolean;
  choose: (locale: string) => void;
}) {
  return (
    <a
      href={href}
      hrefLang={locale}
      lang={locale}
      className={styles.option}
      aria-current={current ? "true" : undefined}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        if (!current) choose(locale);
      }}
    >
      <span className={styles.code}>{locale}</span>
      {localeInfo(locale).name}
      {current && <Check className={styles.tick} />}
    </a>
  );
}
