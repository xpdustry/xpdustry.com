import type { getTranslationsSnapshot } from "gt-tanstack-start";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { playerCount, type LiveData, type PlayerCount } from "#app/status/live";

/** What the root route loads for the shell around every page. */
interface ShellLoaderData {
  live: LiveData;
  locale: string;
  translations: Awaited<ReturnType<typeof getTranslationsSnapshot>>;
}

const STILL_CHECKING: PlayerCount = { state: "polling" };

/**
 * What the shell draws with. A page that failed before the root loader finished still gets a
 * shell: in English, untranslated, with the player count still being checked.
 */
export function shellData(loaded: ShellLoaderData | undefined) {
  if (!loaded) return { locale: DEFAULT_LOCALE, translations: {}, players: STILL_CHECKING };
  return {
    locale: loaded.locale,
    translations: loaded.translations,
    players: playerCount(loaded.live.servers.servers)
  };
}
