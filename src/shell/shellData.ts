import type { getTranslationsSnapshot } from "gt-tanstack-start";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { playerCount, type LiveData, type PlayerCount } from "#app/status/live";

interface ShellLoaderData {
  live: LiveData;
  locale: string;
  translations: Awaited<ReturnType<typeof getTranslationsSnapshot>>;
}

const STILL_CHECKING: PlayerCount = { state: "polling" };

const BEFORE_ROOT_LOADED = { locale: DEFAULT_LOCALE, translations: {}, players: STILL_CHECKING };

export function shellData(loaded: ShellLoaderData | undefined) {
  if (!loaded) return BEFORE_ROOT_LOADED;
  return {
    locale: loaded.locale,
    translations: loaded.translations,
    players: playerCount(loaded.live.servers.servers)
  };
}
