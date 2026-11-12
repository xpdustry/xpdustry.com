import { useGT, useLocale, useSetLocale } from "gt-tanstack-start";
import { useId, type RefObject } from "react";
import { PlinthButton } from "#app/components/ui/Plinth";
import { LOCALES, localeInfo } from "#app/i18n/locales";
import { Check } from "#app/lib/icons";
import * as styles from "./LocaleSwitch.css";

interface LocaleSwitchProps {
  className?: string;
  button: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onToggle: () => void;
}

/** The page's language as a button, opening the list of the languages the site is served in. */
export function LocaleSwitch({ className, button, open, onToggle }: LocaleSwitchProps) {
  const gt = useGT();
  const locale = useLocale();
  const list = useId();

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <PlinthButton
        ref={button}
        tone="ink"
        className={styles.button}
        aria-label={gt("Language: {language}", { language: localeInfo(locale).name })}
        aria-expanded={open}
        aria-controls={list}
        onClick={onToggle}
      >
        {locale}
      </PlinthButton>
      <LocaleList id={list} className={`${styles.panel} ${open ? styles.open : ""}`} />
    </div>
  );
}

/** Every language the site is served in, by its own name; the page's is marked. */
export function LocaleList({ id, className }: { id?: string; className?: string }) {
  const gt = useGT();
  const current = useLocale();
  const setLocale = useSetLocale();
  return (
    <ul id={id} className={`${styles.list} ${className ?? ""}`} aria-label={gt("Language")}>
      {LOCALES.map((locale) => (
        <li key={locale}>
          <button
            type="button"
            lang={locale}
            className={styles.option}
            aria-current={locale === current ? "true" : undefined}
            onClick={() => locale !== current && setLocale(locale)}
          >
            <span className={styles.code}>{locale}</span>
            {localeInfo(locale).name}
            {locale === current && <Check className={styles.tick} />}
          </button>
        </li>
      ))}
    </ul>
  );
}
