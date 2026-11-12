import framesUrl from "./logo-frames.webp";

let loading: Promise<HTMLImageElement | undefined> | undefined;

/**
 * The relief logo's frames (`LOGO_FRAME_SHEET` in `frames.ts`), decoded, or nothing when the browser
 * could not load them: leaving the page mid-download cancels the decode. A failure is not kept, so
 * the next caller tries again.
 */
export function loadLogoFrames(): Promise<HTMLImageElement | undefined> {
  loading ??= (async () => {
    const sheet = new Image();
    sheet.src = framesUrl;
    try {
      await sheet.decode();
      return sheet;
    } catch {
      loading = undefined;
      return undefined;
    }
  })();
  return loading;
}
