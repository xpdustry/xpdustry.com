import { Link, Meta, Title } from "@solidjs/meta";
import { Show } from "solid-js";
import { BLOG_DESCRIPTION, SITE } from "#app/data/site";

export interface PageImage {
  /** Site-relative, e.g. `/og/home.png`. */
  url: string;
  width: number;
  height: number;
  alt: string;
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/** The shared card, used by every page that has no card of its own. */
export const SITE_CARD: PageImage = {
  url: "/og/home.png",
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  alt: `${SITE.name} - ${SITE.positioning}`,
};

export const BLOG_CARD: PageImage = {
  url: "/og/blog.png",
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  alt: `${SITE.name} blog - ${BLOG_DESCRIPTION}`,
};

/** Every post gets its own card, rendered from its frontmatter by `src/routes/og/[...card].ts`. */
export function postCard(slug: string, title: string): PageImage {
  return {
    url: `/og/blog/${slug}.png`,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alt: `${title} - ${SITE.name}`,
  };
}

export interface PageMetaProps {
  title: string;
  description: string;
  /** Site-relative, e.g. `/blog/back-to-java`. */
  path: string;
  type?: "website" | "article";
  image?: PageImage;
  publishedAt?: string;
  updatedAt?: string;
  /** Profile URL of the author, for `article:author`. */
  authorUrl?: string;
}

const IMAGE_TYPES: Record<string, string | undefined> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function PageMeta(props: PageMetaProps) {
  const fullTitle = () => (props.title === SITE.name ? SITE.name : `${props.title} - ${SITE.name}`);
  const url = () => `${SITE.origin}${props.path}`;
  const image = () => props.image ?? SITE_CARD;
  const imageUrl = () => `${SITE.origin}${image().url}`;
  const imageType = () => IMAGE_TYPES[image().url.split(".").pop()?.toLowerCase() ?? ""];

  return (
    <>
      <Title>{fullTitle()}</Title>
      <Meta name="description" content={props.description} />
      <Link rel="canonical" href={url()} />

      <Meta property="og:type" content={props.type ?? "website"} />
      <Meta property="og:site_name" content={SITE.name} />
      <Meta property="og:locale" content="en_US" />
      <Meta property="og:title" content={fullTitle()} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:url" content={url()} />
      <Meta property="og:image" content={imageUrl()} />
      <Show when={imageType()}>{(type) => <Meta property="og:image:type" content={type()} />}</Show>
      <Meta property="og:image:width" content={String(image().width)} />
      <Meta property="og:image:height" content={String(image().height)} />
      <Meta property="og:image:alt" content={image().alt} />

      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={fullTitle()} />
      <Meta name="twitter:description" content={props.description} />
      <Meta name="twitter:image" content={imageUrl()} />
      <Meta name="twitter:image:alt" content={image().alt} />

      {props.publishedAt && <Meta property="article:published_time" content={props.publishedAt} />}
      {props.updatedAt && <Meta property="article:modified_time" content={props.updatedAt} />}
      {props.authorUrl && <Meta property="article:author" content={props.authorUrl} />}
    </>
  );
}
