import { useLocation } from "@tanstack/react-router";
import { Message } from "#app/components/site/Message";
import { PlinthLink } from "#app/components/ui/Plinth";
import { SITE } from "#app/data/site";

export function NotFound() {
  const { pathname } = useLocation();
  return (
    <>
      <title>{`Page not found - ${SITE.name}`}</title>
      <meta name="description" content="That page does not exist on the Xpdustry site." />
      <link rel="canonical" href={`${SITE.origin}${pathname}`} />
      <Message code="404" title="Oh no, this page does not exist">
        <p>Here's the way back.</p>
        <PlinthLink to="/">Home</PlinthLink>
      </Message>
    </>
  );
}
