import { Link, Meta, Title } from "@solidjs/meta";
import { SITE } from "#app/data/site";

export interface PageMetaProps {
  title: string;
  description: string;
  /** Site-relative, e.g. `/blog/back-to-java`. */
  path: string;
  type?: "website" | "article";
  publishedAt?: string;
}

export function PageMeta(props: PageMetaProps) {
  const fullTitle = () => (props.title === SITE.name ? SITE.name : `${props.title} - ${SITE.name}`);
  const url = () => `${SITE.origin}${props.path}`;

  return (
    <>
      <Title>{fullTitle()}</Title>
      <Meta name="description" content={props.description} />
      <Link rel="canonical" href={url()} />

      <Meta property="og:type" content={props.type ?? "website"} />
      <Meta property="og:site_name" content={SITE.name} />
      <Meta property="og:title" content={fullTitle()} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:url" content={url()} />
      <Meta property="og:image" content={`${SITE.origin}/og.png`} />
      <Meta property="og:image:width" content="1200" />
      <Meta property="og:image:height" content="630" />
      <Meta property="og:image:alt" content={SITE.name} />

      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={fullTitle()} />
      <Meta name="twitter:description" content={props.description} />
      <Meta name="twitter:image" content={`${SITE.origin}/og.png`} />

      {props.publishedAt && <Meta property="article:published_time" content={props.publishedAt} />}
    </>
  );
}
