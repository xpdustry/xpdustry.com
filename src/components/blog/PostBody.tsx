import type { MarkdownDocument } from "@tanstack/markdown";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import type { ComponentProps, ReactNode } from "react";
import { POST_ELEMENTS } from "#app/content/elements";
import styles from "./PostBody.module.css";

// The custom elements `vite/markdown.ts` emits, with the string properties it validated.
interface CalloutProps {
  kind: string;
  title: string;
  children?: ReactNode;
}

interface MediaProps {
  src: string;
  width: string;
  height: string;
  caption?: string;
  children?: ReactNode;
}

function Callout({ kind, title, children }: CalloutProps) {
  return (
    <aside className={`${styles.callout} ${styles[kind] ?? styles.note}`}>
      <span className={styles.label}>{title}</span>
      {children}
    </aside>
  );
}

function PostImage({ src, alt, width, height, caption }: MediaProps & { alt: string }) {
  return (
    <figure>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function PostVideo({
  src,
  poster,
  width,
  height,
  caption,
  children,
}: MediaProps & { poster: string }) {
  return (
    <figure>
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- silent screen recordings, described by their fallback */}
      <video controls preload="metadata" poster={poster} width={width} height={height}>
        <source src={src} type="video/mp4" />
        {children}
      </video>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Links off the site open in a new tab; the site's own stay in this one. */
function Anchor({ children, ...props }: ComponentProps<"a">) {
  const external = /^https?:\/\//.test(props.href ?? "");
  return (
    <a {...props} {...(external && { target: "_blank", rel: "noreferrer" })}>
      {children}
    </a>
  );
}

const components = {
  a: Anchor,
  [POST_ELEMENTS.callout]: Callout,
  [POST_ELEMENTS.image]: PostImage,
  [POST_ELEMENTS.video]: PostVideo,
} satisfies MarkdownComponents;

/** A post's body, from the AST its Markdown was compiled into at build time. */
export function PostBody({ document }: { document: MarkdownDocument }) {
  return (
    <div className={styles.prose}>
      <Markdown components={components}>{document}</Markdown>
    </div>
  );
}
