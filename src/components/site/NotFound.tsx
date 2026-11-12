import { T, useGT } from "gt-tanstack-start";
import { SITE } from "#app/brand/site";
import { Message } from "#app/components/site/Message";
import { PlinthLink } from "#app/ui/Plinth";

export function NotFound() {
  const gt = useGT();
  return (
    <>
      <title>{`${gt("Page not found")} - ${SITE.name}`}</title>
      <meta name="description" content={gt("That page does not exist on the Xpdustry site.")} />
      <meta name="robots" content="noindex" />
      <Message code="404" title={gt("Oh no, this page does not exist")}>
        <p>
          <T>Here's the way back.</T>
        </p>
        <PlinthLink to="/">
          <T>Home</T>
        </PlinthLink>
      </Message>
    </>
  );
}
