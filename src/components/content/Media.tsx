import type { JSX } from "@solidjs/web";

/**
 * Post media. Both variants take explicit dimensions so the browser reserves
 * the space before the file arrives and the text below does not jump.
 */

export interface PostImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

export function PostImage(props: PostImageProps) {
  return (
    <figure class="media my-8">
      <span class="block overflow-hidden rounded-2xl border-2 border-line bg-page-sunk leading-none">
        <img
          src={props.src}
          alt={props.alt}
          width={props.width}
          height={props.height}
          loading="lazy"
          decoding="async"
        />
      </span>
      {props.caption && (
        <figcaption class="mt-3 text-center text-sm text-ink-faint">{props.caption}</figcaption>
      )}
    </figure>
  );
}

export interface PostVideoProps {
  src: string;
  poster: string;
  width: number;
  height: number;
  caption?: string;
  /** Shown when the browser cannot play the file, and read by screen readers. */
  fallback: JSX.Element;
}

export function PostVideo(props: PostVideoProps) {
  return (
    <figure class="media my-8">
      <span class="block overflow-hidden rounded-2xl border-2 border-line bg-page-sunk leading-none">
        {/* Controls, no autoplay: a video that starts itself is hostile on a
            metered connection and ignores reduced-motion preferences. */}
        <video
          controls
          preload="metadata"
          poster={props.poster}
          width={props.width}
          height={props.height}
        >
          <source src={props.src} type="video/mp4" />
          <span class="block p-4 text-sm text-ink-muted">{props.fallback}</span>
        </video>
      </span>
      {props.caption && (
        <figcaption class="mt-3 text-center text-sm text-ink-faint">{props.caption}</figcaption>
      )}
    </figure>
  );
}
