import { useGT } from "gt-tanstack-start";
import { Message } from "#app/components/site/Message";
import { PlinthLink } from "#app/components/ui/Plinth";
import { SITE } from "#app/data/site";

export function NotFound() {
  const gt = useGT();
  return (
    <>
      <title>{`${gt("Page not found")} - ${SITE.name}`}</title>
      <meta name="description" content={gt("That page does not exist on the Xpdustry site.")} />
      <meta name="robots" content="noindex" />
      <Message code="404" title={gt("Oh no, this page does not exist")}>
        <p>{gt("Here's the way back.")}</p>
        <PlinthLink to="/">{gt("Home")}</PlinthLink>
      </Message>
    </>
  );
}
