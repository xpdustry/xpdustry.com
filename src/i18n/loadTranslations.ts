/** A locale's translations, as `pnpm translations` writes them into `src/_gt`. */
export default async function loadTranslations(locale: string) {
  const translations = await import(`../_gt/${locale}.json`);
  return translations.default;
}
