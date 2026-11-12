import framesUrl from "#app/assets/logo-frames.webp";

let loading: Promise<HTMLImageElement> | undefined;

/** The relief logo's frames (`FRAMES` in `logo.ts`), decoded. */
export function loadLogoFrames(): Promise<HTMLImageElement> {
  loading ??= (async () => {
    const sheet = new Image();
    sheet.src = framesUrl;
    await sheet.decode();
    return sheet;
  })();
  return loading;
}
